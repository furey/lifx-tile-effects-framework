require('dotenv').config()
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const Lifx = require('node-lifx-lan')
const { Select } = require('enquirer')
const { log, sleep } = require('./src/utils')

const run = async () => {
  log('Validating config…')
  const config = await getValidConfig()
  log('Getting effects…')
  const effects = await getEffects(config.effectsPath)
  log('Getting options…')
  const options = getOptions(effects)
  log('Finding tile…')
  const { device, tiles, bounds } = await findTile(options)
  log('Selecting effect…')
  const effect = await selectEffect(options, effects)
  log('Getting power…')
  const hasPower = !! await getPower(device)
  if (hasPower) {
    log('Fading out…')
    await fadeOut({ device, tiles })
  }
  log('Flushing tiles…')
  await flushTiles({ device, tiles, effect })
  if (!hasPower) {
    log('Powering on…')
    await powerOn(device)
  }
  log('Creating effect…')
  await createEffect({ device, tiles, bounds, effect })
}

const getValidConfig = async () => {
  const effectsPath = process.env.EFFECTS_PATH
  if (!effectsPath) validationError('Effects path required.')
  if (!(await fs.pathExists(effectsPath))) validationError(`Effects path [${effectsPath}] does not exist.`)
  if (!(await fs.stat(effectsPath)).isDirectory()) validationError(`Effects path [${effectsPath}] is not a directory.`)
  return { effectsPath }
}

const validationError = message =>
  exit(message)

const getOptions = effects => {
  const effectNames = Object.keys(effects)
  return require('yargs')
    .usage('Usage: node $0 [options]') // usage string of application.
    .option('effect', {
      alias: 'e',
      describe: 'Effect name',
      type: 'string',
      choices: effectNames,
    })
    .option('clear-cache', {
      alias: 'c',
      describe: 'Clear device cache',
      type: 'boolean',
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Show debug logs',
      type: 'boolean',
    })
    .version().alias('version', 'V')
    .help().alias('help', 'h')
    .example(`node $0 --effect ${effectNames[0]}`)
    .epilog(getCredits())
    .argv
}

const getCredits = () => `Credits:
  Copyright (c) James Furey (https://github.com/furey)`

const getEffects = async effectsPath => {
  const paths = await fs.readdir(effectsPath, { withFileTypes: true })
  const effects = paths
    .filter(dirent => !dirent.isDirectory())
    .reduce((effects, dirent) => {
      const fileName = dirent.name
      const ext = path.extname(fileName)
      if (!isValidExtension(ext)) return effects
      const effectName = path.basename(fileName, ext)
      const effect = require(path.resolve(effectsPath, fileName))
      if (!isValidEffect(effect)) return effects
      effects[effectName] = effect
      return effects
    }, {})
  if (!Object.keys(effects).length) validationError(`No valid effect files found in [${effectsPath}].`)
  return effects
}

const isValidExtension = ext =>
  ext.toLowerCase() === '.js'

const isValidEffect = effect => {
  if (typeof effect.create !== 'function') return false
  if (typeof effect.getFlushColor !== 'function') return false
  return true
}

const findTile = async options => {
  const tileProductId = 55
  const cachePath = path.resolve(__dirname, 'cache/devices.json')
  let deviceJson = undefined
  let hasDiscoveredDevices = false
  let hasClearedCache = false
  while (!deviceJson) {
    log('Looking for cache…')
    if (!await fs.pathExists(cachePath)) {
      console.log('Discovering LIFX devices…')
      const devices = await Lifx.discover()
      log('Writing cache…')
      await fs.outputJson(cachePath, devices, { spaces: 2 })
      hasDiscoveredDevices = true
    } else if (options.clear && !hasClearedCache) {
    } else if (options['clear-cache'] && !hasClearedCache) {
      console.log('Clearing device cache…')
      await fs.remove(cachePath)
      hasClearedCache = true
      continue
    }
    log('Reading cache…')
    const cache =  await fs.readJson(cachePath)
    log('Searching cache for tile…')
    const tiles = cache.filter(device => device.deviceInfo.productId === tileProductId)
    if (tiles.length > 1) {
      deviceJson = await selectTile(tiles)
      break
    }
    if (tiles.length === 1) {
      deviceJson = tiles[0]
      break
    }
    log('Tile not found in cache.')
    if (hasDiscoveredDevices) await exit('No tile found.')
    log('Clearing cache…')
    await fs.unlink(cachePath)
    console.log('Finding tile…')
  }
  log('Creating device…')
  const device = await Lifx.createDevice({
    mac: deviceJson.mac,
    ip: deviceJson.ip,
  })
  log('Getting tiles/bounds…')
  const { tiles, bounds } = await device.tileGetTilesAndBounds()
    .catch(_ => exit('Tile not responding.'))
  return { device, tiles, bounds }
}

const selectTile = async devices => {
  const prompt = new Select({
    name: 'tile',
    message: 'Choose a tile',
    choices: devices.map(deviceLabel)
  })  
  const selected = await prompt.run()
    .catch(_ => exit('No tile chosen.'))
  return devices.find(device => deviceLabel(device) === selected)
}

const deviceLabel = device =>
  `${device.deviceInfo.label} [${device.mac}]`

const selectEffect = async (options, effects) => {
  const effectNames = Object.keys(effects)
  const selected = options.effect
    || (effectNames.length === 1 ? effectNames[0] : false)
    || await selectEffectName(effectNames)
  onSelected(selected)
  return effects[selected]
}

const selectEffectName = async effectNames => {
  const prompt = new Select({
    name: 'effect',
    message: 'Choose an effect',
    choices: effectNames
  })  
  return await prompt.run()
    .catch(_ => exit('No effect chosen.'))
}

const onSelected = effect =>
  console.log(`Starting ${chalk.cyan(effect)} effect… ${chalk.gray('(press [ctrl+c] to exit)')}`)

const fadeOut = async ({ device, tiles }) => {
  const duration = process.env.INSTANT ? 50 : 1000
  const firstTile = tiles[0]
  await device.tileSetTileState64({
    tile_index: firstTile.tile_index,
    length: tiles.length,
    duration,
    colors: Array(firstTile.width * firstTile.height).fill({ hue: 0, saturation: 0, brightness: 0, kelvin: 2500 }),
  }).catch(console.error)
  await sleep(duration)
}

const getPower = async device => {
  const { level } = await device.deviceGetPower()
    .catch(console.error)
  await sleep(50)
  return level
}

const powerOn = async device => {
  await device.deviceSetPower({ level: 1 })
    .catch(console.error)
  await sleep(50)
}

const flushTiles = async ({ device, tiles, effect }) => {
  const firstTile = tiles[0]
  await device.tileSetTileState64({
    tile_index: firstTile.tile_index,
    length: tiles.length,
    duration: 0,
    colors: Array(firstTile.width * firstTile.height).fill(effect.getFlushColor()),
  }).catch(console.error)
  await sleep(500)
}

const createEffect = async ({ device, tiles, bounds, effect }) =>
  await effect.create({ device, tiles, bounds })

const exit = async (message = 'Exiting…') => {
  log('Closing UDP connection…')
  if (Lifx._initialized) await Lifx.destroy()
  console.log(chalk.red(message))
  console.log(chalk.gray('Exiting…'))
  process.exit()
}

module.exports = {
  run,
  utils: require('./src/utils')
}

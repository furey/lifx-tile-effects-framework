const chalk = require('chalk')

const log = (...params) => {
  const isVerbose = process.argv
    .slice(2)
    .filter(string => /^-v|--verbose$/.test(string))
    .length > 0
  if (!isVerbose) return
  console.log(chalk.gray(...params))
}

const sleep = ms =>
  new Promise(fn => setTimeout(fn, ms))

const inspect = value =>
  require('util').inspect(value, false, null, true)

module.exports = {
  log,
  sleep,
  inspect,
  ...require('./colors'),
}

# lifx-tile-effects-framework

A framework for creating [LIFX Tile](https://www.lifx.com/collections/creative-tiles) effects. 👨‍🔬💡

# Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Example Effects](#example-effects)
- [Example Repositories](#example-repositories)
- [Device Cache](#device-cache)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
- [License](#license)

## Overview

The `lifx-tile-effects-framework` package:

- Discovers and caches your LIFX devices
- Displays a menu for selecting a Tile device
- Auto-selects your Tile device if only one is discovered
- Discovers your custom Tile effect files
- Displays a menu for selecting a Tile effect
- Auto-selects your Tile effect if only one is discovered
- Exposes CLI options to:
  - Run an effect directly (`--effect`, `-e`)
  - Clear your cached devices (`--clear-cache`, `-c`)
  - Display a help screen (`--help`, `-h`)

## Requirements

- [`node -v`](https://nodejs.org/en/download/current/) >= `v12.10.*`
- [`npm -v`](https://www.npmjs.com/get-npm) >= `6.10.*`
- One or more [LIFX Tiles](https://www.lifx.com/collections/creative-tiles) accessible via LAN

## Installation

```console
$ npm install furey/lifx-tile-effects-framework#semver:^v1
```

## Usage

Add the following code block to your script:

```JavaScript
// example.js

require('lifx-tile-effects-framework')
  .run()
  .catch(console.error)
```

Assuming your configured [`EFFECTS_PATH`](#effects-path) contained the [effect files](#effect-files)…

- `effect-1.js`
- `effect-2.js`
- `etc.js`

…running the `example.js` script above would log the following output:

```console
$ node example.js

? Choose an effect …
  effect-1
❯ effect-2
  etc

✔ Choose an effect · effect-2
Starting effect-2 effect… (press [ctrl+c] to exit)
```

## Configuration

### Effects Path

Add the following `.env` file to your repository root:

```ini
EFFECTS_PATH=path/to/my/effects/directory
```

Set `EFFECTS_PATH` to the directory containing your effect files.

### Effect Files

Add one or more effect files into your `EFFECTS_PATH` directory:

```
path/to/my/effects/directory
├── effect-1.js
├── effect-2.js
└── etc.js
```

Effect files must conform to the following interface:

```JavaScript
module.exports = class {

  // Color to flush tiles with before effect runs…
  static getFlushColor()

  // Effect instantiation method…
  static async create({ device, tiles, bounds })

}
```

For example implementations, see the [Example Effects](#example-effects) section below.

### Effect Interface

#### `getFlushColor()`

The `getFlushColor` method must return a [`LifxLanColor`](https://github.com/furey/node-lifx-lan/tree/feature/tile-support#lifxlancolor-object) object to flush your tiles with before your effect is instantiated.

#### `create()`

The `create` method receives an object containing the following properties to instantiate your effect with:

|Property|Description|Documentation|
|---|---|---|
|`device`|A LIFX device object|See: [`LifxLanDevice`](https://github.com/furey/node-lifx-lan/tree/feature/tile-support#LifxLanDevice-object)|
|`tiles`|An array of tile objects|See: [`tileGetTiles()`](https://github.com/furey/node-lifx-lan/tree/feature/tile-support#tilegettiles-method)|
|`bounds`|A spacial bounds object|See: [`tileGetTilesAndBounds()`](https://github.com/furey/node-lifx-lan/tree/feature/tile-support#tilegettilesandbounds-method)|

## Example Effects

The following example effect files are outlined below:

- [Random Color Effect](#random-color-effect)
- [Random Colors Effect](#random-colors-effect)
- [Random Pixels Effect](#random-pixels-effect)

### Random Color Effect

Sets all tiles to the same random color every second:

```JavaScript
module.exports = class {

  static getFlushColor() {
    return { saturation: 1, brightness: 0, kelvin: 9000 }
  }

  static async create({ device, tiles }) {
    return await (new this({ device, tiles })).boot()
  }

  constructor({ device, tiles }) {
    this.device = device
    this.tiles = tiles
  }

  async boot() {
    await this.step()  
    setInterval(async () => await this.step(), 1000)
  }

  async step() {
    await this.device.tileSetTileState64({
      tile_index: this.tiles[0].tile_index,
      length: this.tiles.length,
      colors: [...Array(64)].fill({
        hue: Math.floor(Math.random() * 360)/360,
        brightness: 1,
      })
    }).catch(console.error)
  }

}
```

### Random Colors Effect

Sets each tile to a different random color every second:

```JavaScript
module.exports = class {

  static getFlushColor() {
    return { saturation: 1, brightness: 0, kelvin: 9000 }
  }

  static async create({ device, tiles }) {
    return await (new this({ device, tiles })).boot()
  }

  constructor({ device, tiles }) {
    this.device = device
    this.tiles = tiles
  }

  async boot() {
    await this.step()  
    setInterval(async () => await this.step(), 1000)
  }

  async step() {
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i]
      await this.device.tileSetTileState64({
        tile_index: tile.tile_index,
        colors: [...Array(64)].fill({
          hue: Math.floor(Math.random() * 360)/360,
          brightness: 1
        })
      }).catch(console.error)  
    }
  }

}
```

### Random Pixels Effect

Fades each tile's 64 pixels to different random colors every second:

```JavaScript
module.exports = class {

  static getFlushColor() {
    return { saturation: 0, brightness: 0, kelvin: 9000 }
  }

  static async create({ device, tiles }) {
    return await (new this({ device, tiles })).boot()
  }

  constructor({ device, tiles }) {
    this.device = device
    this.tiles = tiles
  }

  async boot() {
    await this.step()  
    setInterval(async () => await this.step(), 1000)
  }

  async step() {
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i]
      await this.device.tileSetTileState64({
        tile_index: tile.tile_index,
        duration: 500,
        colors: [...Array(64)].map(() => ({
          hue: Math.floor(Math.random() * 360)/360,
          saturation: 1,
          brightness: 1,
        }))
      }).catch(console.error)  
    }
  }

}
```

## Example Repositories

See the following repositories for advanced usage examples:

- [lifx-tile-example-effects](https://github.com/furey/lifx-tile-example-effects)
- [lifx-tile-halloween-effects](https://github.com/furey/lifx-tile-halloween-effects)

## Device Cache

To increase the speed of script re-execution, your LIFX devices are cached on first run.

If a new LIFX device is added to your network but not discovered by the framework, refresh your device cache by passing `--clear-cache` the next time you run your script:

```console
$ node example.js --clear-cache

Clearing device cache…
Discovering LIFX devices…
```

## Troubleshooting

### ⚠️ "Effects path required."

`EFFECTS_PATH` value not set (see: [Effects Path](#effects-path)).

### ⚠️ "Effects path […] does not exist."

`EFFECTS_PATH` value can't be found on disk (check `.env` value).

### ⚠️ "Effects path […] is not a directory."

`EFFECTS_PATH` value is a file and not a directory (check `.env` value).

### ⚠️ "No valid effect files found in […]."

`EFFECTS_PATH` does not contain any valid effect files (see: [Effect Files](#effect-files)).

### ⚠️ "No tile found."

No Tile devices were discovered on your LAN (check your device is plugged in and powered on, then clear your [Device Cache](#device-cache) the next time you run your script).

### ⚠️ "Tile not responding."

For unknown reasons your Tile is not responding (exit your script and try again).

### ⚠️ "Error: Timeout."

You're attempting to update your Tiles too quickly (increase the time between updates and try again).

## Credits

This repo builds upon the excellent [node-lifx-lan](https://github.com/furey/node-lifx-lan/tree/feature/tile-support) library by [@futomi](https://github.com/futomi).

## License

ISC License

Copyright (c) 2019, James Furey

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

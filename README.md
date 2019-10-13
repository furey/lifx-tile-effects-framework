# lifx-tile-effects-framework

A framework for creating [LIFX Tile](https://www.lifx.com/collections/creative-tiles) effects. 👨‍🔬💡

# Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
- [License](#license)

## Requirements

- `node -v` >= v12.10.0
- `npm -v` >= 6.10.3
- One or more [LIFX Tiles](https://www.lifx.com/collections/creative-tiles) accessible via LAN

## Installation

```console
$ npm install furey/lifx-tile-effects-framework
```

## Usage

```JavaScript
// example.js

require('lifx-tile-effects-framework')
  .run()
  .catch(console.error)
```

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

Set `EFFECTS_PATH` to the directory containing your effect classes.

### Effect Classes

Add one or more effect classes into your `EFFECTS_PATH` directory:

```
path/to/my/effects/directory
├── effect-1.js
├── effect-2.js
└── etc.js
```

Effect classes must conform to the following interface:

```JavaScript
module.exports = class {

  // Color to flush tiles with before effect runs…
  static getFlushColor()

  // Class instantiation method…
  static async create({ device, tiles, bounds })

}
```

For example implementations, see the [Example Effects](#example-effects) section below.

#### `create()`

The `create` method receives the following deconstructable parameters to instantiate your effect with:

|Param|Description|Docs|
|---|---|---|
|`device`|A device object|[`LifxLanDevice`](https://github.com/furey/node-lifx-lan/tree/feature/tile-support#LifxLanDevice-object)|
|`tiles`|An array of tile objects|[`tileGetTiles()`](https://github.com/furey/node-lifx-lan/tree/feature/tile-support#tilegettiles-method)|
|`bounds`|A spacial bounds object|[`tileGetTilesAndBounds()`](https://github.com/furey/node-lifx-lan/tree/feature/tile-support#tilegettilesandbounds-method)|

#### `getFlushColor()`

The `getFlushColor` method must return a [`LifxLanColor`](https://github.com/furey/node-lifx-lan/tree/feature/tile-support#lifxlancolor-object) object to flush your tiles with before your effect is instantiated.

## Examples

### Example Effects

#### Random Color

Set all tiles to the same random color every second:

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
    await this.updateTiles()
  }

  async updateTiles() {
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

#### Random Colors

Set each tile to a different random color every second:

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
    await this.updateTiles()
  }

  async updateTiles() {
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i]
      await this.device.tileSetTileState64({
        tile_index: tile.tile_index,
        colors: [...Array(64)].fill({
          hue: Math.floor(Math.random() * 360)/360,
          brightness: 1,
        })
      }).catch(console.error)  
    }
  }

}
```

#### Random Pixels

Fade each tile's pixels to different random colors every second:

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
    await this.updateTiles()
  }

  async updateTiles() {
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i]
      await this.device.tileSetTileState64({
        tile_index: tile.tile_index,
        duration: 500,
        colors: [...Array(64)].map(() => ({
          hue: Math.floor(Math.random() * 360)/360,
          brightness: 1,
        }))
      }).catch(console.error)  
    }
  }

}
```

### Example Repositories

See the following repositories for usage examples:

- [lifx-tile-example-effects](https://github.com/furey/lifx-tile-example-effects)
- [lifx-tile-halloween-effects](https://github.com/furey/lifx-tile-halloween-effects)

## Troubleshooting

#### ⚠️ "Effects path required."

`EFFECTS_PATH` value not set (see: [Effects Path](#effects-path)).

#### ⚠️ "Effects path […] does not exist."

`EFFECTS_PATH` value can't be found on disk (check `.env` value).

#### ⚠️ "Effects path […] is not a directory."

`EFFECTS_PATH` value is a file and not a directory (check `.env` value).

#### ⚠️ "No valid effect files found in […]."

`EFFECTS_PATH` does not contain any valid effect files (see: [Effect Classes](#effect-classes)).

#### ⚠️ "No tile found."

No Tile devices were found on your LAN (check Tiles are plugged in and turned on).

#### ⚠️ "Tile not responding."

For unknown reasons your Tile is not responding (quit script and try again).

#### ⚠️ "Error: Timeout."

You're attempting to update your Tiles too quickly (increase the time between updates and try again).

## Credits

This repo builds upon the brilliant [node-lifx-lan](https://github.com/furey/node-lifx-lan/tree/feature/tile-support) library by [@futomi](https://github.com/futomi).

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

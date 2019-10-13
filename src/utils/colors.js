const noColor = { hue: 0, saturation: 1, brightness: 0, kelvin: 2500 } // Off

const parseColors = (colors, merge = undefined) => {
  return colors.map(color => {
    return parseColor(color, merge)
  })
}

const parseColor = (color, merge = undefined) => {
  const isValid = color !== undefined
    && typeof(color) === 'string'
    && color.length
  if (!isValid) return noColor
  const index = color.substr(0, 1).toUpperCase()
  const parsed = {
    'W': { hue: 0, saturation: 0, brightness: 1, kelvin: 4000 }, // White
    'F': { hue: 0, saturation: 0, brightness: 1, kelvin: 9000 }, // Fluorescent White
    'R': { hue: 0, saturation: 1, brightness: 1, kelvin: 9000 }, // Red
    'K': { hue: 22/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Pumpkin
    'O': { hue: 31.2/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Orange
    'Y': { hue: 60.235/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Yellow
    'L': { hue: 67.059/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Lime
    'G': { hue: 106.632/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Green
    'S': { hue: 140/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Slime
    'C': { hue: 180/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Cyan
    'B': { hue: 247.294/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Blue
    'M': { hue: 298.588/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Magenta
    'P': { hue: 336.048/360, saturation: 1, brightness: 1, kelvin: 9000 }, // Pink
  }[index] || noColor
  if (merge) return Object.assign({}, parsed, merge)
  return parsed
}

module.exports = {
  parseColor,
  parseColors
}

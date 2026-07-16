const zlib = require('node:zlib')

const signature = [137, 80, 78, 71, 13, 10, 26, 10]

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upperLeftDistance = Math.abs(estimate - upperLeft)
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left
  return upDistance <= upperLeftDistance ? up : upperLeft
}

function decodeRgbaPng(png) {
  if (!signature.every((byte, index) => png[index] === byte)) throw new Error('Invalid PNG signature')

  let width
  let height
  let bitDepth
  let colorType
  let interlace
  const idat = []

  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset)
    const type = png.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length

    if (type === 'IHDR') {
      width = png.readUInt32BE(dataStart)
      height = png.readUInt32BE(dataStart + 4)
      bitDepth = png[dataStart + 8]
      colorType = png[dataStart + 9]
      interlace = png[dataStart + 12]
    } else if (type === 'IDAT') {
      idat.push(png.subarray(dataStart, dataEnd))
    } else if (type === 'IEND') {
      break
    }

    offset = dataEnd + 4
  }

  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error('Expected a non-interlaced 8-bit RGBA PNG')
  }

  const bytesPerPixel = 4
  const stride = width * bytesPerPixel
  const source = zlib.inflateSync(Buffer.concat(idat))
  const pixels = Buffer.alloc(height * stride)
  let sourceOffset = 0

  for (let y = 0; y < height; y += 1) {
    const filter = source[sourceOffset]
    sourceOffset += 1

    for (let x = 0; x < stride; x += 1) {
      const raw = source[sourceOffset]
      sourceOffset += 1
      const outputOffset = y * stride + x
      const left = x >= bytesPerPixel ? pixels[outputOffset - bytesPerPixel] : 0
      const up = y > 0 ? pixels[outputOffset - stride] : 0
      const upperLeft = y > 0 && x >= bytesPerPixel ? pixels[outputOffset - stride - bytesPerPixel] : 0
      let predictor

      if (filter === 0) predictor = 0
      else if (filter === 1) predictor = left
      else if (filter === 2) predictor = up
      else if (filter === 3) predictor = Math.floor((left + up) / 2)
      else if (filter === 4) predictor = paeth(left, up, upperLeft)
      else throw new Error(`Unsupported PNG filter ${filter}`)

      pixels[outputOffset] = (raw + predictor) & 0xff
    }
  }

  return {
    width,
    height,
    alphaAt(x, y) {
      return pixels[y * stride + x * bytesPerPixel + 3]
    },
  }
}

function alphaBounds(image, threshold = 0) {
  let left = image.width
  let right = -1
  let top = image.height
  let bottom = -1
  let visiblePixels = 0

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.alphaAt(x, y) <= threshold) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
      visiblePixels += 1
    }
  }

  if (!visiblePixels) throw new Error('PNG contains no visible pixels')
  return { left, right, top, bottom, visiblePixels, bottomPadding: image.height - bottom - 1 }
}

module.exports = { decodeRgbaPng, alphaBounds }

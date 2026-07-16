const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { decodeRgbaPng, alphaBounds } = require('./png-alpha')

const assetPath = path.join(__dirname, '..', 'assets', 'rino-footer-grip-3d.png')

test('footer mascot has real transparency and two visible hands at its lower alpha bound', () => {
  assert.equal(fs.existsSync(assetPath), true)

  const png = fs.readFileSync(assetPath)
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  const image = decodeRgbaPng(png)
  assert.ok(image.width >= 800)
  assert.ok(image.height >= 800)

  for (const [x, y] of [[0, 0], [image.width - 1, 0], [0, image.height - 1], [image.width - 1, image.height - 1]]) {
    assert.equal(image.alphaAt(x, y), 0, `corner ${x},${y} must be fully transparent`)
  }

  const bounds = alphaBounds(image)
  assert.ok(bounds.visiblePixels > 0)
  assert.equal(bounds.bottomPadding, 69, 'bottom padding must be derived from the decoded alpha bound')

  let leftHandPixels = 0
  let rightHandPixels = 0
  for (let y = bounds.bottom - 3; y <= bounds.bottom; y += 1) {
    for (let x = bounds.left; x <= bounds.right; x += 1) {
      if (image.alphaAt(x, y) <= 10) continue
      if (x < image.width / 2) leftHandPixels += 1
      else rightHandPixels += 1
    }
  }

  assert.ok(leftHandPixels > 0, 'left hand region must remain visible in the lowest alpha rows')
  assert.ok(rightHandPixels > 0, 'right hand region must remain visible in the lowest alpha rows')
})

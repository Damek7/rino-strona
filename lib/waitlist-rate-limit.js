const attempts = new Map()

function isAllowed(key, now = Date.now()) {
  const record = attempts.get(key) || { start: now, count: 0 }
  if (now - record.start > 60_000) {
    record.start = now
    record.count = 0
  }
  record.count += 1
  attempts.set(key, record)
  return record.count <= 30
}

module.exports = { isAllowed }

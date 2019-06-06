'use strict'

module.exports = (inp, keep = 3) => {
  const len = inp.length
  const numAsterisks = len - keep
  const asterisks = Array(numAsterisks + 1).join('*')
  const keepStr = inp.substr(numAsterisks)
  return asterisks + keepStr
}

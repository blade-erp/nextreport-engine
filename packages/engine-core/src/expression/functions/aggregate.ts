import { registerFunction } from './registry.js'
import { toString } from '../coerce.js'
import { ZERO, add, quotient, isZero, toDecimalLenient, toResult } from '../decimal.js'

// Aggregates coerce numeric strings ("5427.20" — common when rows come from a
// database driver serializing decimals) instead of silently treating them as 0.
registerFunction('sum', (args, _locale) => {
  const [array, field] = args
  if (!Array.isArray(array)) return 0
  if (field !== undefined) {
    const fieldName = toString(field)
    return toResult(
      array.reduce((acc, item: unknown) => {
        const record = item as Record<string, unknown>
        return add(acc, toDecimalLenient(record[fieldName]))
      }, ZERO),
    )
  }
  return toResult(array.reduce((acc, item: unknown) => add(acc, toDecimalLenient(item)), ZERO))
})

registerFunction('count', (args, _locale) => {
  const [array] = args
  if (!Array.isArray(array)) return 0
  return array.length
})

registerFunction('avg', (args, _locale) => {
  const [array, field] = args
  if (!Array.isArray(array) || array.length === 0) return 0
  if (field !== undefined) {
    const fieldName = toString(field)
    const total = array.reduce((acc, item: unknown) => {
      const record = item as Record<string, unknown>
      return add(acc, toDecimalLenient(record[fieldName]))
    }, ZERO)
    return toResult(quotient(total, toDecimalLenient(array.length)))
  }
  const total = array.reduce((acc, item: unknown) => add(acc, toDecimalLenient(item)), ZERO)
  return toResult(quotient(total, toDecimalLenient(array.length)))
})

// ratio(items, 'numeratorField', 'denominatorField') → sum(num) / sum(den).
// This is the ratio-of-sums an aggregate percentage needs (an on-time rate, a
// margin percent); averaging the per-row ratios would give a different, and
// for these measures wrong, answer.
registerFunction('ratio', (args, _locale) => {
  const [array, numeratorField, denominatorField] = args
  if (!Array.isArray(array)) return 0
  const numName = toString(numeratorField)
  const denName = toString(denominatorField)
  let numerator = ZERO
  let denominator = ZERO
  for (const item of array) {
    const record = item as Record<string, unknown>
    numerator = add(numerator, toDecimalLenient(record[numName]))
    denominator = add(denominator, toDecimalLenient(record[denName]))
  }
  return isZero(denominator) ? 0 : toResult(quotient(numerator, denominator))
})

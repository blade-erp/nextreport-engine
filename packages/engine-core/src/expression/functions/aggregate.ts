import { registerFunction } from './registry.js'
import { toString } from '../coerce.js'

// Aggregates coerce numeric strings ("5427.20" — common when rows come from a
// database driver serializing decimals) instead of silently treating them as 0.
function toAddend(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

registerFunction('sum', (args, _locale) => {
  const [array, field] = args
  if (!Array.isArray(array)) return 0
  if (field !== undefined) {
    const fieldName = toString(field)
    return array.reduce((acc: number, item: unknown) => {
      const record = item as Record<string, unknown>
      return acc + toAddend(record[fieldName])
    }, 0)
  }
  return array.reduce((acc: number, item: unknown) => acc + toAddend(item), 0)
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
    const total = array.reduce((acc: number, item: unknown) => {
      const record = item as Record<string, unknown>
      return acc + toAddend(record[fieldName])
    }, 0)
    return total / array.length
  }
  return array.reduce((acc: number, item: unknown) => acc + toAddend(item), 0) / array.length
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
  let numerator = 0
  let denominator = 0
  for (const item of array) {
    const record = item as Record<string, unknown>
    numerator += toAddend(record[numName])
    denominator += toAddend(record[denName])
  }
  return denominator === 0 ? 0 : numerator / denominator
})

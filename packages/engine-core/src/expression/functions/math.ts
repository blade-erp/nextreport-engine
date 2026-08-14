import { registerFunction } from './registry.js'

// Lenient numeric coercion: numeric strings (the normal shape when a database
// driver serializes decimals) participate, and anything non-numeric contributes
// 0 rather than NaN-poisoning the whole cell. The strict toNumber in
// ../coerce.js throws instead, which would fail an entire report over one bad
// row.
//
// NOTE: the separate fix that teaches the aggregates to coerce numeric strings
// introduces an identical rule for its addends. If both land, these two helpers
// are worth consolidating into one shared coercion rather than kept in step by
// hand.
function toOperand(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

registerFunction('add', (args, _locale) => {
  return toOperand(args[0]) + toOperand(args[1])
})

registerFunction('subtract', (args, _locale) => {
  return toOperand(args[0]) - toOperand(args[1])
})

registerFunction('multiply', (args, _locale) => {
  return toOperand(args[0]) * toOperand(args[1])
})

// divide(numerator, denominator) — the aggregate-math case that ratio() cannot
// express, because ratio() sums two fields of a single array whereas this
// divides two independently computed values (typically sums over different
// scopes, e.g. a group against its parent).
registerFunction('divide', (args, _locale) => {
  const numerator = toOperand(args[0])
  const denominator = toOperand(args[1])
  // Report-friendly: an empty group renders 0 rather than Infinity/NaN
  // cascading through the formatters.
  return denominator === 0 ? 0 : numerator / denominator
})

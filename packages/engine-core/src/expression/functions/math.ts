import { registerFunction } from './registry.js'
import { add, sub, mul, quotient, isZero, toDecimalLenient, toResult } from '../decimal.js'

// Lenient numeric coercion: numeric strings (the normal shape when a database
// driver serializes decimals) participate, and anything non-numeric contributes
// 0 rather than NaN-poisoning the whole cell. The strict toNumber in
// ../coerce.js throws instead, which would fail an entire report over one bad
// row.
registerFunction(
  'add',
  (args, _locale) => {
    return toResult(add(toDecimalLenient(args[0]), toDecimalLenient(args[1])))
  },
  { numeric: true },
)

registerFunction(
  'subtract',
  (args, _locale) => {
    return toResult(sub(toDecimalLenient(args[0]), toDecimalLenient(args[1])))
  },
  { numeric: true },
)

registerFunction(
  'multiply',
  (args, _locale) => {
    return toResult(mul(toDecimalLenient(args[0]), toDecimalLenient(args[1])))
  },
  { numeric: true },
)

// divide(numerator, denominator) — the aggregate-math case that ratio() cannot
// express, because ratio() sums two fields of a single array whereas this
// divides two independently computed values (typically sums over different
// scopes, e.g. a group against its parent).
registerFunction(
  'divide',
  (args, _locale) => {
    const numerator = toDecimalLenient(args[0])
    const denominator = toDecimalLenient(args[1])
    // Report-friendly: an empty group renders 0 rather than Infinity/NaN
    // cascading through the formatters.
    return isZero(denominator) ? 0 : toResult(quotient(numerator, denominator))
  },
  { numeric: true },
)

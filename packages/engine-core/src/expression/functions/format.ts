import { registerFunction } from './registry.js'
import { toNumber, toString } from '../coerce.js'
import { parseDecimal, toCanonicalString } from '../decimal.js'

function toFormatValue(value: unknown): Intl.StringNumericLiteral | number {
  if (value === null || value === undefined) return '0'
  const decimal = parseDecimal(value)
  // Canonical decimals satisfy Intl's numeric-string type without losing precision.
  return decimal === null
    ? toNumber(value)
    : (toCanonicalString(decimal) as Intl.StringNumericLiteral)
}

registerFunction('formatCurrency', (args, locale) => {
  const [value, currency] = args
  const num = toFormatValue(value)
  const cur = toString(currency) || 'USD'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
    signDisplay: 'negative',
  }).format(num)
})

registerFunction('formatNumber', (args, locale) => {
  const [value, decimals] = args
  const num = toFormatValue(value)
  const dec = decimals !== undefined ? toNumber(decimals) : 0
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    signDisplay: 'negative',
  }).format(num)
})

registerFunction('formatDate', (args, _locale) => {
  const [value, pattern] = args
  const date = value instanceof Date ? value : new Date(toString(value))
  const p = toString(pattern)
  const yyyy = String(date.getFullYear()).padStart(4, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return p.replace('YYYY', yyyy).replace('MM', mm).replace('DD', dd)
})

registerFunction('formatPercent', (args, locale) => {
  const [value, decimals] = args
  const num = toFormatValue(value)
  const dec = decimals !== undefined ? toNumber(decimals) : 1
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    signDisplay: 'negative',
  }).format(num)
})

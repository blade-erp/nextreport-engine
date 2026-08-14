import { registerFunction } from './registry.js'
import { toNumber, toString } from '../coerce.js'

registerFunction('formatCurrency', (args, locale) => {
  const [value, currency] = args
  const num = toNumber(value)
  const cur = toString(currency) || 'USD'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
  }).format(num)
})

registerFunction('formatNumber', (args, locale) => {
  const [value, decimals] = args
  const num = toNumber(value)
  const dec = decimals !== undefined ? toNumber(decimals) : 0
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
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
  const num = toNumber(value)
  const dec = decimals !== undefined ? toNumber(decimals) : 1
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(num)
})

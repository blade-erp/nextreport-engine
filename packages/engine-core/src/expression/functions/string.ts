import { registerFunction } from './registry.js'
import { toString } from '../coerce.js'

registerFunction('uppercase', (args, _locale) => {
  return toString(args[0]).toUpperCase()
})

registerFunction('lowercase', (args, _locale) => {
  return toString(args[0]).toLowerCase()
})

registerFunction('concat', (args, _locale) => {
  return args.map((a) => toString(a)).join('')
})

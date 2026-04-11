import { registerFunction } from './registry.js'

registerFunction('if', (args, _locale) => {
  const [condition, trueVal, falseVal] = args
  return condition ? trueVal : falseVal
})

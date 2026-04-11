import { registerFunction } from './registry.js'
import { toString } from '../coerce.js'

registerFunction('sum', (args, _locale) => {
  const [array, field] = args
  if (!Array.isArray(array)) return 0
  if (field !== undefined) {
    const fieldName = toString(field)
    return array.reduce((acc: number, item: unknown) => {
      const record = item as Record<string, unknown>
      const val = typeof record[fieldName] === 'number' ? (record[fieldName] as number) : 0
      return acc + val
    }, 0)
  }
  return array.reduce((acc: number, item: unknown) => {
    return acc + (typeof item === 'number' ? item : 0)
  }, 0)
})

registerFunction('count', (args, _locale) => {
  const [array] = args
  if (!Array.isArray(array)) return 0
  return array.length
})

import { parseTemplate, type Expression } from './parser.js'
import { getFunction } from './functions/registry.js'
import { cmp, parseDecimal } from './decimal.js'

// Side-effect imports to register all built-in functions
import './functions/format.js'
import './functions/aggregate.js'
import './functions/math.js'
import './functions/string.js'
import './functions/conditional.js'

export function evaluateExpression(
  template: string,
  data: Record<string, unknown>,
  locale = 'en-US',
): unknown {
  const ast = parseTemplate(template)
  return evaluateNode(ast, data, locale)
}

function evaluateNode(node: Expression, data: Record<string, unknown>, locale: string): unknown {
  switch (node.type) {
    case 'literal':
      return node.value

    case 'variable':
      return resolveVariable(node.path, data)

    case 'functionCall': {
      const fn = getFunction(node.name)
      if (!fn) throw new Error(`Unknown function: ${node.name}`)
      const args = node.args.map((arg) => evaluateNode(arg, data, locale))
      return fn(args, locale)
    }

    case 'comparison': {
      const left = evaluateNode(node.left, data, locale)
      const right = evaluateNode(node.right, data, locale)
      return compare(left, right, node.operator)
    }

    case 'template': {
      const parts = node.parts.map((part) => evaluateNode(part, data, locale))
      return parts.join('')
    }
  }
}

function resolveVariable(path: string[], data: Record<string, unknown>): unknown {
  let current: unknown = data
  for (const key of path) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

// Numeric results may be exact decimal strings (see decimal.ts toResult), so
// ordering compares as decimals whenever both sides parse as one — otherwise
// divide(100, 3) > divide(20, 3) would compare the strings lexicographically.
// Equality is decimal-aware only against a number: two strings keep string
// equality (templates compare formatted text), which is still exact for
// computed results because their canonical strings are equal iff their values
// are. null/''/non-numeric never parse, so `null == 0` stays false.
function compare(left: unknown, right: unknown, operator: string): boolean {
  const equality = operator === '==' || operator === '!='
  if (!equality || typeof left === 'number' || typeof right === 'number') {
    const leftDecimal = parseDecimal(left)
    const rightDecimal = parseDecimal(right)
    if (leftDecimal !== null && rightDecimal !== null) {
      const order = cmp(leftDecimal, rightDecimal)
      switch (operator) {
        case '>':
          return order > 0
        case '<':
          return order < 0
        case '>=':
          return order >= 0
        case '<=':
          return order <= 0
        case '==':
          return order === 0
        case '!=':
          return order !== 0
      }
    }
  }
  const l = left as number
  const r = right as number
  switch (operator) {
    case '>':
      return l > r
    case '<':
      return l < r
    case '>=':
      return l >= r
    case '<=':
      return l <= r
    case '==':
      return left === right
    case '!=':
      return left !== right
    default:
      throw new Error(`Unknown operator: ${operator}`)
  }
}

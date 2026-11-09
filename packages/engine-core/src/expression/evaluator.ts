import { parseTemplate, type Expression } from './parser.js'
import { getFunction, isNumericFunction } from './functions/registry.js'
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
      const numeric = isNumericOperand(node.left, left) || isNumericOperand(node.right, right)
      return compare(left, right, node.operator, numeric)
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

// A comparison is numeric when either side is a JS number or the result of a
// numeric function (sum, divide, …), whose results may be exact decimal
// strings (see decimal.ts toResult). Numeric context comes from where a value
// came from, never from a string merely looking like a number: two plain
// strings (row codes, formatted text) keep their previous lexical semantics.
function isNumericOperand(node: Expression, value: unknown): boolean {
  return typeof value === 'number' || (node.type === 'functionCall' && isNumericFunction(node.name))
}

// In a numeric comparison, both sides compare as exact decimals when both parse
// as one — so '0.00' == 0, and divide(100, 3) > divide(20, 3) even though both
// are strings. null/''/non-numeric never parse, so `null == 0` stays false.
function compare(left: unknown, right: unknown, operator: string, numeric: boolean): boolean {
  if (numeric) {
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

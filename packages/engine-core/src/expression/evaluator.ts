import { parseTemplate, type Expression } from './parser.js'
import { getFunction } from './functions/registry.js'

// Side-effect imports to register all built-in functions
import './functions/format.js'
import './functions/aggregate.js'
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

    case 'arithmetic': {
      const left = toOperand(evaluateNode(node.left, data, locale))
      const right = toOperand(evaluateNode(node.right, data, locale))
      switch (node.operator) {
        case '+':
          return left + right
        case '-':
          return left - right
        case '*':
          return left * right
        case '/':
          // Report-friendly: an empty group dividing by zero renders 0, not
          // Infinity/NaN cascading through formatters.
          return right === 0 ? 0 : left / right
      }
      break
    }

    case 'template': {
      const parts = node.parts.map((part) => evaluateNode(part, data, locale))
      return parts.join('')
    }
  }
}

// Lenient numeric coercion for arithmetic: numeric strings (database decimal
// serialization) participate; anything non-numeric contributes 0 rather than
// NaN-poisoning the whole cell.
function toOperand(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

function resolveVariable(path: string[], data: Record<string, unknown>): unknown {
  let current: unknown = data
  for (const key of path) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function compare(left: unknown, right: unknown, operator: string): boolean {
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

import { describe, it, expect } from 'vitest'
import { parseExpression, parseTemplate } from '../../expression/parser.js'

describe('parseExpression', () => {
  it('parses a simple variable', () => {
    const ast = parseExpression('customer')
    expect(ast).toEqual({ type: 'variable', path: ['customer'] })
  })

  it('parses a dotted variable path', () => {
    const ast = parseExpression('customer.name')
    expect(ast).toEqual({ type: 'variable', path: ['customer', 'name'] })
  })

  it('parses a function call with literal args', () => {
    const ast = parseExpression("formatCurrency(price, 'TRY')")
    expect(ast).toEqual({
      type: 'functionCall',
      name: 'formatCurrency',
      args: [
        { type: 'variable', path: ['price'] },
        { type: 'literal', value: 'TRY' },
      ],
    })
  })

  it('parses nested function calls', () => {
    const ast = parseExpression('formatCurrency(sum(items, "price"), "USD")')
    expect(ast).toEqual({
      type: 'functionCall',
      name: 'formatCurrency',
      args: [
        {
          type: 'functionCall',
          name: 'sum',
          args: [
            { type: 'variable', path: ['items'] },
            { type: 'literal', value: 'price' },
          ],
        },
        { type: 'literal', value: 'USD' },
      ],
    })
  })

  it('parses a comparison expression', () => {
    const ast = parseExpression('total > 1000')
    expect(ast).toEqual({
      type: 'comparison',
      operator: '>',
      left: { type: 'variable', path: ['total'] },
      right: { type: 'literal', value: 1000 },
    })
  })

  it('parses a numeric literal', () => {
    const ast = parseExpression('42')
    expect(ast).toEqual({ type: 'literal', value: 42 })
  })

  it('parses a string literal', () => {
    const ast = parseExpression("'hello'")
    expect(ast).toEqual({ type: 'literal', value: 'hello' })
  })
})

describe('parseTemplate', () => {
  it('returns literal node for plain text with no expressions', () => {
    const ast = parseTemplate('Hello World')
    expect(ast).toEqual({ type: 'literal', value: 'Hello World' })
  })

  it('returns the inner expression directly for a single expression template', () => {
    const ast = parseTemplate('{{customer.name}}')
    expect(ast).toEqual({ type: 'variable', path: ['customer', 'name'] })
  })

  it('returns a template node for mixed text and expressions', () => {
    const ast = parseTemplate('Hello, {{customer.name}}!')
    expect(ast).toEqual({
      type: 'template',
      parts: [
        { type: 'literal', value: 'Hello, ' },
        { type: 'variable', path: ['customer', 'name'] },
        { type: 'literal', value: '!' },
      ],
    })
  })

  it('returns a template node for multiple expressions', () => {
    const ast = parseTemplate('{{firstName}} {{lastName}}')
    expect(ast).toEqual({
      type: 'template',
      parts: [
        { type: 'variable', path: ['firstName'] },
        { type: 'literal', value: ' ' },
        { type: 'variable', path: ['lastName'] },
      ],
    })
  })
})

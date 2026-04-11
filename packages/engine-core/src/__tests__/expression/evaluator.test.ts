import { describe, it, expect } from 'vitest'
import { evaluateExpression } from '../../expression/evaluator.js'

const data = {
  customer: {
    name: 'Alice',
    city: 'Istanbul',
  },
  total: 1500,
  price: 99.99,
  firstName: 'John',
  lastName: 'Doe',
  items: [
    { price: 100, quantity: 2 },
    { price: 200, quantity: 1 },
  ],
  greeting: 'hello',
  amount: 1234.5,
}

describe('evaluateExpression', () => {
  it('evaluates a simple variable', () => {
    expect(evaluateExpression('{{total}}', data)).toBe(1500)
  })

  it('evaluates a nested variable', () => {
    expect(evaluateExpression('{{customer.name}}', data)).toBe('Alice')
  })

  it('returns plain text unchanged', () => {
    expect(evaluateExpression('Hello World', data)).toBe('Hello World')
  })

  it('evaluates a mixed template', () => {
    expect(evaluateExpression('Hello, {{customer.name}}!', data)).toBe('Hello, Alice!')
  })

  it('evaluates uppercase built-in', () => {
    expect(evaluateExpression('{{uppercase(greeting)}}', data)).toBe('HELLO')
  })

  it('evaluates concat built-in', () => {
    expect(evaluateExpression('{{concat(firstName, " ", lastName)}}', data)).toBe('John Doe')
  })

  it('evaluates sum built-in', () => {
    expect(evaluateExpression('{{sum(items, "price")}}', data)).toBe(300)
  })

  it('evaluates count built-in', () => {
    expect(evaluateExpression('{{count(items)}}', data)).toBe(2)
  })

  it('evaluates if conditional — truthy branch', () => {
    expect(evaluateExpression('{{if(total > 1000, "big", "small")}}', data)).toBe('big')
  })

  it('evaluates if conditional — falsy branch', () => {
    const smallData = { ...data, total: 500 }
    expect(evaluateExpression('{{if(total > 1000, "big", "small")}}', smallData)).toBe('small')
  })

  it('returns undefined for missing variable', () => {
    expect(evaluateExpression('{{missing}}', data)).toBeUndefined()
  })

  it('evaluates lowercase built-in', () => {
    expect(evaluateExpression('{{lowercase(customer.name)}}', data)).toBe('alice')
  })

  it('evaluates formatNumber built-in', () => {
    const result = evaluateExpression('{{formatNumber(amount, 2)}}', data, 'en-US')
    expect(result).toBe('1,234.50')
  })
})

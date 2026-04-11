import { describe, it, expect } from 'vitest'
import { tokenize, TokenType } from '../../expression/tokenizer.js'

describe('tokenizer', () => {
  it('tokenizes a simple variable path (customer.name)', () => {
    const tokens = tokenize('customer.name')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'customer' },
      { type: TokenType.Dot, value: '.' },
      { type: TokenType.Identifier, value: 'name' },
    ])
  })

  it('tokenizes a function call with mixed args (formatCurrency(price, \'TRY\'))', () => {
    const tokens = tokenize("formatCurrency(price, 'TRY')")
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'formatCurrency' },
      { type: TokenType.LParen, value: '(' },
      { type: TokenType.Identifier, value: 'price' },
      { type: TokenType.Comma, value: ',' },
      { type: TokenType.String, value: 'TRY' },
      { type: TokenType.RParen, value: ')' },
    ])
  })

  it('tokenizes a number literal', () => {
    const tokens = tokenize('1000')
    expect(tokens).toEqual([{ type: TokenType.Number, value: '1000' }])
  })

  it('tokenizes a decimal number', () => {
    const tokens = tokenize('3.14')
    expect(tokens).toEqual([{ type: TokenType.Number, value: '3.14' }])
  })

  it('tokenizes comparison operator (total > 1000)', () => {
    const tokens = tokenize('total > 1000')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'total' },
      { type: TokenType.Operator, value: '>' },
      { type: TokenType.Number, value: '1000' },
    ])
  })

  it('tokenizes >= operator', () => {
    const tokens = tokenize('a >= b')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'a' },
      { type: TokenType.Operator, value: '>=' },
      { type: TokenType.Identifier, value: 'b' },
    ])
  })

  it('tokenizes <= operator', () => {
    const tokens = tokenize('a <= b')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'a' },
      { type: TokenType.Operator, value: '<=' },
      { type: TokenType.Identifier, value: 'b' },
    ])
  })

  it('tokenizes == operator', () => {
    const tokens = tokenize('a == b')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'a' },
      { type: TokenType.Operator, value: '==' },
      { type: TokenType.Identifier, value: 'b' },
    ])
  })

  it('tokenizes != operator', () => {
    const tokens = tokenize('a != b')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'a' },
      { type: TokenType.Operator, value: '!=' },
      { type: TokenType.Identifier, value: 'b' },
    ])
  })

  it('tokenizes a nested function call', () => {
    const tokens = tokenize('formatCurrency(sum(items, "price"), "USD")')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'formatCurrency' },
      { type: TokenType.LParen, value: '(' },
      { type: TokenType.Identifier, value: 'sum' },
      { type: TokenType.LParen, value: '(' },
      { type: TokenType.Identifier, value: 'items' },
      { type: TokenType.Comma, value: ',' },
      { type: TokenType.String, value: 'price' },
      { type: TokenType.RParen, value: ')' },
      { type: TokenType.Comma, value: ',' },
      { type: TokenType.String, value: 'USD' },
      { type: TokenType.RParen, value: ')' },
    ])
  })

  it('tokenizes a double-quoted string', () => {
    const tokens = tokenize('"hello world"')
    expect(tokens).toEqual([{ type: TokenType.String, value: 'hello world' }])
  })
})

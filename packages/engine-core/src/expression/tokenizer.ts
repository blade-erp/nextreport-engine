export enum TokenType {
  Identifier = 'Identifier',
  Number = 'Number',
  String = 'String',
  Dot = 'Dot',
  Comma = 'Comma',
  LParen = 'LParen',
  RParen = 'RParen',
  Operator = 'Operator',
}

export interface Token {
  type: TokenType
  value: string
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]!

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // Single-char tokens
    if (ch === '.') {
      tokens.push({ type: TokenType.Dot, value: '.' })
      i++
      continue
    }
    if (ch === ',') {
      tokens.push({ type: TokenType.Comma, value: ',' })
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ type: TokenType.LParen, value: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: TokenType.RParen, value: ')' })
      i++
      continue
    }

    // Two-char operators: >=, <=, ==, !=
    if ((ch === '>' || ch === '<' || ch === '=' || ch === '!') && i + 1 < input.length) {
      const next = input[i + 1]
      if (next === '=') {
        tokens.push({ type: TokenType.Operator, value: ch + '=' })
        i += 2
        continue
      }
    }

    // Single-char operators: > <
    if (ch === '>' || ch === '<') {
      tokens.push({ type: TokenType.Operator, value: ch })
      i++
      continue
    }

    // Quoted strings (single or double)
    if (ch === '"' || ch === "'") {
      const quote = ch
      i++
      let str = ''
      while (i < input.length && input[i] !== quote) {
        str += input[i]
        i++
      }
      i++ // consume closing quote
      tokens.push({ type: TokenType.String, value: str })
      continue
    }

    // Numbers (including decimals)
    if (/[0-9]/.test(ch)) {
      let num = ''
      while (i < input.length && /[0-9.]/.test(input[i]!)) {
        num += input[i]
        i++
      }
      tokens.push({ type: TokenType.Number, value: num })
      continue
    }

    // Identifiers: [a-zA-Z_][a-zA-Z0-9_]*
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = ''
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i]!)) {
        ident += input[i]
        i++
      }
      tokens.push({ type: TokenType.Identifier, value: ident })
      continue
    }

    // Unknown character — skip
    i++
  }

  return tokens
}

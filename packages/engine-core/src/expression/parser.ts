import { tokenize, type Token, TokenType } from './tokenizer.js'

// AST node types
export interface LiteralNode {
  type: 'literal'
  value: string | number | boolean
}

export interface VariableNode {
  type: 'variable'
  path: string[]
}

export interface FunctionCallNode {
  type: 'functionCall'
  name: string
  args: Expression[]
}

export interface ComparisonNode {
  type: 'comparison'
  operator: string
  left: Expression
  right: Expression
}

export interface TemplateNode {
  type: 'template'
  parts: Expression[]
}

export type Expression =
  LiteralNode | VariableNode | FunctionCallNode | ComparisonNode | TemplateNode

// Recursive descent parser
class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    const token = this.tokens[this.pos]
    if (!token) throw new Error('Unexpected end of input')
    this.pos++
    return token
  }

  parse(): Expression {
    return this.parseComparison()
  }

  private parseComparison(): Expression {
    const left = this.parsePrimary()
    const next = this.peek()
    if (next && next.type === TokenType.Operator) {
      const op = this.consume().value
      const right = this.parsePrimary()
      return { type: 'comparison', operator: op, left, right }
    }
    return left
  }

  private parsePrimary(): Expression {
    const token = this.peek()
    if (!token) throw new Error('Unexpected end of input')

    if (token.type === TokenType.String) {
      this.consume()
      return { type: 'literal', value: token.value }
    }

    if (token.type === TokenType.Number) {
      this.consume()
      return { type: 'literal', value: Number(token.value) }
    }

    if (token.type === TokenType.Identifier) {
      return this.parseIdentifierOrCall()
    }

    throw new Error(`Unexpected token: ${token.type} (${token.value})`)
  }

  private parseIdentifierOrCall(): Expression {
    const name = this.consume().value // consume identifier

    // Check for function call
    if (this.peek()?.type === TokenType.LParen) {
      this.consume() // consume '('
      const args: Expression[] = []

      // Parse arguments until ')'
      while (this.peek()?.type !== TokenType.RParen) {
        if (args.length > 0) {
          // consume comma
          if (this.peek()?.type === TokenType.Comma) {
            this.consume()
          }
        }
        args.push(this.parseComparison())
      }
      this.consume() // consume ')'
      return { type: 'functionCall', name, args }
    }

    // Parse dotted variable path
    const path: string[] = [name]
    while (this.peek()?.type === TokenType.Dot) {
      this.consume() // consume '.'
      const part = this.peek()
      if (part?.type === TokenType.Identifier) {
        this.consume()
        path.push(part.value)
      }
    }

    return { type: 'variable', path }
  }
}

export function parseExpression(input: string): Expression {
  const tokens = tokenize(input)
  const parser = new Parser(tokens)
  return parser.parse()
}

export function parseTemplate(input: string): Expression {
  // Find all {{ ... }} expressions
  const templatePattern = /\{\{(.*?)\}\}/g
  const parts: Expression[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = templatePattern.exec(input)) !== null) {
    // Add any text before this expression
    const before = input.slice(lastIndex, match.index)
    if (before.length > 0) {
      parts.push({ type: 'literal', value: before })
    }

    // Parse the expression inside {{ }}
    const expr = parseExpression(match[1]!.trim())
    parts.push(expr)

    lastIndex = match.index + match[0].length
  }

  // Add any trailing text
  const after = input.slice(lastIndex)
  if (after.length > 0) {
    parts.push({ type: 'literal', value: after })
  }

  // No expressions found — plain text
  if (parts.length === 0) {
    return { type: 'literal', value: input }
  }

  // Single part — return it directly
  if (parts.length === 1) {
    return parts[0]!
  }

  return { type: 'template', parts }
}

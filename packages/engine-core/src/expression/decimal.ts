export interface Decimal {
  coef: bigint
  scale: number
}

export const ZERO: Decimal = { coef: 0n, scale: 0 }

function pow10(exponent: number): bigint {
  return 10n ** BigInt(exponent)
}

export function parseDecimal(value: unknown): Decimal | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    value = String(value)
  }
  if (typeof value !== 'string') return null
  const match = /^([+-]?)(\d+\.?\d*|\.\d+)(?:[eE]([+-]?\d+))?$/.exec(value.trim())
  if (!match) return null
  const exponent = Number(match[3] ?? 0)
  if (Math.abs(exponent) > 400) return null
  const mantissa = match[2]
  const point = mantissa.indexOf('.')
  const fractionalDigits = point === -1 ? 0 : mantissa.length - point - 1
  const coef = BigInt(match[1] + mantissa.replace('.', ''))
  if (coef === 0n) return ZERO
  const scale = fractionalDigits - exponent
  return scale < 0 ? { coef: coef * pow10(-scale), scale: 0 } : { coef, scale }
}

// Shared report-friendly coercion: invalid values contribute zero to arithmetic.
export function toDecimalLenient(value: unknown): Decimal {
  const decimal = parseDecimal(value)
  if (decimal !== null) return decimal
  if (typeof value === 'string' && value.trim() !== '') {
    const number = Number(value)
    if (Number.isFinite(number)) return parseDecimal(number) ?? ZERO
  }
  return ZERO
}

export function add(a: Decimal, b: Decimal): Decimal {
  const scale = Math.max(a.scale, b.scale)
  return {
    coef: a.coef * pow10(scale - a.scale) + b.coef * pow10(scale - b.scale),
    scale,
  }
}

export function sub(a: Decimal, b: Decimal): Decimal {
  return add(a, { coef: -b.coef, scale: b.scale })
}

export function mul(a: Decimal, b: Decimal): Decimal {
  return { coef: a.coef * b.coef, scale: a.scale + b.scale }
}

export function cmp(a: Decimal, b: Decimal): -1 | 0 | 1 {
  const difference = sub(a, b).coef
  return difference < 0n ? -1 : difference > 0n ? 1 : 0
}

export function isZero(value: Decimal): boolean {
  return value.coef === 0n
}

// The caller guarantees a nonzero divisor. BigInt division truncates toward zero;
// adjust ties and larger remainders away from zero for ROUND_HALF_UP.
export function div(a: Decimal, b: Decimal, scale = 20): Decimal {
  const shift = b.scale - a.scale + scale
  const numerator = a.coef * pow10(Math.max(shift, 0))
  const denominator = b.coef * pow10(Math.max(-shift, 0))
  let coef = numerator / denominator
  const remainder = numerator % denominator
  const absRemainder = remainder < 0n ? -remainder : remainder
  const absDenominator = denominator < 0n ? -denominator : denominator
  if (absRemainder * 2n >= absDenominator) {
    coef += numerator < 0n === denominator < 0n ? 1n : -1n
  }
  return { coef, scale }
}

// Quotient for the expression functions: at least 20 decimal places AND at
// least 20 significant digits, so a tiny quotient (1 / 3e18) keeps its
// precision when later multiplied back up instead of rounding to zero.
export function quotient(a: Decimal, b: Decimal): Decimal {
  if (isZero(a)) return ZERO
  const magnitude = (d: Decimal) => (d.coef < 0n ? -d.coef : d.coef).toString().length - d.scale
  return div(a, b, Math.max(20, 20 - (magnitude(a) - magnitude(b))))
}

export function toCanonicalString(value: Decimal): string {
  if (isZero(value)) return '0'
  const negative = value.coef < 0n
  const digits = (negative ? -value.coef : value.coef).toString().padStart(value.scale + 1, '0')
  const unsigned =
    value.scale === 0
      ? digits
      : `${digits.slice(0, -value.scale)}.${digits.slice(-value.scale)}`.replace(/\.?0+$/, '')
  return negative ? `-${unsigned}` : unsigned
}

export function toResult(value: Decimal): number | string {
  const s = toCanonicalString(value)
  const n = Number(s)
  return String(n) === s ? n : s
}

export function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isNaN(n)) throw new Error(`Cannot coerce '${v}' to number`)
    return n
  }
  throw new Error(`Cannot coerce ${typeof v} to number`)
}

export function toDate(v: unknown): Date {
  if (v === null || v === undefined) {
    throw new Error('Cannot coerce null/undefined to Date')
  }
  if (v instanceof Date) return v
  if (typeof v === 'string') {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) {
      throw new Error(`Cannot coerce '${v}' to Date`)
    }
    return d
  }
  throw new Error(`Cannot coerce ${typeof v} to Date`)
}

export function toBoolean(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    if (v === 'true') return true
    if (v === 'false') return false
    throw new Error(`Cannot coerce '${v}' to boolean`)
  }
  throw new Error(`Cannot coerce ${typeof v} to boolean`)
}

export function toString(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

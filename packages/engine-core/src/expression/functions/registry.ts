export type BuiltinFn = (args: unknown[], locale: string) => unknown

export interface FunctionOptions {
  // The function returns a number or, when a float would lose precision, an
  // exact decimal string (see ../decimal.ts toResult). Comparisons treat such
  // results as numbers even when they arrive as strings.
  numeric?: boolean
}

const registry = new Map<string, BuiltinFn>()
const numericFunctions = new Set<string>()

export function registerFunction(name: string, fn: BuiltinFn, options: FunctionOptions = {}): void {
  registry.set(name, fn)
  if (options.numeric) numericFunctions.add(name)
  else numericFunctions.delete(name)
}

export function getFunction(name: string): BuiltinFn | undefined {
  return registry.get(name)
}

export function isNumericFunction(name: string): boolean {
  return numericFunctions.has(name)
}

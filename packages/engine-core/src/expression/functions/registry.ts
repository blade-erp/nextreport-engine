export type BuiltinFn = (args: unknown[], locale: string) => unknown

const registry = new Map<string, BuiltinFn>()

export function registerFunction(name: string, fn: BuiltinFn): void {
  registry.set(name, fn)
}

export function getFunction(name: string): BuiltinFn | undefined {
  return registry.get(name)
}

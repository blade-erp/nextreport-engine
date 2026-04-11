import type { Band, Component } from '@nextreport/schema'
import { evaluateExpression } from '../expression/evaluator.js'
import type { ResolvedElement } from '../types.js'

export interface ProcessedBand {
  bandType: string
  height: number
  elements: ResolvedElement[]
}

export function processBands(
  bands: Band[],
  data: Record<string, unknown>,
  locale: string,
): ProcessedBand[] {
  const result: ProcessedBand[] = []

  for (const band of bands) {
    if (band.type === 'detail' && band.dataBinding) {
      const items = resolveDataBinding(band.dataBinding, data)
      if (!Array.isArray(items)) {
        // No array found — treat as single instance with original data
        result.push({
          bandType: band.type,
          height: band.height,
          elements: resolveComponents(band.components, data, band.type, locale),
        })
        continue
      }

      const iteratorName = band.iteratorName ?? deriveIteratorName(band.dataBinding)

      for (const item of items) {
        const rowContext: Record<string, unknown> = {
          ...data,
          [iteratorName]: item,
        }
        result.push({
          bandType: band.type,
          height: band.height,
          elements: resolveComponents(band.components, rowContext, band.type, locale),
        })
      }
    } else {
      result.push({
        bandType: band.type,
        height: band.height,
        elements: resolveComponents(band.components, data, band.type, locale),
      })
    }
  }

  return result
}

function resolveComponents(
  components: Component[],
  data: Record<string, unknown>,
  bandType: string,
  locale: string,
): ResolvedElement[] {
  return components.map((component): ResolvedElement => {
    const resolvedProperties: Record<string, unknown> = {}

    // Iterate all properties on the component (excluding 'type' and 'position')
    const compRecord = component as unknown as Record<string, unknown>
    for (const [key, value] of Object.entries(compRecord)) {
      if (key === 'type' || key === 'position') continue
      if (typeof value === 'string' && value.includes('{{')) {
        resolvedProperties[key] = evaluateExpression(value, data, locale)
      } else {
        resolvedProperties[key] = value
      }
    }

    return {
      type: component.type,
      position: { ...component.position },
      properties: resolvedProperties,
      bandType,
    }
  })
}

function resolveDataBinding(path: string, data: Record<string, unknown>): unknown {
  const parts = path.split('.')
  let current: unknown = data
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function deriveIteratorName(dataBinding: string): string {
  // Use the last segment of the path (e.g. 'order.items' → 'items' → 'item')
  const lastSegment = dataBinding.split('.').pop() ?? dataBinding
  // Strip trailing 's' to get singular form
  if (lastSegment.endsWith('s') && lastSegment.length > 1) {
    return lastSegment.slice(0, -1)
  }
  return lastSegment
}

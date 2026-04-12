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
  let i = 0

  while (i < bands.length) {
    const band = bands[i]

    if (band.type === 'group-header') {
      // Collect group-header, detail, group-footer sequence
      const { processed, nextIndex } = processGroupSequence(bands, i, data, locale)
      result.push(...processed)
      i = nextIndex
    } else if (band.type === 'detail' && band.dataBinding) {
      result.push(...processDetailBand(band, data, locale))
      i++
    } else if (band.type === 'page-header' || band.type === 'page-footer') {
      // Page bands are handled by layout calculator, pass through as-is
      result.push({
        bandType: band.type,
        height: band.height,
        elements: resolveComponents(band.components, data, band.type, locale),
      })
      i++
    } else {
      result.push({
        bandType: band.type,
        height: band.height,
        elements: resolveComponents(band.components, data, band.type, locale),
      })
      i++
    }
  }

  return result
}

function processDetailBand(
  band: Band,
  data: Record<string, unknown>,
  locale: string,
): ProcessedBand[] {
  const result: ProcessedBand[] = []
  const items = resolveDataBinding(band.dataBinding!, data)

  if (!Array.isArray(items)) {
    result.push({
      bandType: band.type,
      height: band.height,
      elements: resolveComponents(band.components, data, band.type, locale),
    })
    return result
  }

  const iteratorName = band.iteratorName ?? deriveIteratorName(band.dataBinding!)

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

  return result
}

interface GroupSequenceResult {
  processed: ProcessedBand[]
  nextIndex: number
}

function processGroupSequence(
  bands: Band[],
  startIndex: number,
  data: Record<string, unknown>,
  locale: string,
): GroupSequenceResult {
  const groupHeader = bands[startIndex]
  const dataBinding = groupHeader.dataBinding
  const groupByField = groupHeader.groupBy

  // Collect detail bands and group-footer that follow
  const detailBands: Band[] = []
  let groupFooter: Band | null = null
  let i = startIndex + 1

  while (i < bands.length) {
    const band = bands[i]
    if (band.type === 'group-footer') {
      groupFooter = band
      i++
      break
    }
    if (band.type === 'group-header') {
      // Nested group — stop collecting for this level
      break
    }
    detailBands.push(band)
    i++
  }

  // If no dataBinding or groupBy, just render the bands normally
  if (!dataBinding || !groupByField) {
    const result: ProcessedBand[] = []
    result.push({
      bandType: groupHeader.type,
      height: groupHeader.height,
      elements: resolveComponents(groupHeader.components, data, groupHeader.type, locale),
    })
    for (const band of detailBands) {
      if (band.type === 'detail' && band.dataBinding) {
        result.push(...processDetailBand(band, data, locale))
      } else {
        result.push({
          bandType: band.type,
          height: band.height,
          elements: resolveComponents(band.components, data, band.type, locale),
        })
      }
    }
    if (groupFooter) {
      result.push({
        bandType: groupFooter.type,
        height: groupFooter.height,
        elements: resolveComponents(groupFooter.components, data, groupFooter.type, locale),
      })
    }
    return { processed: result, nextIndex: i }
  }

  // Group the data
  const items = resolveDataBinding(dataBinding, data)
  if (!Array.isArray(items)) {
    return { processed: [], nextIndex: i }
  }

  const groups = groupBy(items, groupByField)
  const result: ProcessedBand[] = []

  let groupIndex = 0
  for (const [groupKey, groupItems] of groups) {
    // Group context: inject _groupKey, _groupItems, _groupIndex
    const groupContext: Record<string, unknown> = {
      ...data,
      _groupKey: groupKey,
      _groupItems: groupItems,
      _groupIndex: groupIndex,
    }

    // Emit group-header
    result.push({
      bandType: groupHeader.type,
      height: groupHeader.height,
      elements: resolveComponents(groupHeader.components, groupContext, groupHeader.type, locale),
    })

    // Emit detail bands for each item in the group
    const iteratorName = detailBands[0]?.iteratorName ?? deriveIteratorName(dataBinding)

    for (const band of detailBands) {
      if (band.type === 'detail') {
        for (const item of groupItems) {
          const rowContext: Record<string, unknown> = {
            ...groupContext,
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
          elements: resolveComponents(band.components, groupContext, band.type, locale),
        })
      }
    }

    // Emit group-footer
    if (groupFooter) {
      result.push({
        bandType: groupFooter.type,
        height: groupFooter.height,
        elements: resolveComponents(groupFooter.components, groupContext, groupFooter.type, locale),
      })
    }

    groupIndex++
  }

  return { processed: result, nextIndex: i }
}

function groupBy(items: unknown[], field: string): Map<string, Record<string, unknown>[]> {
  const groups = new Map<string, Record<string, unknown>[]>()

  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue
    const record = item as Record<string, unknown>
    const key = String(record[field] ?? '')
    const group = groups.get(key)
    if (group) {
      group.push(record)
    } else {
      groups.set(key, [record])
    }
  }

  return groups
}

function resolveComponents(
  components: Component[],
  data: Record<string, unknown>,
  bandType: string,
  locale: string,
): ResolvedElement[] {
  return components.map((component): ResolvedElement => {
    const resolvedProperties: Record<string, unknown> = {}

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
  const lastSegment = dataBinding.split('.').pop() ?? dataBinding
  if (lastSegment.endsWith('s') && lastSegment.length > 1) {
    return lastSegment.slice(0, -1)
  }
  return lastSegment
}

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

interface CollectedGroup {
  header: Band
  children: Band[]
  footer: Band | null
  nextIndex: number
}

/**
 * Collects the bands belonging to the group starting at `startIndex`, tracking
 * nesting depth so each group-footer is matched to its own group-header.
 * Nested group-header/group-footer pairs stay inside `children` and are
 * recursed into by `processGroupLevel`.
 */
function collectGroupSequence(bands: Band[], startIndex: number): CollectedGroup {
  const header = bands[startIndex]
  const children: Band[] = []
  let footer: Band | null = null
  let depth = 1
  let i = startIndex + 1

  while (i < bands.length) {
    const band = bands[i]
    if (band.type === 'group-header') {
      depth++
    } else if (band.type === 'group-footer') {
      depth--
      if (depth === 0) {
        footer = band
        i++
        break
      }
    }
    children.push(band)
    i++
  }

  return { header, children, footer, nextIndex: i }
}

function processGroupSequence(
  bands: Band[],
  startIndex: number,
  data: Record<string, unknown>,
  locale: string,
): GroupSequenceResult {
  const { header, children, footer, nextIndex } = collectGroupSequence(bands, startIndex)
  const dataBinding = header.dataBinding
  const groupByField = header.groupBy

  // If no dataBinding or groupBy, just render the bands normally
  if (!dataBinding || !groupByField) {
    const result: ProcessedBand[] = []
    result.push({
      bandType: header.type,
      height: header.height,
      elements: resolveComponents(header.components, data, header.type, locale),
    })
    for (const band of children) {
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
    if (footer) {
      result.push({
        bandType: footer.type,
        height: footer.height,
        elements: resolveComponents(footer.components, data, footer.type, locale),
      })
    }
    return { processed: result, nextIndex }
  }

  // Group the data
  const items = resolveDataBinding(dataBinding, data)
  if (!Array.isArray(items)) {
    return { processed: [], nextIndex }
  }

  return {
    processed: processGroupLevel(header, children, footer, items, data, dataBinding, locale),
    nextIndex,
  }
}

/**
 * Renders one grouping level: partition `items` by the header's groupBy, then
 * for each partition emit the header, the child bands (recursing into nested
 * group-header sequences with the partition's items), and the footer.
 *
 * Nested group-header bands inherit the parent partition's items; their own
 * dataBinding, if present, is ignored. Inside a nested level the group context
 * variables (_groupKey, _groupItems, _groupIndex) refer to the innermost
 * group; the parent's are also available as _parentGroupKey/_parentGroupItems.
 */
function processGroupLevel(
  header: Band,
  children: Band[],
  footer: Band | null,
  items: Record<string, unknown>[] | unknown[],
  context: Record<string, unknown>,
  dataBinding: string,
  locale: string,
): ProcessedBand[] {
  const groupByField = header.groupBy!
  const groups = groupBy(items, groupByField)
  const result: ProcessedBand[] = []

  let groupIndex = 0
  for (const [groupKey, groupItems] of groups) {
    // Group context: inject _groupKey, _groupItems, _groupIndex
    const groupContext: Record<string, unknown> = {
      ...context,
      _parentGroupKey: context._groupKey,
      _parentGroupItems: context._groupItems,
      _groupKey: groupKey,
      _groupItems: groupItems,
      _groupIndex: groupIndex,
    }

    // Emit group-header
    result.push({
      bandType: header.type,
      height: header.height,
      elements: resolveComponents(header.components, groupContext, header.type, locale),
    })

    // Emit child bands, recursing into nested groups with this partition's items
    let childIndex = 0
    while (childIndex < children.length) {
      const band = children[childIndex]

      if (band.type === 'group-header') {
        const nested = collectGroupSequence(children, childIndex)
        if (nested.header.groupBy) {
          result.push(
            ...processGroupLevel(
              nested.header,
              nested.children,
              nested.footer,
              groupItems,
              groupContext,
              dataBinding,
              locale,
            ),
          )
        }
        childIndex = nested.nextIndex
        continue
      }

      if (band.type === 'detail') {
        const iteratorName =
          band.iteratorName ?? deriveIteratorName(band.dataBinding ?? dataBinding)
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

      childIndex++
    }

    // Emit group-footer
    if (footer) {
      result.push({
        bandType: footer.type,
        height: footer.height,
        elements: resolveComponents(footer.components, groupContext, footer.type, locale),
      })
    }

    groupIndex++
  }

  return result
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

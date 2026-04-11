import React, { useMemo } from 'react'
import { useDesignerStore } from '../store/index.js'
import type { TextComponent, TableComponent } from '@nextreport/schema'
import type { ResolvedElement } from '@nextreport/engine-core'

const BAND_COLORS: Record<string, string> = {
  header: '#4caf50',
  detail: '#e91e63',
  footer: '#3f51b5',
}

/**
 * Fallback expression resolver: replaces {{key}} tokens with values from data.
 * Used when engine-core renderReport is unavailable (SSR, import failure, etc.).
 */
function resolveContentFallback(content: unknown, sampleData: Record<string, unknown>): string {
  if (content === undefined || content === null) return ''
  const str = String(content)
  return str.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const trimmed = key.trim()
    const value = sampleData[trimmed]
    return value !== undefined ? String(value) : `{{${trimmed}}}`
  })
}

/**
 * Build a lookup map: "bandIndex:compIndex" => ResolvedElement
 * for the first page of render output (non-repeating / header / footer).
 * Detail bands that repeat get keyed by their first occurrence only.
 */
function buildResolvedMap(
  elements: ResolvedElement[],
  bands: Array<{ type: string; components: unknown[] }>,
): Map<string, ResolvedElement> {
  const map = new Map<string, ResolvedElement>()
  // Track how many detail instances have been seen so we can map them back
  // to band indices. For header/footer we match 1:1.
  const bandCounters = new Map<number, number>()

  let elemIdx = 0
  for (let bandIdx = 0; bandIdx < bands.length; bandIdx++) {
    const band = bands[bandIdx]
    const compCount = band.components.length

    // Get elements for this band slot
    for (let compIdx = 0; compIdx < compCount; compIdx++) {
      if (elemIdx < elements.length) {
        map.set(`${bandIdx}:${compIdx}`, elements[elemIdx])
        elemIdx++
      }
    }

    bandCounters.set(bandIdx, (bandCounters.get(bandIdx) ?? 0) + 1)
  }

  return map
}

export function CanvasArea() {
  const report = useDesignerStore((s) => s.report)
  const sampleData = useDesignerStore((s) => s.sampleData)
  const selectedBandIndex = useDesignerStore((s) => s.selectedBandIndex)
  const selectedComponentIndex = useDesignerStore((s) => s.selectedComponentIndex)
  const selectComponent = useDesignerStore((s) => s.selectComponent)
  const selectBand = useDesignerStore((s) => s.selectBand)
  const zoom = useDesignerStore((s) => s.zoom)

  /**
   * Try to run renderReport synchronously to get fully-resolved element properties
   * (supports function expressions like {{formatCurrency(price, 'TRY')}}).
   * Falls back gracefully on any error.
   */
  const resolvedMap = useMemo((): Map<string, ResolvedElement> | null => {
    if (Object.keys(sampleData).length === 0) return null
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { renderReport } = require('@nextreport/engine-core') as typeof import('@nextreport/engine-core')
      const ir = renderReport(report, sampleData)
      // Flatten all page elements into one list (use first page only for canvas display)
      const allElements = ir.pages.flatMap((p) => p.elements)
      return buildResolvedMap(allElements, report.bands as Array<{ type: string; components: unknown[] }>)
    } catch {
      return null
    }
  }, [report, sampleData])

  /**
   * Resolve display text for a text component at the given band/comp position.
   * Prefers engine-resolved value; falls back to regex resolver.
   */
  function resolveDisplayText(
    bandIndex: number,
    compIndex: number,
    content: unknown,
  ): string {
    if (resolvedMap) {
      const el = resolvedMap.get(`${bandIndex}:${compIndex}`)
      if (el && el.properties.content !== undefined) {
        return String(el.properties.content)
      }
    }
    if (Object.keys(sampleData).length > 0) {
      return resolveContentFallback(content, sampleData)
    }
    return content === undefined || content === null ? '' : String(content)
  }

  const paperWidth = 595

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 32,
        background: '#1a1a2e',
      }}
    >
      {/* Paper */}
      <div
        style={{
          width: paperWidth * zoom,
          background: '#fff',
          boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
          transformOrigin: 'top center',
          position: 'relative',
        }}
      >
        {report.bands.map((band, bandIndex) => {
          const bandColor = BAND_COLORS[band.type] ?? '#888'
          const isBandSelected = selectedBandIndex === bandIndex && selectedComponentIndex === null

          return (
            <div
              key={bandIndex}
              onClick={(e) => {
                e.stopPropagation()
                selectBand(bandIndex)
              }}
              style={{
                position: 'relative',
                width: '100%',
                height: band.height * zoom,
                borderLeft: `4px solid ${bandColor}`,
                borderBottom: '1px solid #e0e0e0',
                background: isBandSelected ? '#f0f4ff' : '#fff',
                boxSizing: 'border-box',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              {/* Band type label */}
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 6,
                  fontSize: 10 * zoom,
                  color: bandColor,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  pointerEvents: 'none',
                  opacity: 0.7,
                }}
              >
                {band.type}
              </div>

              {/* Components */}
              {band.components.map((component, compIndex) => {
                const isSelected =
                  selectedBandIndex === bandIndex && selectedComponentIndex === compIndex

                const pos = component.position

                return (
                  <div
                    key={compIndex}
                    onClick={(e) => {
                      e.stopPropagation()
                      selectComponent(bandIndex, compIndex)
                    }}
                    style={{
                      position: 'absolute',
                      left: pos.x * zoom,
                      top: pos.y * zoom,
                      width: pos.width * zoom,
                      height: pos.height * zoom,
                      border: isSelected ? '2px dashed #2196f3' : '1px dashed #bdbdbd',
                      boxSizing: 'border-box',
                      background: isSelected ? 'rgba(33,150,243,0.06)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      padding: '0 2px',
                    }}
                  >
                    {component.type === 'text' && (() => {
                      const tc = component as TextComponent
                      const displayText = resolveDisplayText(bandIndex, compIndex, tc.content)
                      return (
                        <span
                          style={{
                            fontSize: tc.fontSize * zoom,
                            fontWeight: tc.fontWeight as React.CSSProperties['fontWeight'],
                            color: tc.color,
                            textAlign: tc.textAlign as React.CSSProperties['textAlign'],
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1,
                          }}
                        >
                          {displayText}
                        </span>
                      )
                    })()}
                    {component.type === 'table' && (() => {
                      const tc = component as TableComponent
                      return (
                        <span
                          style={{
                            fontSize: 10 * zoom,
                            color: '#555',
                            fontStyle: 'italic',
                          }}
                        >
                          [Table: {tc.dataBinding || 'no binding'}]
                        </span>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Empty state */}
        {report.bands.length === 0 && (
          <div
            style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#aaa',
              fontSize: 14,
            }}
          >
            No bands &mdash; add one from the left panel
          </div>
        )}
      </div>
    </div>
  )
}

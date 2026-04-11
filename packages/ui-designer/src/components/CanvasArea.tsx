import React from 'react'
import { useDesignerStore } from '../store/index.js'
import type { TextComponent, TableComponent } from '@nextreport/schema'

const BAND_COLORS: Record<string, string> = {
  header: '#4caf50',
  detail: '#e91e63',
  footer: '#3f51b5',
}

/**
 * Simple MVP expression resolver: replaces {{key}} tokens with values from data.
 * Full engine expression evaluation is used at render time; this is preview only.
 */
function resolveContent(content: unknown, sampleData: Record<string, unknown>): string {
  if (content === undefined || content === null) return ''
  const str = String(content)
  return str.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const trimmed = key.trim()
    const value = sampleData[trimmed]
    return value !== undefined ? String(value) : `{{${trimmed}}}`
  })
}

export function CanvasArea() {
  const report = useDesignerStore((s) => s.report)
  const sampleData = useDesignerStore((s) => s.sampleData)
  const selectedBandIndex = useDesignerStore((s) => s.selectedBandIndex)
  const selectedComponentIndex = useDesignerStore((s) => s.selectedComponentIndex)
  const selectComponent = useDesignerStore((s) => s.selectComponent)
  const selectBand = useDesignerStore((s) => s.selectBand)
  const zoom = useDesignerStore((s) => s.zoom)

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
                      const hasSampleData = Object.keys(sampleData).length > 0
                      const displayText = hasSampleData
                        ? resolveContent(tc.content, sampleData)
                        : tc.content
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
            No bands — add one from the left panel
          </div>
        )}
      </div>
    </div>
  )
}

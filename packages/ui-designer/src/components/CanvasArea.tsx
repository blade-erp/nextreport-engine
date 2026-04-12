import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useDesignerStore } from '../store/index.js'
import type {
  TextComponent,
  TableComponent,
  ImageComponent,
  BarcodeComponent,
} from '@nextreport/schema'
import type { ResolvedElement } from '@nextreport/engine-core'

const BAND_COLORS: Record<string, string> = {
  header: '#4caf50',
  detail: '#e91e63',
  footer: '#3f51b5',
  'group-header': '#ff9800',
  'group-footer': '#ff5722',
  'page-header': '#00bcd4',
  'page-footer': '#009688',
}

function resolveContentFallback(content: unknown, sampleData: Record<string, unknown>): string {
  if (content === undefined || content === null) return ''
  const str = String(content)
  return str.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const trimmed = key.trim()
    const value = sampleData[trimmed]
    return value !== undefined ? String(value) : `{{${trimmed}}}`
  })
}

function buildResolvedMap(
  elements: ResolvedElement[],
  bands: Array<{ type: string; components: unknown[] }>,
): Map<string, ResolvedElement> {
  const map = new Map<string, ResolvedElement>()
  const bandCounters = new Map<number, number>()

  let elemIdx = 0
  for (let bandIdx = 0; bandIdx < bands.length; bandIdx++) {
    const band = bands[bandIdx]
    const compCount = band.components.length

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

const RESIZE_HANDLE_SIZE = 8

export function CanvasArea() {
  const report = useDesignerStore((s) => s.report)
  const sampleData = useDesignerStore((s) => s.sampleData)
  const selectedBandIndex = useDesignerStore((s) => s.selectedBandIndex)
  const selectedComponentIndex = useDesignerStore((s) => s.selectedComponentIndex)
  const selectComponent = useDesignerStore((s) => s.selectComponent)
  const selectBand = useDesignerStore((s) => s.selectBand)
  const clearSelection = useDesignerStore((s) => s.clearSelection)
  const zoom = useDesignerStore((s) => s.zoom)
  const addComponent = useDesignerStore((s) => s.addComponent)
  const removeComponent = useDesignerStore((s) => s.removeComponent)
  const updateComponentPosition = useDesignerStore((s) => s.updateComponentPosition)
  const pushHistory = useDesignerStore((s) => s.pushHistory)
  const undo = useDesignerStore((s) => s.undo)
  const redo = useDesignerStore((s) => s.redo)

  const containerRef = useRef<HTMLDivElement>(null)

  // Resolved map for engine-powered display
  const [resolvedMap, setResolvedMap] = useState<Map<string, ResolvedElement> | null>(null)

  useEffect(() => {
    if (Object.keys(sampleData).length === 0) {
      setResolvedMap(null)
      return
    }
    let cancelled = false
    import('@nextreport/engine-core')
      .then(({ renderReport }) => {
        if (cancelled) return
        try {
          const ir = renderReport(report, sampleData)
          const allElements = ir.pages.flatMap((p: { elements: ResolvedElement[] }) => p.elements)
          setResolvedMap(
            buildResolvedMap(
              allElements,
              report.bands as Array<{ type: string; components: unknown[] }>,
            ),
          )
        } catch {
          setResolvedMap(null)
        }
      })
      .catch(() => {
        if (!cancelled) setResolvedMap(null)
      })
    return () => {
      cancelled = true
    }
  }, [report, sampleData])

  function resolveDisplayText(bandIndex: number, compIndex: number, content: unknown): string {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas area or its children are focused
      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== document.body
      )
        return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBandIndex !== null && selectedComponentIndex !== null) {
          e.preventDefault()
          pushHistory()
          removeComponent(selectedBandIndex, selectedComponentIndex)
        }
      } else if (e.key === 'Escape') {
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedBandIndex,
    selectedComponentIndex,
    undo,
    redo,
    pushHistory,
    removeComponent,
    clearSelection,
  ])

  // Drag & drop from toolbox
  const handleDrop = useCallback(
    (bandIndex: number, e: React.DragEvent) => {
      e.preventDefault()
      const json = e.dataTransfer.getData('application/nextreport-component')
      if (!json) return

      try {
        const component = JSON.parse(json)
        const bandEl = e.currentTarget as HTMLElement
        const rect = bandEl.getBoundingClientRect()
        const x = (e.clientX - rect.left) / zoom
        const y = (e.clientY - rect.top) / zoom

        component.position = {
          ...component.position,
          x: Math.max(0, Math.round(x)),
          y: Math.max(0, Math.round(y)),
        }

        pushHistory()
        addComponent(bandIndex, component)
      } catch {
        // Invalid data
      }
    },
    [zoom, pushHistory, addComponent],
  )

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/nextreport-component')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  // Component dragging (move)
  const [dragging, setDragging] = useState<{
    bandIndex: number
    compIndex: number
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const handleComponentMouseDown = (e: React.MouseEvent, bandIndex: number, compIndex: number) => {
    e.stopPropagation()
    selectComponent(bandIndex, compIndex)

    const comp = report.bands[bandIndex].components[compIndex]
    setDragging({
      bandIndex,
      compIndex,
      startX: e.clientX,
      startY: e.clientY,
      origX: comp.position.x,
      origY: comp.position.y,
    })
  }

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragging.startX) / zoom
      const dy = (e.clientY - dragging.startY) / zoom
      updateComponentPosition(dragging.bandIndex, dragging.compIndex, {
        x: Math.max(0, Math.round(dragging.origX + dx)),
        y: Math.max(0, Math.round(dragging.origY + dy)),
      })
    }

    const handleMouseUp = () => {
      const comp = report.bands[dragging.bandIndex]?.components[dragging.compIndex]
      if (comp && (comp.position.x !== dragging.origX || comp.position.y !== dragging.origY)) {
        pushHistory()
      }
      setDragging(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, zoom, updateComponentPosition, pushHistory, report])

  // Resize handling
  const [resizing, setResizing] = useState<{
    bandIndex: number
    compIndex: number
    handle: string
    startX: number
    startY: number
    origW: number
    origH: number
    origX: number
    origY: number
  } | null>(null)

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    bandIndex: number,
    compIndex: number,
    handle: string,
  ) => {
    e.stopPropagation()
    e.preventDefault()
    const comp = report.bands[bandIndex].components[compIndex]
    setResizing({
      bandIndex,
      compIndex,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origW: comp.position.width,
      origH: comp.position.height,
      origX: comp.position.x,
      origY: comp.position.y,
    })
  }

  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizing.startX) / zoom
      const dy = (e.clientY - resizing.startY) / zoom
      const updates: Record<string, number> = {}

      if (resizing.handle.includes('e')) {
        updates.width = Math.max(20, Math.round(resizing.origW + dx))
      }
      if (resizing.handle.includes('s')) {
        updates.height = Math.max(10, Math.round(resizing.origH + dy))
      }
      if (resizing.handle.includes('w')) {
        const newW = Math.max(20, Math.round(resizing.origW - dx))
        updates.width = newW
        updates.x = Math.max(0, Math.round(resizing.origX + resizing.origW - newW))
      }
      if (resizing.handle.includes('n')) {
        const newH = Math.max(10, Math.round(resizing.origH - dy))
        updates.height = newH
        updates.y = Math.max(0, Math.round(resizing.origY + resizing.origH - newH))
      }

      updateComponentPosition(resizing.bandIndex, resizing.compIndex, updates)
    }

    const handleMouseUp = () => {
      pushHistory()
      setResizing(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing, zoom, updateComponentPosition, pushHistory])

  const paperWidth = 595

  const renderResizeHandles = (bandIndex: number, compIndex: number) => {
    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']
    const cursorMap: Record<string, string> = {
      nw: 'nw-resize',
      ne: 'ne-resize',
      sw: 'sw-resize',
      se: 'se-resize',
      n: 'n-resize',
      s: 's-resize',
      e: 'e-resize',
      w: 'w-resize',
    }
    const posMap: Record<string, React.CSSProperties> = {
      nw: { top: -RESIZE_HANDLE_SIZE / 2, left: -RESIZE_HANDLE_SIZE / 2 },
      ne: { top: -RESIZE_HANDLE_SIZE / 2, right: -RESIZE_HANDLE_SIZE / 2 },
      sw: { bottom: -RESIZE_HANDLE_SIZE / 2, left: -RESIZE_HANDLE_SIZE / 2 },
      se: { bottom: -RESIZE_HANDLE_SIZE / 2, right: -RESIZE_HANDLE_SIZE / 2 },
      n: { top: -RESIZE_HANDLE_SIZE / 2, left: '50%', transform: 'translateX(-50%)' },
      s: { bottom: -RESIZE_HANDLE_SIZE / 2, left: '50%', transform: 'translateX(-50%)' },
      e: { top: '50%', right: -RESIZE_HANDLE_SIZE / 2, transform: 'translateY(-50%)' },
      w: { top: '50%', left: -RESIZE_HANDLE_SIZE / 2, transform: 'translateY(-50%)' },
    }

    return handles.map((h) => (
      <div
        key={h}
        style={{
          position: 'absolute',
          width: RESIZE_HANDLE_SIZE,
          height: RESIZE_HANDLE_SIZE,
          background: '#2196f3',
          border: '1px solid #fff',
          cursor: cursorMap[h],
          zIndex: 10,
          ...posMap[h],
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, bandIndex, compIndex, h)}
      />
    ))
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 32,
        background: '#1a1a2e',
        outline: 'none',
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
              onDrop={(e) => handleDrop(bandIndex, e)}
              onDragOver={handleDragOver}
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
                    onMouseDown={(e) => handleComponentMouseDown(e, bandIndex, compIndex)}
                    style={{
                      position: 'absolute',
                      left: pos.x * zoom,
                      top: pos.y * zoom,
                      width: pos.width * zoom,
                      height: pos.height * zoom,
                      border: isSelected ? '2px dashed #2196f3' : '1px dashed #bdbdbd',
                      boxSizing: 'border-box',
                      background: isSelected ? 'rgba(33,150,243,0.06)' : 'transparent',
                      cursor: dragging ? 'grabbing' : 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      padding: '0 2px',
                    }}
                  >
                    {component.type === 'text' &&
                      (() => {
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
                              pointerEvents: 'none',
                            }}
                          >
                            {displayText}
                          </span>
                        )
                      })()}
                    {component.type === 'table' &&
                      (() => {
                        const tc = component as TableComponent
                        return (
                          <span
                            style={{
                              fontSize: 10 * zoom,
                              color: '#555',
                              fontStyle: 'italic',
                              pointerEvents: 'none',
                            }}
                          >
                            [Table: {tc.dataBinding || 'no binding'}]
                          </span>
                        )
                      })()}
                    {component.type === 'image' &&
                      (() => {
                        const ic = component as ImageComponent
                        return ic.src ? (
                          <img
                            src={ic.src}
                            alt={ic.alt}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: ic.objectFit as React.CSSProperties['objectFit'],
                              pointerEvents: 'none',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 10 * zoom,
                              color: '#999',
                              fontStyle: 'italic',
                              pointerEvents: 'none',
                            }}
                          >
                            [Image: no src]
                          </span>
                        )
                      })()}
                    {component.type === 'barcode' &&
                      (() => {
                        const bc = component as BarcodeComponent
                        return (
                          <span
                            style={{
                              fontSize: 10 * zoom,
                              color: '#555',
                              fontStyle: 'italic',
                              pointerEvents: 'none',
                            }}
                          >
                            [{bc.format === 'qr' ? 'QR' : 'Code128'}: {bc.value || 'no value'}]
                          </span>
                        )
                      })()}

                    {/* Resize handles */}
                    {isSelected &&
                      !dragging &&
                      !resizing &&
                      renderResizeHandles(bandIndex, compIndex)}
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

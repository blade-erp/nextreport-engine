import React from 'react'
import { useDesignerStore } from '../store/index.js'

export function DesignerToolbar() {
  const canUndo = useDesignerStore((s) => s.canUndo)
  const canRedo = useDesignerStore((s) => s.canRedo)
  const undo = useDesignerStore((s) => s.undo)
  const redo = useDesignerStore((s) => s.redo)
  const zoom = useDesignerStore((s) => s.zoom)
  const setZoom = useDesignerStore((s) => s.setZoom)
  const report = useDesignerStore((s) => s.report)

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'report.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePreview = () => {
    sessionStorage.setItem('preview-report', JSON.stringify(report))
    sessionStorage.setItem('preview-data', JSON.stringify(useDesignerStore.getState().sampleData))
    window.open('/viewer?source=designer', '_blank')
  }

  const decreaseZoom = () => setZoom(Math.max(0.25, Math.round((zoom - 0.25) * 100) / 100))
  const increaseZoom = () => setZoom(Math.min(3, Math.round((zoom + 0.25) * 100) / 100))

  const btnStyle: React.CSSProperties = {
    background: '#3d3d5c',
    border: '1px solid #5a5a7a',
    color: '#ccc',
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  }

  const disabledBtnStyle: React.CSSProperties = {
    ...btnStyle,
    opacity: 0.4,
    cursor: 'not-allowed',
  }

  const accentBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: '#7c7cff',
    borderColor: '#7c7cff',
    color: '#fff',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#2d2d3f',
        borderBottom: '1px solid #3d3d5c',
        padding: '8px 16px',
        height: 48,
        flexShrink: 0,
      }}
    >
      {/* Left: Logo */}
      <div style={{ color: '#7c7cff', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
        NextReport
      </div>

      {/* Center: Undo / Redo / Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          style={canUndo ? btnStyle : disabledBtnStyle}
          disabled={!canUndo}
          onClick={undo}
          title="Undo"
        >
          ↩ Undo
        </button>
        <button
          style={canRedo ? btnStyle : disabledBtnStyle}
          disabled={!canRedo}
          onClick={redo}
          title="Redo"
        >
          Redo ↪
        </button>
        <div style={{ width: 1, height: 20, background: '#3d3d5c', margin: '0 4px' }} />
        <button style={btnStyle} onClick={decreaseZoom} title="Zoom out">
          −
        </button>
        <span style={{ color: '#ccc', fontSize: 13, minWidth: 50, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button style={btnStyle} onClick={increaseZoom} title="Zoom in">
          +
        </button>
      </div>

      {/* Right: Preview / Export */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={btnStyle} onClick={handleExportJson}>
          Export JSON
        </button>
        <button style={accentBtnStyle} onClick={handlePreview}>
          Preview
        </button>
      </div>
    </div>
  )
}

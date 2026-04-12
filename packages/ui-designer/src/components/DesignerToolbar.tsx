import React, { useState } from 'react'
import { useDesignerStore } from '../store/index.js'

interface DesignerToolbarProps {
  showPreview: boolean
  togglePreview: () => void
}

export function DesignerToolbar({ showPreview, togglePreview }: DesignerToolbarProps) {
  const canUndo = useDesignerStore((s) => s.canUndo)
  const canRedo = useDesignerStore((s) => s.canRedo)
  const undo = useDesignerStore((s) => s.undo)
  const redo = useDesignerStore((s) => s.redo)
  const zoom = useDesignerStore((s) => s.zoom)
  const setZoom = useDesignerStore((s) => s.setZoom)
  const report = useDesignerStore((s) => s.report)
  const setReport = useDesignerStore((s) => s.setReport)
  const setSampleData = useDesignerStore((s) => s.setSampleData)

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'report.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJson = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        setReport(parsed)
      } catch {
        // Invalid file
      }
    }
    input.click()
  }

  const handleSave = async () => {
    const name = prompt('Template name:')
    if (!name) return

    setSaving(true)
    try {
      const sampleData = useDesignerStore.getState().sampleData
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, template: report, sampleData }),
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Saved as: ${data.meta.name} (${data.meta.id})`)
      }
    } catch {
      // Save failed
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/templates')
      if (!res.ok) return
      const { templates } = await res.json()
      if (!templates?.length) {
        alert('No saved templates found')
        return
      }

      const list = templates
        .map(
          (t: { id: string; name: string }, i: number) =>
            `${i + 1}. ${t.name} (${t.id.slice(0, 8)}...)`,
        )
        .join('\n')
      const choice = prompt(`Select template (enter number):\n\n${list}`)
      if (!choice) return

      const idx = parseInt(choice, 10) - 1
      const selected = templates[idx]
      if (!selected) return

      const detail = await fetch(`/api/templates/${selected.id}`)
      if (!detail.ok) return
      const data = await detail.json()
      setReport(data.template)
      if (data.sampleData && Object.keys(data.sampleData).length > 0) {
        setSampleData(data.sampleData)
      }
    } catch {
      // Load failed
    } finally {
      setLoading(false)
    }
  }

  const handleOpenViewer = () => {
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

  const activePreviewBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: '#4caf50',
    borderColor: '#4caf50',
    color: '#fff',
  }

  const secondaryBtnStyle: React.CSSProperties = {
    ...btnStyle,
    fontSize: 11,
    padding: '4px 8px',
    background: 'transparent',
    color: '#aaa',
    borderColor: '#3d3d5c',
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
          title="Undo (Ctrl+Z)"
        >
          &#8617; Undo
        </button>
        <button
          style={canRedo ? btnStyle : disabledBtnStyle}
          disabled={!canRedo}
          onClick={redo}
          title="Redo (Ctrl+Y)"
        >
          Redo &#8618;
        </button>
        <div style={{ width: 1, height: 20, background: '#3d3d5c', margin: '0 4px' }} />
        <button style={btnStyle} onClick={decreaseZoom} title="Zoom out">
          &minus;
        </button>
        <span style={{ color: '#ccc', fontSize: 13, minWidth: 50, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button style={btnStyle} onClick={increaseZoom} title="Zoom in">
          +
        </button>
      </div>

      {/* Right: Save / Load / Preview / Export */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={accentBtnStyle} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button style={btnStyle} onClick={handleLoad} disabled={loading}>
          {loading ? 'Loading...' : 'Load'}
        </button>
        <div style={{ width: 1, height: 20, background: '#3d3d5c', margin: '0 2px' }} />
        <button style={btnStyle} onClick={handleExportJson}>
          Export JSON
        </button>
        <button style={secondaryBtnStyle} onClick={handleImportJson}>
          Import
        </button>
        <button
          style={showPreview ? activePreviewBtnStyle : accentBtnStyle}
          onClick={togglePreview}
          title={showPreview ? 'Hide live preview panel' : 'Show live preview panel'}
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>
        <button
          style={secondaryBtnStyle}
          onClick={handleOpenViewer}
          title="Open full-page viewer in new tab"
        >
          Open Viewer
        </button>
      </div>
    </div>
  )
}

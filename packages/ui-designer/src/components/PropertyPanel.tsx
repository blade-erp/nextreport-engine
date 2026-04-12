import React from 'react'
import { useDesignerStore } from '../store/index.js'
import type { TextComponent } from '@nextreport/schema'

const SECTION: React.CSSProperties = {
  padding: '12px 12px 8px',
  borderBottom: '1px solid #3d3d5c',
}

const LABEL: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 8,
  fontWeight: 600,
}

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 11,
  color: '#888',
  marginBottom: 3,
  display: 'block',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  background: '#1a1a2e',
  border: '1px solid #3d3d5c',
  borderRadius: 3,
  color: '#ccc',
  fontSize: 12,
  padding: '4px 6px',
  boxSizing: 'border-box',
  outline: 'none',
}

const FIELD_GROUP: React.CSSProperties = {
  marginBottom: 10,
}

const TOGGLE_BTN = (active: boolean): React.CSSProperties => ({
  padding: '3px 10px',
  background: active ? '#7c7cff' : '#2d2d3f',
  border: `1px solid ${active ? '#7c7cff' : '#3d3d5c'}`,
  color: active ? '#fff' : '#ccc',
  cursor: 'pointer',
  fontSize: 12,
  borderRadius: 3,
})

export function PropertyPanel() {
  const report = useDesignerStore((s) => s.report)
  const selectedBandIndex = useDesignerStore((s) => s.selectedBandIndex)
  const selectedComponentIndex = useDesignerStore((s) => s.selectedComponentIndex)
  const updateComponent = useDesignerStore((s) => s.updateComponent)
  const updateComponentPosition = useDesignerStore((s) => s.updateComponentPosition)
  const pushHistory = useDesignerStore((s) => s.pushHistory)

  const hasSelection = selectedBandIndex !== null && selectedComponentIndex !== null

  if (!hasSelection) {
    return (
      <div
        style={{
          ...SECTION,
          color: '#555',
          fontSize: 13,
          textAlign: 'center',
          paddingTop: 24,
        }}
      >
        Select a component to edit its properties
      </div>
    )
  }

  const component = report.bands[selectedBandIndex!]?.components[selectedComponentIndex!]
  if (!component) {
    return (
      <div
        style={{
          ...SECTION,
          color: '#555',
          fontSize: 13,
          textAlign: 'center',
          paddingTop: 24,
        }}
      >
        Component not found
      </div>
    )
  }

  const bIdx = selectedBandIndex!
  const cIdx = selectedComponentIndex!
  const pos = component.position

  const handleProp = (key: string, value: unknown) => {
    pushHistory()
    updateComponent(bIdx, cIdx, { [key]: value })
  }

  const handlePos = (key: keyof typeof pos, value: number) => {
    pushHistory()
    updateComponentPosition(bIdx, cIdx, { [key]: value })
  }

  return (
    <div>
      {/* Header */}
      <div style={SECTION}>
        <div style={LABEL}>Properties</div>
        <div
          style={{
            fontSize: 12,
            color: '#7c7cff',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {component.type} Component
        </div>
      </div>

      {/* Text component properties */}
      {component.type === 'text' &&
        (() => {
          const tc = component as TextComponent
          return (
            <div style={SECTION}>
              <div style={LABEL}>Content</div>

              <div style={FIELD_GROUP}>
                <label style={FIELD_LABEL}>Expression</label>
                <input
                  style={INPUT}
                  type="text"
                  value={tc.content}
                  onChange={(e) => handleProp('content', e.target.value)}
                  placeholder="{{fieldName}} or plain text"
                />
              </div>

              <div style={FIELD_GROUP}>
                <label style={FIELD_LABEL}>Font Size</label>
                <input
                  style={{ ...INPUT, width: 80 }}
                  type="number"
                  min={6}
                  max={96}
                  value={tc.fontSize}
                  onChange={(e) => handleProp('fontSize', Number(e.target.value))}
                />
              </div>

              <div style={FIELD_GROUP}>
                <label style={FIELD_LABEL}>Font Weight</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    style={TOGGLE_BTN(tc.fontWeight === 'normal')}
                    onClick={() => handleProp('fontWeight', 'normal')}
                  >
                    Normal
                  </button>
                  <button
                    style={TOGGLE_BTN(tc.fontWeight === 'bold')}
                    onClick={() => handleProp('fontWeight', 'bold')}
                  >
                    Bold
                  </button>
                </div>
              </div>

              <div style={FIELD_GROUP}>
                <label style={FIELD_LABEL}>Color</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 3,
                      background: tc.color,
                      border: '1px solid #3d3d5c',
                      flexShrink: 0,
                    }}
                  />
                  <input
                    style={INPUT}
                    type="text"
                    value={tc.color}
                    onChange={(e) => handleProp('color', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div style={FIELD_GROUP}>
                <label style={FIELD_LABEL}>Text Align</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      style={TOGGLE_BTN(tc.textAlign === align)}
                      onClick={() => handleProp('textAlign', align)}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}

      {/* Position */}
      <div style={SECTION}>
        <div style={LABEL}>Position &amp; Size</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {(['x', 'y', 'width', 'height'] as const).map((key) => (
            <div key={key}>
              <label style={FIELD_LABEL}>{key.toUpperCase()}</label>
              <input
                style={INPUT}
                type="number"
                min={0}
                value={pos[key]}
                onChange={(e) => handlePos(key, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

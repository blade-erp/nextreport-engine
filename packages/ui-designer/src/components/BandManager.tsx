import React, { useState } from 'react'
import { useDesignerStore } from '../store/index.js'
import type { BandType } from '@nextreport/schema'

const BAND_COLORS: Record<string, string> = {
  header: '#4caf50',
  detail: '#e91e63',
  footer: '#3f51b5',
}

const BAND_TYPES: BandType[] = ['header', 'detail', 'footer']

export function BandManager() {
  const report = useDesignerStore((s) => s.report)
  const selectedBandIndex = useDesignerStore((s) => s.selectedBandIndex)
  const selectBand = useDesignerStore((s) => s.selectBand)
  const addBand = useDesignerStore((s) => s.addBand)
  const removeBand = useDesignerStore((s) => s.removeBand)
  const pushHistory = useDesignerStore((s) => s.pushHistory)

  const [addOpen, setAddOpen] = useState(false)

  const handleAddBand = (type: BandType) => {
    pushHistory()
    addBand(type)
    setAddOpen(false)
  }

  const handleRemoveBand = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    pushHistory()
    removeBand(index)
  }

  const sectionStyle: React.CSSProperties = {
    padding: '12px 12px 8px',
    borderBottom: '1px solid #3d3d5c',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const addBtnStyle: React.CSSProperties = {
    background: '#7c7cff',
    border: 'none',
    color: '#fff',
    width: 20,
    height: 20,
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: '20px',
    textAlign: 'center',
    padding: 0,
  }

  const dropdownItemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '6px 10px',
    background: 'none',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 12,
  }

  return (
    <div style={sectionStyle}>
      <div style={labelStyle}>
        <span>Bands</span>
        <button
          style={addBtnStyle}
          onClick={() => setAddOpen((v) => !v)}
          title="Add band"
        >
          +
        </button>
      </div>

      {/* Add band dropdown */}
      {addOpen && (
        <div
          style={{
            background: '#2d2d3f',
            border: '1px solid #3d3d5c',
            borderRadius: 4,
            marginBottom: 6,
            overflow: 'hidden',
          }}
        >
          {BAND_TYPES.map((type) => (
            <button
              key={type}
              style={dropdownItemStyle}
              onClick={() => handleAddBand(type)}
              onMouseEnter={(e) => {
                ;(e.target as HTMLElement).style.background = '#3d3d5c'
              }}
              onMouseLeave={(e) => {
                ;(e.target as HTMLElement).style.background = 'none'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: BAND_COLORS[type] ?? '#888',
                  marginRight: 6,
                }}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Band list */}
      <div>
        {report.bands.map((band, index) => {
          const isSelected = selectedBandIndex === index
          const color = BAND_COLORS[band.type] ?? '#888'

          return (
            <div
              key={index}
              onClick={() => selectBand(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                background: isSelected ? '#3d3d5c' : 'transparent',
                marginBottom: 2,
                border: isSelected ? `1px solid ${color}44` : '1px solid transparent',
              }}
            >
              {/* Color dot */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />

              {/* Band info */}
              <span style={{ flex: 1, fontSize: 12, color: isSelected ? '#fff' : '#ccc' }}>
                {band.type.charAt(0).toUpperCase() + band.type.slice(1)}
                <span style={{ color: '#666', fontSize: 10, marginLeft: 6 }}>
                  {band.height}pt · {band.components.length} comp
                </span>
              </span>

              {/* Remove button */}
              <button
                onClick={(e) => handleRemoveBand(e, index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '0 2px',
                  lineHeight: 1,
                }}
                title="Remove band"
              >
                ×
              </button>
            </div>
          )
        })}

        {report.bands.length === 0 && (
          <div style={{ fontSize: 11, color: '#555', paddingTop: 4 }}>
            No bands. Click + to add.
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import { useDesignerStore } from '../store/index.js'
import type { Component } from '@nextreport/schema'

interface ToolItem {
  label: string
  icon: string
  factory: () => Component
}

const TOOLS: ToolItem[] = [
  {
    label: 'Text',
    icon: 'T',
    factory: () => ({
      type: 'text',
      position: { x: 10, y: 5, width: 150, height: 25 },
      content: 'New Text',
      fontSize: 12,
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left',
    }),
  },
  {
    label: 'Table',
    icon: '#',
    factory: () => ({
      type: 'table',
      position: { x: 10, y: 5, width: 300, height: 60 },
      dataBinding: '',
      columns: [],
    }),
  },
  {
    label: 'Image',
    icon: '\u{1F5BC}',
    factory: () => ({
      type: 'image',
      position: { x: 10, y: 5, width: 100, height: 80 },
      src: '',
      alt: '',
      objectFit: 'contain',
    }),
  },
  {
    label: 'Barcode',
    icon: '\u{2588}',
    factory: () => ({
      type: 'barcode',
      position: { x: 10, y: 5, width: 100, height: 100 },
      value: '',
      format: 'qr',
      color: '#000000',
      backgroundColor: '#ffffff',
    }),
  },
]

export function Toolbox() {
  const selectedBandIndex = useDesignerStore((s) => s.selectedBandIndex)
  const addComponent = useDesignerStore((s) => s.addComponent)
  const pushHistory = useDesignerStore((s) => s.pushHistory)

  const disabled = selectedBandIndex === null

  const handleAdd = (tool: ToolItem) => {
    if (selectedBandIndex === null) return
    pushHistory()
    addComponent(selectedBandIndex, tool.factory())
  }

  const handleDragStart = (e: React.DragEvent, tool: ToolItem) => {
    e.dataTransfer.setData('application/nextreport-component', JSON.stringify(tool.factory()))
    e.dataTransfer.effectAllowed = 'copy'
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
  }

  const toolBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '7px 10px',
    background: disabled ? '#2a2a40' : '#3d3d5c',
    border: '1px solid #4a4a6a',
    borderRadius: 4,
    color: disabled ? '#555' : '#ccc',
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'grab',
    marginBottom: 6,
    textAlign: 'left',
    opacity: disabled ? 0.5 : 1,
  }

  return (
    <div style={sectionStyle}>
      <div style={labelStyle}>Components</div>
      {disabled && (
        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>Select a band first</div>
      )}
      {TOOLS.map((tool) => (
        <button
          key={tool.label}
          style={toolBtnStyle}
          disabled={disabled}
          draggable={!disabled}
          onClick={() => handleAdd(tool)}
          onDragStart={(e) => handleDragStart(e, tool)}
        >
          <span style={{ fontSize: 14 }}>{tool.icon}</span>
          {tool.label}
        </button>
      ))}
    </div>
  )
}

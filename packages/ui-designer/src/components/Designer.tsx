import React from 'react'
import { DesignerToolbar } from './DesignerToolbar.js'
import { Toolbox } from './Toolbox.js'
import { BandManager } from './BandManager.js'
import { CanvasArea } from './CanvasArea.js'
import { PropertyPanel } from './PropertyPanel.js'

export function Designer() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#1a1a2e',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <DesignerToolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div
          style={{
            width: 240,
            background: '#252538',
            borderRight: '1px solid #3d3d5c',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <Toolbox />
          <BandManager />
        </div>

        {/* Canvas */}
        <CanvasArea />

        {/* Right panel */}
        <div
          style={{
            width: 280,
            background: '#252538',
            borderLeft: '1px solid #3d3d5c',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <PropertyPanel />
        </div>
      </div>
    </div>
  )
}

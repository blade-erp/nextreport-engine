import React, { useState } from 'react'
import { DesignerToolbar } from './DesignerToolbar.js'
import { Toolbox } from './Toolbox.js'
import { BandManager } from './BandManager.js'
import { DataSourceTree } from './DataSourceTree.js'
import { CanvasArea } from './CanvasArea.js'
import { PropertyPanel } from './PropertyPanel.js'
import { PreviewPanel } from './PreviewPanel.js'

export function Designer() {
  const [showPreview, setShowPreview] = useState(false)

  const togglePreview = () => setShowPreview((v) => !v)

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
      <DesignerToolbar showPreview={showPreview} togglePreview={togglePreview} />

      {/* Main content row */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div
          style={{
            width: 240,
            background: '#252538',
            borderRight: '1px solid #3d3d5c',
            overflowY: 'auto',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Toolbox />
          <BandManager />
          <DataSourceTree />
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

      {/* Live preview panel — rendered below when toggled */}
      {showPreview && <PreviewPanel />}
    </div>
  )
}

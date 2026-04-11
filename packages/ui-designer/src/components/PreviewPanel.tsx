'use client'
import { useState, useEffect } from 'react'
import { useDesignerStore } from '../store/index.js'

export function PreviewPanel() {
  const report = useDesignerStore((s) => s.report)
  const sampleData = useDesignerStore((s) => s.sampleData)
  const [html, setHtml] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { renderReport } = await import('@nextreport/engine-core')
        const { renderToHtml } = await import('@nextreport/renderer-html')
        const ir = renderReport(report, sampleData)
        const output = renderToHtml(ir, {
          pageSize: report.page?.size,
          orientation: report.page?.orientation,
        })
        setHtml(output)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Render error')
      }
    }, 300) // debounce 300ms
    return () => clearTimeout(timer)
  }, [report, sampleData])

  return (
    <div
      style={{
        borderTop: '2px solid #3d3d5c',
        height: 300,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 12px',
          background: '#2d2d3f',
          color: '#ccc',
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600 }}>Live Preview</span>
        {error && (
          <span style={{ color: '#ef4444', fontSize: 11 }} title={error}>
            Error: {error.length > 60 ? error.slice(0, 60) + '…' : error}
          </span>
        )}
        {!error && html && (
          <span style={{ color: '#4caf50', fontSize: 11 }}>Rendered</span>
        )}
      </div>

      {/* iframe content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-same-origin"
          title="Report Preview"
        />
      </div>
    </div>
  )
}

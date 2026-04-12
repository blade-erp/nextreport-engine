'use client'
import { useState, useEffect } from 'react'
import { ReportViewer } from '@nextreport/ui-viewer'
import type { Report } from '@nextreport/schema'

export default function ViewerPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [data, setData] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('source')
    const templateId = params.get('template')

    if (source === 'designer') {
      try {
        const r = sessionStorage.getItem('preview-report')
        const d = sessionStorage.getItem('preview-data')
        if (r) setReport(JSON.parse(r) as Report)
        if (d) setData(JSON.parse(d) as Record<string, unknown>)
      } catch {
        setError('Failed to load report from designer preview.')
      }
    } else if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then((r) => {
          if (!r.ok) throw new Error(`Template "${templateId}" not found`)
          return r.json()
        })
        .then(
          ({
            template,
            sampleData,
          }: {
            template: Report
            sampleData?: Record<string, unknown>
          }) => {
            setReport(template)
            setData(sampleData ?? {})
          },
        )
        .catch((err) => {
          setError(String(err))
        })
    } else {
      setError('No report source specified. Use ?template=invoice-v1 or ?source=designer.')
    }
  }, [])

  if (error) {
    return (
      <div style={{ padding: 24, color: '#c00' }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  if (!report) {
    return <div style={{ padding: 24, color: '#555' }}>Loading report...</div>
  }

  return (
    <div style={{ height: '100vh' }}>
      <ReportViewer report={report} data={data} />
    </div>
  )
}

'use client'
import { useEffect } from 'react'
import { Designer, useDesignerStore } from '@nextreport/ui-designer'

export default function DesignerPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('template')
    if (!templateId) return

    fetch(`/api/templates/${templateId}`)
      .then((r) => r.json())
      .then(({ template, sampleData }) => {
        if (template) useDesignerStore.getState().setReport(template)
        if (sampleData) useDesignerStore.getState().setSampleData(sampleData)
      })
      .catch(() => {
        // Ignore — keep default empty report
      })
  }, [])

  return <Designer />
}

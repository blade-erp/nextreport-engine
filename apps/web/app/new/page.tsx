'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Template {
  id: string | null
  name: string
  description: string
  icon: string
}

type DataOption = 'sample' | 'custom'

// ─── Data ────────────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: 'invoice-v1',
    name: 'Invoice',
    description: 'Professional invoice template with header, line items, and totals',
    icon: '🧾',
  },
  {
    id: 'simple-list-v1',
    name: 'Simple List',
    description: 'Clean tabular list report for data display',
    icon: '📋',
  },
  {
    id: null,
    name: 'Blank Report',
    description: 'Start from scratch with empty bands',
    icon: '📄',
  },
]

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Choose Template', 'Connect Data', 'Ready']
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isDone = stepNum < current
        const isActive = stepNum === current
        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                  isDone
                    ? 'bg-blue-500 text-white'
                    : isActive
                    ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                    : 'bg-gray-100 text-gray-400 border border-gray-200',
                ].join(' ')}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={[
                  'mt-1.5 text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-blue-600' : isDone ? 'text-blue-400' : 'text-gray-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={[
                  'h-0.5 w-16 mx-2 mb-5 rounded transition-all duration-300',
                  isDone ? 'bg-blue-400' : 'bg-gray-200',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Choose Template ─────────────────────────────────────────────────

function StepChooseTemplate({
  selected,
  onSelect,
  onNext,
}: {
  selected: Template | null
  onSelect: (t: Template) => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Choose a Template</h2>
      <p className="text-sm text-gray-500 mb-6">Pick the template that best fits your report.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TEMPLATES.map((t) => {
          const isSelected = selected?.name === t.name
          return (
            <button
              key={t.name}
              onClick={() => onSelect(t)}
              className={[
                'relative text-left rounded-xl border-2 p-5 transition-all duration-150 focus:outline-none',
                'hover:shadow-md hover:-translate-y-0.5',
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-200',
              ].join(' ')}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <div className="text-3xl mb-3">{t.icon}</div>
              <div className="font-semibold text-gray-800 mb-1">{t.name}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{t.description}</div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          disabled={!selected}
          className={[
            'px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-150',
            selected
              ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm hover:shadow'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Step 2 — Connect Data ────────────────────────────────────────────────────

function StepConnectData({
  template,
  dataOption,
  customJson,
  onDataOption,
  onCustomJson,
  onBack,
  onNext,
}: {
  template: Template
  dataOption: DataOption
  customJson: string
  onDataOption: (o: DataOption) => void
  onCustomJson: (v: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const isBlank = template.id === null
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleNext = () => {
    if (dataOption === 'custom' && customJson.trim()) {
      try {
        JSON.parse(customJson)
        setJsonError(null)
      } catch {
        setJsonError('Invalid JSON — please check your input.')
        return
      }
    }
    onNext()
  }

  const canProceed =
    dataOption === 'sample' || (dataOption === 'custom' && customJson.trim().length > 0)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Connect Data</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose how to supply data for <span className="font-medium text-gray-700">{template.name}</span>.
      </p>

      <div className="space-y-3">
        {/* Sample data option — only when a real template is selected */}
        {!isBlank && (
          <button
            onClick={() => { onDataOption('sample'); setJsonError(null) }}
            className={[
              'w-full text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none',
              'hover:shadow-sm',
              dataOption === 'sample'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                  dataOption === 'sample' ? 'border-blue-500 bg-blue-500' : 'border-gray-300',
                ].join(' ')}
              >
                {dataOption === 'sample' && (
                  <div className="w-full h-full rounded-full bg-white scale-[0.4] block" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-800 text-sm">Use sample data</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Loads the template&apos;s built-in sample dataset — perfect for a quick preview.
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Paste custom JSON */}
        <button
          onClick={() => onDataOption('custom')}
          className={[
            'w-full text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none',
            'hover:shadow-sm',
            dataOption === 'custom'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-blue-200',
          ].join(' ')}
        >
          <div className="flex items-start gap-3">
            <div
              className={[
                'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                dataOption === 'custom' ? 'border-blue-500 bg-blue-500' : 'border-gray-300',
              ].join(' ')}
            >
              {dataOption === 'custom' && (
                <div className="w-full h-full rounded-full bg-white scale-[0.4] block" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800 text-sm">Paste custom JSON</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Supply your own JSON data object to use with the report.
              </div>
            </div>
          </div>
        </button>

        {/* Textarea — shown when custom JSON selected */}
        {dataOption === 'custom' && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-mono text-gray-400">
              data.json
            </div>
            <textarea
              value={customJson}
              onChange={(e) => { onCustomJson(e.target.value); setJsonError(null) }}
              placeholder={'{\n  "key": "value"\n}'}
              rows={8}
              spellCheck={false}
              className={[
                'w-full p-3 text-sm font-mono bg-white resize-none focus:outline-none text-gray-700',
                jsonError ? 'ring-2 ring-red-300' : '',
              ].join(' ')}
            />
            {jsonError && (
              <div className="px-3 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {jsonError}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={[
            'px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-150',
            canProceed
              ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm hover:shadow'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 — Ready ───────────────────────────────────────────────────────────

function StepReady({
  template,
  dataOption,
  customJson,
  onBack,
}: {
  template: Template
  dataOption: DataOption
  customJson: string
  onBack: () => void
}) {
  const router = useRouter()

  const openDesigner = () => {
    if (dataOption === 'custom' && customJson.trim()) {
      try {
        sessionStorage.setItem('wizard-data', customJson)
      } catch {
        // sessionStorage not available
      }
    }
    if (template.id) {
      router.push(`/designer?template=${template.id}`)
    } else {
      // Blank report — wizard data already stored above
      router.push('/designer')
    }
  }

  const openViewer = () => {
    if (dataOption === 'custom' && customJson.trim()) {
      try {
        sessionStorage.setItem('wizard-data', customJson)
      } catch {
        // sessionStorage not available
      }
    }
    if (template.id) {
      router.push(`/viewer?template=${template.id}`)
    } else {
      router.push('/viewer')
    }
  }

  const dataLabel =
    dataOption === 'sample' ? 'Template sample data' : 'Custom JSON data'

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
          <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">You&apos;re all set!</h2>
        <p className="text-sm text-gray-500 mt-1">Review your choices and open the report.</p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-100 mb-8 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-sm text-gray-500 font-medium">Template</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">{template.icon}</span>
            <span className="text-sm font-semibold text-gray-800">{template.name}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-sm text-gray-500 font-medium">Data source</span>
          <span className="text-sm font-semibold text-gray-800">{dataLabel}</span>
        </div>
        {dataOption === 'custom' && customJson.trim() && (
          <div className="px-5 py-3 bg-white">
            <div className="text-xs font-mono text-gray-400 mb-1.5">Preview</div>
            <pre className="text-xs text-gray-600 font-mono bg-gray-50 rounded-lg p-3 max-h-28 overflow-auto border border-gray-100 whitespace-pre-wrap break-all">
              {customJson.trim().slice(0, 300)}
              {customJson.trim().length > 300 && '…'}
            </pre>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={openDesigner}
          className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-blue-500 bg-blue-500 text-white p-4 hover:bg-blue-600 hover:border-blue-600 transition-all duration-150 active:scale-95 shadow-sm hover:shadow focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
          </svg>
          <span className="font-semibold text-sm">Open Designer</span>
          <span className="text-xs text-blue-100">Edit &amp; customize</span>
        </button>

        <button
          onClick={openViewer}
          className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 p-4 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150 active:scale-95 shadow-sm hover:shadow focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-semibold text-sm">Open Viewer</span>
          <span className="text-xs text-gray-400">Preview output</span>
        </button>
      </div>

      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

// ─── Main Wizard Page ─────────────────────────────────────────────────────────

export default function NewReportPage() {
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [dataOption, setDataOption] = useState<DataOption>('sample')
  const [customJson, setCustomJson] = useState('')

  const handleSelectTemplate = (t: Template) => {
    setSelectedTemplate(t)
    // If blank is selected, default to custom JSON input
    if (t.id === null) setDataOption('custom')
    else setDataOption('sample')
  }

  const goToStep2 = () => setStep(2)
  const goToStep3 = () => setStep(3)
  const goBack = () => setStep((s) => s - 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col">
      {/* Top nav bar */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <span className="font-semibold text-sm">NextReport</span>
          </a>
          <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">New Report</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-4">
        <div className="w-full max-w-[640px]">
          {/* Wizard card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <StepIndicator current={step} />

            {step === 1 && (
              <StepChooseTemplate
                selected={selectedTemplate}
                onSelect={handleSelectTemplate}
                onNext={goToStep2}
              />
            )}

            {step === 2 && selectedTemplate && (
              <StepConnectData
                template={selectedTemplate}
                dataOption={dataOption}
                customJson={customJson}
                onDataOption={setDataOption}
                onCustomJson={setCustomJson}
                onBack={goBack}
                onNext={goToStep3}
              />
            )}

            {step === 3 && selectedTemplate && (
              <StepReady
                template={selectedTemplate}
                dataOption={dataOption}
                customJson={customJson}
                onBack={goBack}
              />
            )}
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-gray-400 mt-6">
            You can change the template or data later in the designer.
          </p>
        </div>
      </main>
    </div>
  )
}

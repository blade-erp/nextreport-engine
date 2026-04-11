import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span className="font-semibold text-gray-800">NextReport Engine</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-blue-100">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
          Modern API-first reporting engine
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
          Build beautiful reports,<br />
          <span className="text-blue-500">visually.</span>
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-md leading-relaxed">
          Design, preview, and export pixel-perfect reports with a visual designer and flexible data bindings.
        </p>

        {/* Primary CTA */}
        <Link
          href="/new"
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-semibold px-7 py-3.5 rounded-xl shadow-sm hover:shadow transition-all duration-150 text-base mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create New Report
        </Link>

        <p className="text-xs text-gray-400 mb-16">3-step wizard · no sign-up required</p>

        {/* Quick links */}
        <div className="w-full max-w-2xl">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">Quick links</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="/designer"
              className="group flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 hover:border-blue-300 hover:shadow-sm transition-all duration-150 text-left"
            >
              <span className="text-xl">✏️</span>
              <div>
                <div className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Designer</div>
                <div className="text-xs text-gray-400">Blank canvas</div>
              </div>
            </a>

            <a
              href="/designer?template=invoice-v1"
              className="group flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 hover:border-blue-300 hover:shadow-sm transition-all duration-150 text-left"
            >
              <span className="text-xl">🧾</span>
              <div>
                <div className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Invoice Designer</div>
                <div className="text-xs text-gray-400">invoice-v1 template</div>
              </div>
            </a>

            <a
              href="/viewer?template=invoice-v1"
              className="group flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 hover:border-blue-300 hover:shadow-sm transition-all duration-150 text-left"
            >
              <span className="text-xl">👁️</span>
              <div>
                <div className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Invoice Viewer</div>
                <div className="text-xs text-gray-400">invoice-v1 template</div>
              </div>
            </a>
          </div>
        </div>

        {/* API reference */}
        <div className="w-full max-w-2xl mt-10">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">API Endpoints</p>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden text-left">
            {[
              { method: 'POST', path: '/api/render', desc: 'Render report to HTML or PDF' },
              { method: 'POST', path: '/api/validate', desc: 'Validate report schema' },
              { method: 'POST', path: '/api/preview', desc: 'Preview first page' },
              { method: 'GET',  path: '/api/templates/:id', desc: 'Load template + sample data' },
            ].map(({ method, path, desc }) => (
              <div key={path} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={[
                    'text-xs font-mono font-bold w-12 text-center py-0.5 rounded',
                    method === 'GET'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700',
                  ].join(' ')}
                >
                  {method}
                </span>
                <code className="text-xs font-mono text-gray-600 font-medium">{path}</code>
                <span className="text-xs text-gray-400 ml-auto">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        NextReport Engine · built with Next.js &amp; Tailwind CSS
      </footer>
    </div>
  )
}

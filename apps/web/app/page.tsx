const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '12px 16px',
  background: '#f5f5f5',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
  textDecoration: 'none',
  color: '#111',
  fontSize: 15,
}

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>NextReport Engine</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Modern, API-first reporting engine with visual designer
      </p>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pages</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        <a href="/designer" style={linkStyle}>Report Designer (blank)</a>
        <a href="/designer?template=invoice-v1" style={linkStyle}>Report Designer — Invoice Template</a>
        <a href="/viewer?template=invoice-v1" style={linkStyle}>Report Viewer — Invoice Template</a>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>API Endpoints</h2>
      <ul style={{ lineHeight: 2, color: '#444' }}>
        <li>POST /api/render — Render report to HTML or PDF</li>
        <li>POST /api/validate — Validate report schema</li>
        <li>POST /api/preview — Preview first page</li>
        <li>GET /api/templates/:id — Load template + sample data</li>
      </ul>
    </main>
  )
}

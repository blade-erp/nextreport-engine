export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>NextReport Engine</h1>
      <p>API Endpoints:</p>
      <ul>
        <li>POST /api/render — Render report to HTML or PDF</li>
        <li>POST /api/validate — Validate report schema</li>
        <li>POST /api/preview — Preview first page</li>
      </ul>
    </main>
  )
}

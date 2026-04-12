# NextReportEngine — Product Roadmap

**Last updated:** 2026-04-13
**Current version:** v0.2.1

---

## MVP (v0.1) — Tamamlandı

**Durum:** Tamamlandı | 64 commit | 346 test | 7 package + 1 app

### Teslim Edilenler

- Schema-driven report DSL (Zod + JSON Schema export)
- 4-stage render pipeline (validate → expression → band → layout)
- Expression engine (9 built-in fonksiyon, type coercion)
- HTML renderer (IR → self-contained HTML)
- PDF renderer (Puppeteer-based)
- Canvas abstraction (ports + Konva adapter)
- Visual designer (3-panel layout, property editor, band manager, undo/redo)
- Report viewer (pagination, print, PDF export)
- Next.js API routes (/render, /validate, /preview, /templates/:id)
- Onboarding wizard (3-step: template → data → designer)
- Live preview panel (debounced, iframe-based)
- 2 template (Invoice, Simple List)

### Mimari Temeller (MVP'de çizilen boundary'ler)

Bu kararlar ilerideki tüm phase'leri şekillendiriyor:

| Karar                      | MVP Durumu                             | İleriye Etkisi                                       |
| -------------------------- | -------------------------------------- | ---------------------------------------------------- |
| Engine Isolation Rule      | engine-core Next.js/React/Konva bilmez | Phase 2-3'te standalone engine split'i acısız olacak |
| Konva Adapter Pattern      | Tek import noktası: adapters/konva/    | Canvas kütüphanesi değişikliği tek dizin             |
| Component Registry Pattern | Compile-time registration              | Plugin marketplace'e uzanan yol                      |
| Pluggable Renderers        | HTML + PDF bağımsız                    | Yeni format eklemek core'a dokunmadan                |
| Flat Schema + Zod          | Type-safe DSL                          | JSON Schema export ile multi-language uyum           |
| Expression Function Syntax | AI/LLM-friendly                        | Agent entegrasyonu için hazır zemin                  |

---

## Phase 2 — Engine Maturity (v0.2)

**Hedef:** Engine'i production-ready hale getir.
**Durum:** Tamamlandı | v0.2.0 + v0.2.1 | 428 test

### 2.1 Template CRUD API — Tamamlandı (v0.2.0)

- Filesystem-based storage (metadata envelope format)
- POST/GET/PUT/DELETE endpoints
- Backward compatible with legacy template format
- Designer Save/Load entegrasyonu

### 2.2 Image Component — Tamamlandı (v0.2.0)

- URL-based ve base64 inline image desteği
- Expression-bound src: `{{companyLogo}}`
- objectFit: contain, cover, fill
- HTML renderer ile absolute positioning

### 2.3 Barcode/QR Component — Tamamlandı (v0.2.0)

- QR Code ve Code128 format desteği
- bwip-js ile SVG rendering (DOM-independent, PDF-compatible)
- Expression-bound value: `{{orderId}}`
- Custom foreground/background renkleri

### 2.4 Group Header/Footer Bands — Tamamlandı (v0.2.0)

- `groupBy` field on band schema
- Band-processor grouping logic (\_groupKey, \_groupItems, \_groupIndex)
- Subtotal aggregation: `sum(_groupItems, 'salary')`
- Nested grouping desteği

### 2.5 Page Header/Footer Bands — Tamamlandı (v0.2.0)

- Her sayfada tekrarlayan header/footer
- `{{pageNumber}}` ve `{{totalPages}}` expression'ları
- Layout calculator'da two-pass pagination

### 2.6 Designer UX — Tamamlandı (v0.2.0)

- Drag & drop component placement (toolbox → canvas)
- 8-directional resize handles
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete, Escape)
- Template save/load (CRUD API entegrasyonu)
- Import JSON from file
- Image + Barcode toolbox ve property panel
- All 7 band types in band manager with color coding

### Kalan Phase 2 İşleri (Gelecek)

- [ ] Plugin system & component marketplace
- [ ] Full Konva canvas integration (DOM-based preview yerine)
- [ ] Snap-to-grid / alignment guides
- [ ] Multi-select (Shift+click)
- [ ] Copy/paste component (Ctrl+C/V)
- [ ] Data field drag-to-canvas
- [ ] Nested detail band'lar (master-detail)
- [ ] Conditional band visibility (expression-based show/hide)
- [ ] Auto-height band'lar
- [ ] Native PDF generation (Puppeteer-free)
- [ ] Queue + worker separation (BullMQ)
- [ ] Database-backed template storage (PostgreSQL + Prisma)

---

## Phase 3 — Collaboration & SaaS

**Hedef:** Multi-user, multi-tenant SaaS platform haline getir.

### 3.1 User Authentication & Authorization

**Scope:**

- NextAuth.js entegrasyonu
- Role-based access control (admin, editor, viewer)
- Organization/tenant support
- API key authentication (headless API kullanıcıları için)

### 3.2 Collaboration

**Scope:**

- Template paylaşım (link ile)
- Real-time collaborative editing (CRDT veya OT-based)
- Comment/annotation system
- Change history / audit log
- Template locking (eşzamanlı düzenleme koruması)

### 3.3 Standalone Render Engine

**Neden:** Phase migration readiness — engine Next.js'ten tamamen bağımsız.

**Scope:**

- `apps/render-server` — Fastify/Hono standalone HTTP server
- Aynı engine-core + renderer import'ları, farklı HTTP framework
- Docker image (lightweight, Chrome-less for HTML-only, Chrome-included for PDF)
- Horizontal scaling (stateless, load balancer arkasında)
- Health check / metrics endpoint

**Teknik:** Engine isolation rule sayesinde bu geçiş sadece HTTP adapter katmanını değiştirmek — engine-core, renderer'lar, schema hiç değişmez.

### 3.4 SaaS Mode

**Scope:**

- Subscription/billing entegrasyonu
- Usage metering (render count, PDF size)
- Custom domain support
- White-label branding
- Template marketplace (community template'leri)

---

## Phase 4 — AI & Automation

**Hedef:** AI agent'larla entegrasyon, natural language report generation.

### 4.1 AI Report Generation

**Scope:**

- Natural language → report schema generation
- "Create an invoice report for customers" → LLM generates valid JSON schema
- Schema suggestion engine (veri yapısını analiz edip uygun template öner)
- AI-assisted expression writing ("show price in Turkish Lira" → `{{formatCurrency(price, 'TRY')}}`)

**Teknik:** Function syntax seçimimiz (pipe değil) bu entegrasyonu kolaylaştırıyor — LLM function calling doğrudan expression syntax ile uyumlu.

### 4.2 MCP Server Integration

**Scope:**

- NextReportEngine as MCP server
- Tools: create_report, render_report, validate_schema, list_templates
- AI agent'lar doğrudan rapor oluşturup render edebilir
- Claude/ChatGPT/custom agent uyumluluğu

**Örnek akış:**

```
User: "Müşteri listesinden bir fatura oluştur"
  ↓
AI Agent → MCP tool: create_report(type: "invoice", data: customerData)
  ↓
Engine → render → PDF
  ↓
Agent: "Faturanız hazır, indirmek için tıklayın"
```

### 4.3 Smart Data Binding

**Scope:**

- AI-powered field mapping (veri yapısını otomatik analiz et, field'ları template'e eşle)
- Schema inference from data samples
- Data transformation suggestions
- Auto-generate detail band layout from data structure

### 4.4 Report Intelligence

**Scope:**

- Automatic formatting suggestions (data tipi analizi → uygun format önerisi)
- Layout optimization (component'lerin otomatik düzenlenmesi)
- Accessibility audit (kontrast, font boyutu, yapı kontrolleri)
- Performance optimization hints (büyük dataset'ler için pagination önerileri)

---

## Technical Debt & Continuous Improvements

Bu phase'lere bağlı olmayan, sürekli yapılması gereken iyileştirmeler:

### Testing

- [ ] E2E tests (Playwright — designer UI akışları)
- [ ] Visual regression tests (component screenshot karşılaştırma)
- [ ] Performance benchmarks (render time, memory usage)
- [ ] Load testing (concurrent API requests)

### Developer Experience

- [ ] Monorepo build optimization (incremental builds)
- [ ] Hot module reload iyileştirmeleri
- [ ] Storybook for UI components
- [ ] API documentation (OpenAPI/Swagger)
- [ ] CLI tool (`npx nextreport render template.json data.json --output report.pdf`)

### Engine-Core Discipline

- [ ] Lint rule: engine-core'da yasak import tespiti (CI'da)
- [ ] Internal module boundary enforcement (barrel exports + eslint-plugin-boundaries)
- [ ] Package dependency graph visualization
- [ ] Performance profiling (expression engine, layout calculator)

### Internationalization

- [ ] UI i18n (designer + viewer çoklu dil)
- [ ] RTL layout support
- [ ] Additional locale formatters

---

## Release Cadence

| Version | Phase           | Scope                                                        | Durum      |
| ------- | --------------- | ------------------------------------------------------------ | ---------- |
| v0.1    | MVP             | Schema, engine, renderers, designer, viewer, CI/CD           | Tamamlandı |
| v0.2    | Engine Maturity | Image, Barcode, Group/Page bands, Template CRUD, Designer UX | Tamamlandı |
| v0.3    | —               | Plugin system, native PDF, conditional visibility            | Planlandı  |
| v0.4    | —               | Queue/worker, DB storage, nested details                     | Planlandı  |
| v1.0    | 3.x             | Auth + collaboration + standalone engine                     | Planlandı  |
| v1.5    | 3.4             | SaaS mode                                                    | Planlandı  |
| v2.0    | 4.x             | AI integration + MCP server                                  | Planlandı  |

---

## Contributing

Phase 2'den itibaren topluluk katkısı kabul edilecek:

- **Component plugin'leri** — En düşük bariyerli katkı noktası. ComponentDefinition interface'ini implement et, register et.
- **Expression fonksiyonları** — Yeni built-in fonksiyon ekle (registerFunction ile)
- **Renderer'lar** — Yeni output formatı (Excel, DOCX, CSV)
- **Template'ler** — Community template gallery

---

_Bu roadmap yaşayan bir doküman. Öncelikler kullanıcı feedback'ine göre değişebilir._

# NextReportEngine — Product Roadmap

**Last updated:** 2026-04-12
**Current version:** v0.1 (MVP)

---

## MVP (v0.1) — Tamamlandı

**Durum:** Tamamlandı | 32 commit | 190 test | 7 package + 1 app

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

## Phase 2 — Platform Genişletme

**Hedef:** Engine'i production-ready hale getir, plugin sistemi ekle, performans iyileştir.

### 2.1 Plugin System & Component Marketplace

**Neden:** MVP'de 2 component var (Text, Table). Kullanıcılar ve topluluk yeni component'ler ekleyebilmeli.

**Scope:**

- Component lazy loading (dynamic import)
- Plugin manifest format tanımı
- Plugin discovery ve registration API
- Community component'ler: Image, Barcode (QR/Code128), Chart, Shape, Line/Separator
- Plugin development SDK + documentation

**Teknik:**

```
@nextreport/plugin-sdk        → Plugin geliştirme araçları
@nextreport/component-image   → Image component (URL, base64)
@nextreport/component-barcode → QR, Code128, EAN13
@nextreport/component-chart   → Basic charts (bar, line, pie)
```

**Boundary'ler:** Her plugin kendi package'ı. Engine-core plugin'i bilmez, sadece ComponentRegistry interface'ini bilir. Plugin kendini register eder.

### 2.2 Advanced Layout Engine

**Neden:** MVP'de basit absolute positioning var. Gerçek dünya raporları daha karmaşık layout'lar gerektirir.

**Scope:**

- Group header/footer band'ları (gruplama + subtotal)
- Nested detail band'lar (master-detail raporları)
- Conditional band visibility (expression-based show/hide)
- Relative positioning mode (band-relative vs absolute)
- Auto-height band'lar (content'e göre uzayan)
- Column layout (multi-column detail band'lar)
- Keep-together (element grubunun sayfa arasında bölünmemesi)

**Teknik:** Layout calculator'a yeni stratejiler eklenir. Engine-core internal modül boundary'si korunur.

### 2.3 PDF Optimization

**Neden:** MVP'de Puppeteer ile HTML→PDF yapılıyor. Yavaş, memory-heavy, server'da Chrome gerekli.

**Scope:**

- Dedicated PDF library entegrasyonu (pdfmake veya jsPDF)
- Puppeteer fallback olarak kalır (complex CSS rendering için)
- PDF/A compliance (arşivleme)
- PDF metadata (title, author, keywords)
- Font embedding
- Vector graphics (SVG support)

**Teknik:** `@nextreport/renderer-pdf-native` yeni package. IR'dan doğrudan PDF üretir. Puppeteer-based renderer hala mevcut ama opsiyonel.

### 2.4 Template Versioning & CRUD

**Neden:** MVP'de template'ler filesystem'de static JSON. Production'da CRUD, versioning, ve paylaşım gerekli.

**Scope:**

- Database entegrasyonu (PostgreSQL + Prisma)
- Template CRUD API (create, read, update, delete, list)
- Template versioning (v1, v2, ... + rollback)
- Template categories/tags
- Template thumbnail generation (otomatik preview image)
- Template import/export (JSON dosyası)

**Teknik:** `apps/web` katmanına database eklenir. Engine-core etkilenmez (stateless kalır).

### 2.5 Queue + Worker Separation

**Neden:** Heavy render işleri (büyük PDF'ler) Next.js process'ini bloklar.

**Scope:**

- BullMQ job queue
- Worker process (ayrı Node.js instance)
- Async render API (job ID döner, polling/webhook ile sonuç)
- Rate limiting
- Priority queue (small reports fast, large reports queued)

**Teknik:** API route render isteğini queue'ya koyar, worker engine-core + renderer çağırır. Engine-core değişmez.

### 2.6 Designer UX İyileştirmeleri

**Scope:**

- Full Konva canvas integration (DOM-based preview'den geçiş)
- Drag & drop component placement (toolbox'tan canvas'a sürükleme)
- Resize handles (component boyutlandırma)
- Snap-to-grid / alignment guides
- Keyboard shortcuts (Ctrl+Z undo, Delete remove, etc.)
- Multi-select (Shift+click ile birden fazla component seçme)
- Copy/paste component
- Data field drag-to-canvas (sol panelden sürükle → otomatik {{expression}})

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

| Version | Phase           | Tahmini Scope                            |
| ------- | --------------- | ---------------------------------------- |
| v0.1    | MVP             | Tamamlandı                               |
| v0.2    | 2.1 + 2.2       | Plugin system + advanced layout          |
| v0.3    | 2.3 + 2.4       | PDF optimization + template versioning   |
| v0.4    | 2.5 + 2.6       | Queue/worker + designer UX               |
| v1.0    | 3.1 + 3.2 + 3.3 | Auth + collaboration + standalone engine |
| v1.5    | 3.4             | SaaS mode                                |
| v2.0    | 4.x             | AI integration + MCP server              |

---

## Contributing

Phase 2'den itibaren topluluk katkısı kabul edilecek:

- **Component plugin'leri** — En düşük bariyerli katkı noktası. ComponentDefinition interface'ini implement et, register et.
- **Expression fonksiyonları** — Yeni built-in fonksiyon ekle (registerFunction ile)
- **Renderer'lar** — Yeni output formatı (Excel, DOCX, CSV)
- **Template'ler** — Community template gallery

---

_Bu roadmap yaşayan bir doküman. Öncelikler kullanıcı feedback'ine göre değişebilir._

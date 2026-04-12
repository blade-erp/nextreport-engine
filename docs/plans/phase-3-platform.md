# Phase 3: NextReport Platform — Plan

**Goal:** Open-source engine üzerine inşa edilen multi-tenant SaaS reporting platform. Müşteriler sıfır kurulum ile raporlama altyapısı kullanır.

**Business Model:** Engine free + open-source kalır. Platform gelir modeli: hosted infrastructure + premium features.

---

## Vision

```
Engine (OSS)                          Platform (SaaS)
─────────────                         ─────────────────
npm install @nextreport/engine        nextreport.io
docker run ghcr.io/nextreport/engine  Sign up → API key → integrate
Self-hosted, free forever             Managed, subscription-based
```

Developer deneyimi:

```
1. nextreport.io → Sign up
2. Dashboard → Create Organization → Get API key
3. Dashboard → Design template (visual designer)
4. Any language:
   POST https://api.nextreport.io/v1/render
   Authorization: Bearer nrk_xxx
   { "templateId": "tmpl_abc123", "data": {...} }
   → PDF/HTML response
```

Sıfır kurulum. Sıfır Docker. Sıfır Chromium. Sıfır deployment.

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────┐
│                    nextreport.io                      │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Dashboard   │  │  API Gateway  │  │  Template    │ │
│  │  (Next.js)   │  │  (Auth, Rate  │  │  Marketplace │ │
│  │              │  │   Limiting)   │  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                  │         │
│  ┌──────▼─────────────────▼──────────────────▼───────┐ │
│  │              Core Services                         │ │
│  │                                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │ Template  │  │ Render   │  │ Organization &   │ │ │
│  │  │ Service   │  │ Service  │  │ Billing Service  │ │ │
│  │  │ (CRUD,    │  │ (Queue + │  │ (Stripe, Plans,  │ │ │
│  │  │ Version,  │  │ Workers) │  │ Usage Metering)  │ │ │
│  │  │ Share)    │  │          │  │                  │ │ │
│  │  └────┬──────┘  └────┬────┘  └────────┬─────────┘ │ │
│  │       │              │                │           │ │
│  │  ┌────▼──────────────▼────────────────▼─────────┐ │ │
│  │  │  @nextreport/engine (OSS core — same code)   │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
│                                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Infrastructure                                    │ │
│  │  PostgreSQL │ Redis │ S3 │ Chromium Pool │ CDN     │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Core Features

### 3.1 Multi-Tenant Architecture

- Organization (tenant) isolation
- Team members with roles: Owner, Admin, Editor, Viewer
- API key per organization (multiple keys supported)
- Data isolation — templates, renders, usage all scoped to org
- Subdomain or path-based routing: `acme.nextreport.io` or `nextreport.io/org/acme`

### 3.2 Authentication & Authorization

- Email + password registration
- OAuth: GitHub, Google
- Role-based access control (RBAC)
- API key authentication for headless usage
- Session management
- Audit log (who did what, when)

### 3.3 Template Management (Cloud)

- Web-based visual designer (same OSS designer, hosted)
- Template CRUD with versioning (v1, v2, ... + rollback)
- Template categories and tags
- Auto-generated thumbnail previews
- Import/export (JSON file)
- Template sharing (link-based, with permission)
- Template duplication

### 3.4 Template Marketplace

- **Public templates** — community-contributed, free
- **Private templates** — organization-only
- **Premium templates** — paid, revenue share with creator
- Search, filter, preview before use
- Rating and review system
- Fork/customize any public template

### 3.5 Render Service (Managed)

- REST API: `POST /v1/render` with API key auth
- Async rendering for large reports (webhook callback)
- Warm Chromium pool (fast PDF cold start)
- CDN-cached rendered outputs (optional)
- Render history and re-render capability
- Usage metering: render count, PDF size, response time

### 3.6 Observability & Monitoring

- Per-organization dashboard: render count, error rate, latency
- Per-template analytics: usage frequency, avg render time
- Error tracking with stack traces
- Real-time render status
- Usage alerts (approaching plan limits)
- Health status page

### 3.7 Billing & Plans

- Stripe integration
- Free tier: 100 renders/month, 3 templates, 1 team member
- Pro tier: 10K renders/month, unlimited templates, 10 members
- Enterprise: unlimited renders, SSO, dedicated support, SLA
- Usage-based overage billing
- Annual discount

---

## Tech Stack (Platform-specific)

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | Next.js (same stack as engine)              |
| Auth       | NextAuth.js or Clerk                        |
| Database   | PostgreSQL + Prisma                         |
| Queue      | BullMQ + Redis                              |
| Storage    | S3-compatible (templates, rendered outputs) |
| Billing    | Stripe                                      |
| Monitoring | PostHog or custom                           |
| Infra      | Docker, Kubernetes or Railway/Fly.io        |
| CDN        | CloudFlare                                  |
| Engine     | @nextreport/engine (OSS — npm package)      |

---

## Repo Structure

```
nextreport/engine       → OSS engine (mevcut repo)
nextreport/platform     → SaaS platform (yeni repo)
  ├── apps/
  │   ├── web/          → Dashboard (Next.js)
  │   └── api/          → API Gateway (Fastify or Next.js)
  ├── packages/
  │   ├── auth/         → Authentication service
  │   ├── billing/      → Stripe integration
  │   ├── templates/    → Template CRUD + versioning
  │   ├── render/       → Render service (queue + workers)
  │   └── marketplace/  → Template marketplace
  ├── prisma/           → Database schema
  └── docker/           → Production Docker configs
```

---

## Pricing Model

|                      | Free      | Pro              | Enterprise                 |
| -------------------- | --------- | ---------------- | -------------------------- |
| Renders/month        | 100       | 10,000           | Unlimited                  |
| Templates            | 3         | Unlimited        | Unlimited                  |
| Team members         | 1         | 10               | Unlimited                  |
| PDF export           | Yes       | Yes              | Yes                        |
| Visual designer      | Yes       | Yes              | Yes                        |
| Template marketplace | Browse    | Browse + Publish | Browse + Publish + Premium |
| API access           | Yes       | Yes              | Yes + Webhooks             |
| Custom branding      | No        | Yes              | Yes                        |
| SSO/SAML             | No        | No               | Yes                        |
| SLA                  | No        | No               | 99.9%                      |
| Support              | Community | Email            | Dedicated                  |
| Price                | $0        | $29/mo           | Custom                     |

---

## Migration Path (Engine → Platform)

Mevcut engine kullanıcıları platform'a nasıl geçer:

```
1. Self-hosted engine kullanıcısı:
   - Export templates as JSON
   - Import to platform dashboard
   - Replace docker URL → api.nextreport.io
   - Add API key header
   - Done — same render output, zero infra

2. npm package kullanıcısı:
   - Keep using @nextreport/engine locally for dev
   - Use platform API for production renders
   - Hybrid: local preview, cloud PDF generation
```

---

## Implementation Phases

### Phase 3.1 — Foundation (MVP Platform)

- User registration + login
- Organization creation
- API key generation
- Template CRUD (cloud-hosted)
- Basic render API (wrap engine)
- Simple dashboard

### Phase 3.2 — Production Ready

- Billing integration (Stripe)
- Queue-based rendering
- Usage metering
- Template versioning
- Audit log

### Phase 3.3 — Growth

- Template marketplace
- Team management (roles)
- Observability dashboard
- Webhooks
- Custom branding

### Phase 3.4 — Enterprise

- SSO/SAML
- Dedicated infrastructure
- SLA guarantees
- White-label
- On-premise option

---

## Key Decision: Separate Repo

Platform is a SEPARATE repository (`nextreport/platform`), not part of the engine repo. Reasons:

1. **License separation** — Engine: MIT. Platform: proprietary (or BSL).
2. **Contributor clarity** — OSS contributors work on engine, not platform internals.
3. **Deployment independence** — Engine releases don't affect platform, and vice versa.
4. **Tech stack differences** — Platform needs DB, auth, billing — engine doesn't.

Platform DEPENDS ON engine as an npm package:

```json
{ "dependencies": { "@nextreport/engine": "^0.1.5" } }
```

Engine never depends on platform. One-way dependency.

---

_This document is a strategic plan, not a committed roadmap. Timeline and scope may change based on engine maturity and community feedback._

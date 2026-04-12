# Phase 2: Engine Maturity — Plan

**Goal:** Olgunlaştır — engine'i gerçek production kullanımı için hazır hale getir. Platform (Phase 3) bu temelin üzerine inşa edilecek.

**Principle:** Platform müşteriye sunduğun engine kadar güçlü. Engine zayıfsa platform da zayıf.

---

## 2.1 Template CRUD API

**Neden:** En büyük friction noktası. Backend developer yeni template ekleyemiyor, designer'dan export edip manuel kopyalaması gerekiyor.

**Scope:**
- `POST /api/templates` — yeni template kaydet
- `GET /api/templates` — template listele
- `PUT /api/templates/:id` — güncelle
- `DELETE /api/templates/:id` — sil
- Filesystem-based storage (MVP — DB gerekmez)
- Template metadata: name, description, version, createdAt, updatedAt
- Designer'dan "Save" butonu → API'a kaydet

## 2.2 Image Component

**Neden:** Faturada logo olmadan production kullanım zor.

**Scope:**
- URL-based image (`https://...`)
- Base64 inline image
- Position + size (absolute, like text)
- Canvas renderer (designer'da preview)
- HTML renderer
- Schema: `{ type: "image", position: {...}, src: "url-or-base64", alt: "description" }`

## 2.3 Barcode / QR Code Component

**Neden:** Invoice, shipping label, inventory — QR/barcode olmadan eksik.

**Scope:**
- QR Code generation
- Code128 barcode
- Expression-bound value: `{{ orderId }}` → QR code
- Schema: `{ type: "barcode", position: {...}, format: "qr" | "code128", value: "{{expression}}" }`

## 2.4 Group Header/Footer Bands

**Neden:** "Departman bazlı çalışan listesi + departman subtotal" gibi raporlar yapılamıyor.

**Scope:**
- `group-header` band — gruplama başlığı
- `group-footer` band — grup sonu (subtotal, count)
- `groupBy` field on detail band
- Nested grouping (department → team → employee)
- Engine-core band-processor'a grouping logic eklenmesi

## 2.5 Page Header/Footer Bands

**Neden:** Her sayfada tekrarlayan header (şirket adı) ve footer (sayfa numarası) gerekli.

**Scope:**
- `page-header` band — her sayfa başında
- `page-footer` band — her sayfa sonunda
- `{{pageNumber}}` ve `{{totalPages}}` expression'ları
- Layout calculator'da page-level band insertion

## 2.6 Designer UX Improvements

**Scope:**
- Drag & drop component placement (toolbox → canvas)
- Resize handles (component boyutlandırma)
- Keyboard shortcuts (Ctrl+Z, Delete, Ctrl+C/V)
- Template save/load (CRUD API entegrasyonu)
- Image + Barcode components in toolbox

---

## Implementation Order

```
1. Template CRUD API          → Backend developer friction kaldırılır
2. Image component            → Logo desteği
3. Barcode/QR component       → Invoice tamamlanır
4. Group header/footer        → Gerçek reporting capability
5. Page header/footer         → Professional raporlar
6. Designer UX                → Community adoption
```

## Success Criteria

- Backend developer: template oluştur → API ile render → PDF al (sıfır friction)
- Invoice template: logo + QR kod + line items + toplam
- Departman raporu: gruplama + subtotal + sayfa numarası
- Designer: save/load template, drag & drop, resize

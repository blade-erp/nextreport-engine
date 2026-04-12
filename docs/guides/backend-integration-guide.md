# NextReport Engine — Java/Spring Boot Integration Guide

**Audience:** Backend developers integrating NextReport as a reporting service from a Java application.

---

## Overview

You have a Java/Spring Boot application and need to:

- Generate PDF invoices from your business data
- Validate report templates
- Serve HTML reports to your frontend

NextReport runs as a **separate service** that your Java app calls via REST API. You never need to touch JavaScript — just send JSON, get HTML or PDF back.

```
┌──────────────────┐    REST API     ┌──────────────────┐
│   Your Java App  │ ──────────────▶ │  NextReport      │
│   (Spring Boot)  │ ◀────────────── │  Engine          │
│                  │   HTML / PDF    │  (Docker)        │
└──────────────────┘                 └──────────────────┘
```

---

## Step 1: Run NextReport Engine

### Option A: Docker (recommended)

```bash
docker run -d --name nextreport -p 3000:3000 ghcr.io/nextreport/engine:latest
```

Verify it's running:

```bash
curl http://localhost:3000
```

### Option B: Docker Compose

Create `docker-compose.yml` in your project:

```yaml
services:
  nextreport:
    image: ghcr.io/nextreport/engine:latest
    ports:
      - '3000:3000'
    restart: unless-stopped
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 5s
      retries: 3
```

```bash
docker compose up -d
```

### Option C: From source

```bash
git clone https://github.com/nextreport/engine.git
cd engine
pnpm install
pnpm run dev
```

---

## Step 2: Understand the API

NextReport exposes these endpoints:

| Method   | Endpoint             | Purpose                              |
| -------- | -------------------- | ------------------------------------ |
| `POST`   | `/api/render`        | Render a report to HTML or PDF       |
| `POST`   | `/api/validate`      | Validate a report schema             |
| `POST`   | `/api/preview`       | Lightweight render (first page only) |
| `GET`    | `/api/templates`     | List all templates                   |
| `POST`   | `/api/templates`     | Create a new template                |
| `GET`    | `/api/templates/:id` | Load a template + sample data        |
| `PUT`    | `/api/templates/:id` | Update a template                    |
| `DELETE` | `/api/templates/:id` | Delete a template                    |

### The key concept

There are two ways to render:

**Mode 1 — Use a saved template (most common):**
You just send your data. The template was designed by someone in the visual designer and saved as a JSON file.

```json
POST /api/render
{
  "templateId": "invoice-v1",
  "data": { "companyName": "Acme", "items": [...] },
  "format": "pdf"
}
```

**Mode 2 — Send the full template inline:**
You construct the report schema programmatically.

```json
POST /api/render
{
  "template": { "type": "report", "bands": [...] },
  "data": { "companyName": "Acme", "items": [...] },
  "format": "html"
}
```

**Mode 1 is the typical Java integration.** A business user designs the template in the visual designer, saves it. Your Java code only sends data.

---

## Step 3: Java Integration Code

### Dependencies (Maven)

```xml
<!-- No special dependency needed — just an HTTP client -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### Report Service

```java
package com.yourapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Service
public class ReportService {

    @Value("${nextreport.url:http://localhost:3000}")
    private String nextReportUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Render a report to HTML using a saved template.
     *
     * @param templateId Template name (e.g., "invoice-v1")
     * @param data       Business data as a Map
     * @return HTML string
     */
    public String renderHtml(String templateId, Map<String, Object> data) {
        String url = nextReportUrl + "/api/render";

        Map<String, Object> body = new HashMap<>();
        body.put("templateId", templateId);
        body.put("data", data);
        body.put("format", "html");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        return (String) response.getBody().get("output");
    }

    /**
     * Render a report to PDF using a saved template.
     *
     * @param templateId Template name
     * @param data       Business data
     * @return PDF as byte array
     */
    public byte[] renderPdf(String templateId, Map<String, Object> data) {
        String url = nextReportUrl + "/api/render";

        Map<String, Object> body = new HashMap<>();
        body.put("templateId", templateId);
        body.put("data", data);
        body.put("format", "pdf");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<byte[]> response = restTemplate.postForEntity(url, request, byte[].class);

        return response.getBody();
    }

    /**
     * Validate a report schema.
     *
     * @param template Report schema as a Map
     * @return Validation result
     */
    public Map<String, Object> validate(Map<String, Object> template) {
        String url = nextReportUrl + "/api/validate";

        Map<String, Object> body = new HashMap<>();
        body.put("template", template);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        return response.getBody();
    }
}
```

### REST Controller — Invoice PDF Endpoint

```java
package com.yourapp.controller;

import com.yourapp.service.ReportService;
import com.yourapp.service.InvoiceService;
import com.yourapp.model.Invoice;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final ReportService reportService;
    private final InvoiceService invoiceService;

    public InvoiceController(ReportService reportService, InvoiceService invoiceService) {
        this.reportService = reportService;
        this.invoiceService = invoiceService;
    }

    /**
     * GET /api/invoices/{id}/pdf
     * Generates a PDF invoice and returns it for download.
     */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long id) {
        Invoice invoice = invoiceService.findById(id);

        // Build the data map that matches the template's expected fields
        Map<String, Object> data = new HashMap<>();
        data.put("companyName", invoice.getCompanyName());
        data.put("invoiceNumber", invoice.getInvoiceNumber());
        data.put("invoiceDate", invoice.getDate().toString()); // ISO format: "2026-04-12"

        List<Map<String, Object>> items = new ArrayList<>();
        for (var lineItem : invoice.getLineItems()) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", lineItem.getProductName());
            item.put("quantity", lineItem.getQuantity());
            item.put("unitPrice", lineItem.getUnitPrice());
            item.put("total", lineItem.getTotal());
            items.add(item);
        }
        data.put("items", items);

        // Call NextReport Engine
        byte[] pdf = reportService.renderPdf("invoice-v1", data);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("invoice-" + invoice.getInvoiceNumber() + ".pdf")
                .build());

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    /**
     * GET /api/invoices/{id}/preview
     * Returns HTML preview of the invoice.
     */
    @GetMapping("/{id}/preview")
    public ResponseEntity<String> previewInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceService.findById(id);
        Map<String, Object> data = buildInvoiceData(invoice);

        String html = reportService.renderHtml("invoice-v1", data);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    private Map<String, Object> buildInvoiceData(Invoice invoice) {
        // Same mapping as above — extract to a shared method
        Map<String, Object> data = new HashMap<>();
        data.put("companyName", invoice.getCompanyName());
        data.put("invoiceNumber", invoice.getInvoiceNumber());
        data.put("invoiceDate", invoice.getDate().toString());

        List<Map<String, Object>> items = new ArrayList<>();
        for (var lineItem : invoice.getLineItems()) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", lineItem.getProductName());
            item.put("quantity", lineItem.getQuantity());
            item.put("unitPrice", lineItem.getUnitPrice());
            item.put("total", lineItem.getTotal());
            items.add(item);
        }
        data.put("items", items);
        return data;
    }
}
```

### Application Configuration

```yaml
# application.yml
nextreport:
  url: http://localhost:3000

# Or for Docker Compose networking:
# nextreport:
#   url: http://nextreport:3000
```

---

## Step 4: Data Mapping

The most important thing: **your Java data must match the template's expected field names.**

### How to know what fields the template expects

Look at the template JSON. The expressions tell you what data fields are needed:

```
{{companyName}}              → data needs "companyName" (String)
{{invoiceNumber}}            → data needs "invoiceNumber" (String)
{{invoiceDate}}              → data needs "invoiceDate" (String, ISO format)
{{item.name}}                → items[] needs "name" (String)
{{item.quantity}}            → items[] needs "quantity" (Number)
{{formatCurrency(item.unitPrice, 'TRY')}} → items[] needs "unitPrice" (Number)
```

### Type coercion

NextReport automatically handles type mismatches:

```java
// All of these work — the engine coerces automatically
data.put("price", 45000);        // Number → works
data.put("price", "45000");      // String → coerced to Number
data.put("price", 45000.0);     // Double → works
data.put("date", "2026-04-12"); // ISO string → parsed as Date
```

You don't need to worry about exact types. The engine's expression functions handle coercion internally.

### Null handling

```java
data.put("companyName", null);  // Renders as empty string
// Missing field: also renders as empty string
```

---

## Step 5: Docker Compose with Your Java App

```yaml
services:
  # Your Java application
  app:
    build: .
    ports:
      - '8080:8080'
    environment:
      - NEXTREPORT_URL=http://nextreport:3000
    depends_on:
      nextreport:
        condition: service_healthy

  # NextReport Engine
  nextreport:
    image: ghcr.io/nextreport/engine:latest
    ports:
      - '3000:3000'
    restart: unless-stopped
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 5s
      retries: 3
```

```bash
docker compose up -d
```

Your Java app connects to NextReport at `http://nextreport:3000` (Docker internal DNS).

---

## Full Example: Invoice Generation Flow

```
1. Business user designs invoice template in NextReport Designer
   → Template saved as "invoice-v1.json"

2. Customer places an order in your Java app
   → Invoice record created in your database

3. User clicks "Download Invoice PDF"
   → Java controller calls:
      GET /api/invoices/123/pdf

4. Your Java code:
   a. Loads invoice from database
   b. Maps to flat JSON: { companyName, invoiceNumber, items[] }
   c. Calls NextReport: POST /api/render { templateId: "invoice-v1", data, format: "pdf" }
   d. Returns PDF bytes to browser

5. User downloads invoice.pdf
```

---

## API Reference (Java Perspective)

### POST /api/render

**Request:**

```json
{
  "templateId": "invoice-v1",
  "data": {
    "companyName": "Acme Corp",
    "invoiceNumber": "INV-2026-001",
    "invoiceDate": "2026-04-12",
    "items": [
      { "name": "Laptop", "quantity": 2, "unitPrice": 45000, "total": 90000 },
      { "name": "Mouse", "quantity": 5, "unitPrice": 750, "total": 3750 }
    ]
  },
  "format": "pdf"
}
```

**Response (format: "html"):**

```json
{
  "success": true,
  "output": "<!DOCTYPE html><html>...</html>",
  "metadata": {
    "totalPages": 1,
    "generatedAt": "2026-04-12T10:30:00.000Z",
    "locale": "tr-TR"
  }
}
```

**Response (format: "pdf"):**
Binary PDF stream, Content-Type: `application/pdf`

### POST /api/validate

**Request:**

```json
{
  "template": {
    "type": "report",
    "dataSource": { "type": "json" },
    "bands": []
  }
}
```

**Response:**

```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

### GET /api/templates

List all templates (both new and legacy format).

**Response:**

```json
{
  "templates": [
    {
      "id": "invoice-v1",
      "name": "invoice-v1",
      "description": "",
      "version": "1.0",
      "createdAt": "",
      "updatedAt": ""
    },
    {
      "id": "a73c9a8c-...",
      "name": "My Custom Invoice",
      "description": "With logo and QR",
      "version": "1.0",
      "createdAt": "2026-04-12T...",
      "updatedAt": "2026-04-12T..."
    }
  ]
}
```

### POST /api/templates

Create a new template programmatically.

**Request:**

```json
{
  "name": "Invoice with QR",
  "description": "Invoice template with company logo and QR code",
  "template": { "type": "report", "bands": [...] },
  "sampleData": { "companyName": "Acme", "items": [...] }
}
```

**Response (201):**

```json
{
  "meta": { "id": "uuid", "name": "Invoice with QR", "version": "1.0", "createdAt": "...", "updatedAt": "..." },
  "template": { ... },
  "sampleData": { ... }
}
```

### GET /api/templates/:id

**Response:**

```json
{
  "template": { "type": "report", "bands": [...] },
  "sampleData": { "companyName": "Acme", "items": [...] }
}
```

### PUT /api/templates/:id

Update an existing template (all fields optional).

### DELETE /api/templates/:id

Delete a template. Returns `{ "success": true }`.

---

## Image and Barcode Components

Templates can include image and barcode components. As a Java developer, you don't need to generate these — just provide the data:

```json
{
  "type": "image",
  "position": { "x": 400, "y": 10, "width": 100, "height": 80 },
  "src": "{{companyLogo}}",
  "alt": "Company Logo",
  "objectFit": "contain"
}
```

Your data provides the URL:

```java
data.put("companyLogo", "https://yourcdn.com/logo.png");
// Or base64: data.put("companyLogo", "data:image/png;base64,iVBOR...");
```

Barcode/QR codes are generated server-side as SVG:

```json
{
  "type": "barcode",
  "position": { "x": 0, "y": 5, "width": 100, "height": 100 },
  "value": "{{invoiceNumber}}",
  "format": "qr",
  "color": "#000000"
}
```

Your data just provides the value:

```java
data.put("invoiceNumber", "INV-2026-001"); // Engine generates QR code SVG from this
```

Supported formats: `qr` (QR Code) and `code128` (Code128 barcode).

---

## Group and Page Bands

Templates can use group bands for grouped reports (e.g., employees by department with subtotals) and page bands for repeating headers/footers.

As a Java developer, you don't need to handle grouping — the engine does it. Just provide flat arrays:

```java
// The engine groups by "department" automatically when the template has groupBy: "department"
List<Map<String, Object>> employees = List.of(
    Map.of("name", "Alice", "department", "Engineering", "salary", 80000),
    Map.of("name", "Bob", "department", "Engineering", "salary", 90000),
    Map.of("name", "Carol", "department", "Marketing", "salary", 70000)
);
data.put("employees", employees);
```

Page bands with `{{pageNumber}}` and `{{totalPages}}` are resolved automatically by the layout engine.

---

## Expression Functions Reference

These are the formatting functions available in templates. As a Java developer, you don't call these directly — they're used inside template expressions. But knowing them helps you understand what data to provide:

| Expression in Template                      | What Your Data Needs          | Example Output |
| ------------------------------------------- | ----------------------------- | -------------- |
| `{{companyName}}`                           | `"companyName": "Acme"`       | Acme           |
| `{{formatCurrency(item.price, 'TRY')}}`     | `"price": 45000` (number)     | ₺45.000,00     |
| `{{formatCurrency(item.price, 'USD')}}`     | `"price": 1200`               | $1,200.00      |
| `{{formatDate(invoiceDate, 'DD.MM.YYYY')}}` | `"invoiceDate": "2026-04-12"` | 12.04.2026     |
| `{{sum(items, 'total')}}`                   | items[] with "total" field    | 93750          |
| `{{count(items)}}`                          | items[] array                 | 2              |
| `{{if(total > 10000, 'VIP', 'Standard')}}`  | `"total": 93750`              | VIP            |

---

## Troubleshooting

### "Connection refused" to localhost:3000

NextReport isn't running. Start it:

```bash
docker run -d -p 3000:3000 ghcr.io/nextreport/engine:latest
```

### Template not found

Check available templates:

```bash
curl http://localhost:3000/api/templates/invoice-v1
```

### PDF generation slow (first request)

First PDF request starts Chromium — takes 2-3 seconds. Subsequent requests are faster. For production, consider a warm-up request on startup:

```java
@PostConstruct
public void warmUp() {
    reportService.renderPdf("invoice-v1", Map.of(
        "companyName", "Warm Up",
        "items", List.of()
    ));
}
```

### Numbers showing as strings in report

The engine auto-coerces, but if you want explicit control, ensure numeric fields are sent as numbers (not strings) in your JSON:

```java
item.put("price", 45000);      // Good: number
item.put("price", "45000");    // Also works: auto-coerced
```

---

## Next Steps

- Browse the [full README](https://github.com/nextreport/engine) for more details
- Open http://localhost:3000/new to design templates in the visual designer
- Check [ROADMAP.md](../ROADMAP.md) for upcoming features (database connectors, Java SDK)

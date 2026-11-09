export interface PdfRenderOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal'
  landscape?: boolean
}

export async function renderToPdf(html: string, options?: PdfRenderOptions): Promise<Uint8Array> {
  // Lazy import: puppeteer is an optional dependency, so merely importing the
  // engine (e.g. for HTML rendering) must not require it to be installed.
  const { default: puppeteer } = await import('puppeteer')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html)
    await page.waitForNetworkIdle()
    const pdf = await page.pdf({
      format: options?.format ?? 'A4',
      landscape: options?.landscape ?? false,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return new Uint8Array(pdf)
  } finally {
    await browser.close()
  }
}

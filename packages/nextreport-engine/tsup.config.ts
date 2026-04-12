import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['zod', 'puppeteer', 'zod-to-json-schema'],
  noExternal: [
    '@nextreport/schema',
    '@nextreport/engine-core',
    '@nextreport/renderer-html',
    '@nextreport/renderer-pdf',
  ],
})

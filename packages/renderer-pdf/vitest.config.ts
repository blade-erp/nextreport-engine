import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@nextreport/schema': resolve(__dirname, '../schema/src/index.ts'),
      '@nextreport/engine-core': resolve(__dirname, '../engine-core/src/index.ts'),
      '@nextreport/renderer-html': resolve(__dirname, '../renderer-html/src/index.ts'),
    },
  },
  test: {
    globals: true,
  },
})

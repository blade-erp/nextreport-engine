import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@nextreport/schema': resolve(__dirname, '../schema/src/index.ts'),
      '@nextreport/engine-core': resolve(__dirname, '../engine-core/src/index.ts'),
      '@nextreport/canvas': resolve(__dirname, '../canvas/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@nextreport/schema': resolve(__dirname, '../schema/src/index.ts'),
    },
  },
  test: {
    globals: true,
  },
})

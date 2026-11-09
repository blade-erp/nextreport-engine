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
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**'],
    },
  },
})

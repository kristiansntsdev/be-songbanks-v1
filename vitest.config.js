import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testMatch: ['test/**/*.test.js'],
    setupFiles: ['./test/setup.js']
  },
  esbuild: {
    target: 'node14'
  }
})
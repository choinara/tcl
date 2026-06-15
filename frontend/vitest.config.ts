import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const peakmateCoreSrc = path.resolve(__dirname, '../peakmate-core/src')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/components/grid', replacement: path.join(peakmateCoreSrc, 'components/grid') },
      { find: '@/components/ui', replacement: path.join(peakmateCoreSrc, 'components/ui') },
      { find: '@/components/auth', replacement: path.join(peakmateCoreSrc, 'components/auth') },
      { find: '@/components/layout', replacement: path.join(peakmateCoreSrc, 'components/layout') },
      { find: '@/components/notification', replacement: path.join(peakmateCoreSrc, 'components/notification') },
      { find: '@/components/error', replacement: path.join(peakmateCoreSrc, 'components/error') },
      { find: '@/hooks', replacement: path.join(peakmateCoreSrc, 'hooks') },
      { find: '@/stores', replacement: path.join(peakmateCoreSrc, 'stores') },
      { find: '@/lib', replacement: path.join(peakmateCoreSrc, 'lib') },
      { find: '@/styles', replacement: path.join(peakmateCoreSrc, 'styles') },
      { find: '@/i18n', replacement: path.join(peakmateCoreSrc, 'i18n') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
    dedupe: [
      'react', 'react-dom',
      '@tanstack/react-query',
      'zustand',
      'i18next', 'react-i18next', 'i18next-browser-languagedetector',
      'react-signature-canvas',
      'react-router-dom',
      'ag-grid-community', 'ag-grid-react',
      'exceljs', 'file-saver', 'lucide-react',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
      ],
    },
  },
})

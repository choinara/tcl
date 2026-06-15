import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// peakmate-core: shared components, hooks, stores, lib, locales, styles, i18n
const peakmateCoreSrc = path.resolve(__dirname, '../peakmate-core/src')

// e-approval: peakmate-Util 미사용 — stub으로 대체
const eApprovalStub = path.resolve(__dirname, 'src/stubs/e-approval.ts')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      react(),
      {
        name: 'env-logger',
        configureServer(server) {
          server.httpServer?.once('listening', () => {
            console.log('\n========================================')
            console.log('Vite dev server started')
            console.log('========================================')
            console.log(`Mode: ${mode}`)
            console.log(`Time: ${new Date().toLocaleString('ko-KR')}`)
            console.log(`Node: ${process.version}`)
            console.log('\nEnv:')
            Object.keys(env).forEach(key => {
              console.log(`   ${key}: ${env[key]}`)
            })
            console.log('========================================\n')
          })
        }
      }
    ],
    resolve: {
      // Array format guarantees alias evaluation order.
      // Specific peakmate-core paths MUST come before the generic '@' fallback.
      alias: [
        { find: '@peakmate/e-approval', replacement: eApprovalStub },
        // echarts 패키지는 peakmate-core 바깥에서도 반드시 frontend/node_modules에서 해석되도록 명시
        { find: 'echarts-for-react', replacement: path.resolve(__dirname, 'node_modules/echarts-for-react') },
        { find: 'echarts', replacement: path.resolve(__dirname, 'node_modules/echarts') },
        { find: '@/components/charts', replacement: path.join(peakmateCoreSrc, 'components/charts') },
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
        // Generic fallback - app-specific code (features, layout, etc.)
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ],
      // Force all npm packages to resolve from the app's node_modules
      dedupe: [
        'react', 'react-dom',
        '@tanstack/react-query',
        'zustand',
        'i18next', 'react-i18next', 'i18next-browser-languagedetector',
        'react-signature-canvas',
        'react-router-dom',
        'ag-grid-community', 'ag-grid-react',
        'exceljs', 'file-saver', 'lucide-react',
        'react-datepicker', 'date-fns',
        'echarts', 'echarts-for-react',
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'echarts-vendor': ['echarts', 'echarts-for-react'],
          },
        },
      },
    },
    server: {
      port: 6182,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:9096',
          changeOrigin: true,
        },
      },
      ...(env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS && {
        allowedHosts: env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS.split(',').map((host: string) => host.trim())
      }),
    },
  }
})

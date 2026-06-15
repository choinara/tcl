import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { applySavedCssVars } from '@/lib/cssVars'
import App from './App'

// 저장된 CSS 커스텀 변수 적용
applySavedCssVars()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

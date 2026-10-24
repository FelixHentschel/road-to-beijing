import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import App from './App.tsx'

// Im Shop eingebettet: immer hell, passend zum Shop-Theme
try { if (window.self !== window.top) document.documentElement.setAttribute('data-theme', 'light') } catch { /* fremder Rahmen */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

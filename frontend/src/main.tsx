import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PopupEstatisticasProvider } from './contexts/PopupEstatisticasContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupEstatisticasProvider>
      <App />
    </PopupEstatisticasProvider>
  </StrictMode>,
)
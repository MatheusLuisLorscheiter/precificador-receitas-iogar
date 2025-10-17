import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoutes from './routes'
import { PopupEstatisticasProvider } from './contexts/PopupEstatisticasContext'
import { AuthProvider } from './contexts/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PopupEstatisticasProvider>
        <AppRoutes />
      </PopupEstatisticasProvider>
    </AuthProvider>
  </StrictMode>,
)
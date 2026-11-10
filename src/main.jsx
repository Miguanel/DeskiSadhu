import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ConfiguratorApp from './ConfiguratorApp.jsx'
import { applyTheme } from './config/theme'
import './index.css'

applyTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfiguratorApp />
  </StrictMode>,
)

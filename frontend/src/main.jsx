import { AuthProvider } from './context/AuthContext.jsx'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
)

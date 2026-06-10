import { useState, useEffect, useCallback } from 'react'
import Home from './pages/Home.jsx'
import MovimentacaoDrift from './pages/MovimentacaoDrift.jsx'
import Historico from './pages/Historico.jsx'
import Cadastros from './pages/Cadastros.jsx'
import BrandBar from './components/BrandBar.jsx'

export default function App() {
  const [page, setPage] = useState('home')
  const [toast, setToast] = useState(null)

  const goHome = useCallback(() => setPage('home'), [])

  const showToast = useCallback((message, type = 'ok') => {
    setToast({ message, type })
  }, [])

  // Esconde o toast automaticamente
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Tecla ESC retorna à página inicial
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && page !== 'home') {
        // não fecha se um seletor/menu nativo estiver aberto; comportamento padrão é suficiente
        setPage('home')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page])

  return (
    <div className="app">
      <BrandBar />

      {page === 'home' && <Home onNavigate={setPage} />}

      {page === 'saida' && (
        <MovimentacaoDrift tipo="saida" onBack={goHome} showToast={showToast} />
      )}

      {page === 'entrada' && (
        <MovimentacaoDrift tipo="entrada" onBack={goHome} showToast={showToast} />
      )}

      {page === 'historico' && <Historico onBack={goHome} />}

      {page === 'cadastros' && <Cadastros onBack={goHome} showToast={showToast} />}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  )
}

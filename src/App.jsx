import { useState, useEffect, useCallback, useRef, Component } from 'react'
import Home from './pages/Home.jsx'
import MovimentacaoDrift from './pages/MovimentacaoDrift.jsx'
import Historico from './pages/Historico.jsx'
import Cadastros from './pages/Cadastros.jsx'
import BrandBar from './components/BrandBar.jsx'
import { supabaseConfigured } from './supabaseClient.js'

/* ---------- Tela de aviso de configuração ---------- */
function NotConfigured() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",sans-serif',
      background: 'linear-gradient(135deg,#f0f4ff,#f5f0ff)',
      padding: 24,
    }}>
      <div style={{
        background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,.6)', borderRadius: 22,
        padding: '40px 36px', maxWidth: 480, textAlign: 'center',
        boxShadow: '0 18px 44px rgba(17,24,39,.13)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 600, color: '#0b1220' }}>
          Supabase não configurado
        </h2>
        <p style={{ margin: '0 0 24px', color: '#6b7280', lineHeight: 1.6 }}>
          As variáveis de ambiente <strong>VITE_SUPABASE_URL</strong> e{' '}
          <strong>VITE_SUPABASE_ANON_KEY</strong> não foram encontradas.
        </p>
        <div style={{
          background: '#f3f4f6', borderRadius: 12, padding: '16px 18px',
          textAlign: 'left', fontFamily: 'monospace', fontSize: 13, color: '#374151',
          lineHeight: 1.8,
        }}>
          <div>1. Acesse <strong>vercel.com → seu projeto</strong></div>
          <div>2. Vá em <strong>Settings → Environment Variables</strong></div>
          <div>3. Adicione as duas variáveis</div>
          <div>4. Clique em <strong>Redeploy</strong></div>
        </div>
        <p style={{ margin: '20px 0 0', fontSize: 13, color: '#9ca3af' }}>
          As chaves estão em <strong>supabase.com → Project Settings → API</strong>
        </p>
      </div>
    </div>
  )
}

/* ---------- Error Boundary ---------- */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    const msg = this.state.error?.message || String(this.state.error)
    const isConfig = msg.includes('SUPABASE_NOT_CONFIGURED') || msg.includes('Invalid URL')
    return isConfig ? <NotConfigured /> : (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui', padding: 24, background: '#f9fafb',
      }}>
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
          padding: '32px 28px', maxWidth: 480, textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚨</div>
          <h2 style={{ margin: '0 0 8px', color: '#111827' }}>Erro inesperado</h2>
          <pre style={{
            background: '#f3f4f6', borderRadius: 8, padding: '12px 14px',
            fontSize: 12, textAlign: 'left', overflowX: 'auto', color: '#dc2626',
          }}>{msg}</pre>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 20, background: '#007aff', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 22px', fontSize: 15, cursor: 'pointer',
          }}>Recarregar</button>
        </div>
      </div>
    )
  }
}

/* ---------- App principal ---------- */
function AppInner() {
  const [page, setPage] = useState('home')
  const [toast, setToast] = useState(null)
  const leaveGuardRef = useRef(null)   // fn() → true = pode sair | false = bloqueado

  const registerLeaveGuard = useCallback((fn) => { leaveGuardRef.current = fn }, [])
  const clearLeaveGuard    = useCallback(()   => { leaveGuardRef.current = null }, [])

  const goHome = useCallback(() => {
    const guard = leaveGuardRef.current
    if (guard && !guard()) return
    leaveGuardRef.current = null
    setPage('home')
  }, [])

  const showToast = useCallback((message, type = 'ok') => setToast({ message, type }), [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && page !== 'home') goHome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, goHome])

  const guardProps = { registerLeaveGuard, clearLeaveGuard }

  return (
    <div className="app">
      <BrandBar />
      {page === 'home'     && <Home onNavigate={setPage} />}
      {page === 'saida'    && <MovimentacaoDrift tipo="saida"   onBack={goHome} showToast={showToast} {...guardProps} />}
      {page === 'entrada'  && <MovimentacaoDrift tipo="entrada" onBack={goHome} showToast={showToast} {...guardProps} />}
      {page === 'historico'&& <Historico onBack={goHome} />}
      {page === 'cadastros'&& <Cadastros onBack={goHome} showToast={showToast} {...guardProps} />}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  )
}

export default function App() {
  if (!supabaseConfigured) return <NotConfigured />
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}

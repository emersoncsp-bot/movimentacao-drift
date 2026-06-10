import { GaugeIcon } from './icons.jsx'

export default function BrandBar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <span className="brand-mark"><GaugeIcon /></span>
          <div className="brand-text">
            <span className="brand-name">Controle da Qualidade</span>
            <span className="brand-subtitle">Registro de medição e movimentação de DRIFTS</span>
          </div>
        </div>
        <div className="brand-cred">
          <span className="brand-cred-top">Desenvolvido por</span>
          <span className="brand-cred-name">Emerson Santos</span>
        </div>
      </div>
    </nav>
  )
}

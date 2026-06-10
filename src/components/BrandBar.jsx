import { GaugeIcon } from './icons.jsx'

// Barra de navegação de vidro (frosted), fixa no topo em todas as telas.
export default function BrandBar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <span className="brand-mark"><GaugeIcon /></span>
          <span className="brand-name">Controle da Qualidade</span>
        </div>
        <span className="brand-cred">Emerson Santos</span>
      </div>
    </nav>
  )
}

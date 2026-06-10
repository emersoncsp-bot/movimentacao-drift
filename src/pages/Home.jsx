import { IcoSaida, IcoEntrada, IcoHistorico, IcoCadastros } from '../components/icons.jsx'

const CARDS = [
  { key: 'saida', Ico: IcoSaida, chip: 'blue', title: 'Saída de drifts',
    desc: 'Registre a medição do drift antes da utilização na produção.' },
  { key: 'entrada', Ico: IcoEntrada, chip: 'green', title: 'Entrada de drifts',
    desc: 'Registre a medição do drift no retorno da produção.' },
  { key: 'historico', Ico: IcoHistorico, chip: 'indigo', title: 'Histórico',
    desc: 'Veja as medições de saída e entrada consolidadas por EC.' },
  { key: 'cadastros', Ico: IcoCadastros, chip: 'gray', title: 'Cadastros',
    desc: 'Gerencie os drifts e os responsáveis pela medição.' },
]

export default function Home({ onNavigate }) {
  return (
    <div className="container home">
      <header className="hero">
        <h1>Painel de controle</h1>
        <p>Registre a medição e a movimentação dos drifts, acompanhe o histórico por EC e gerencie os cadastros.</p>
      </header>
      <div className="cards">
        {CARDS.map(({ key, Ico, chip, title, desc }) => (
          <button key={key} className="nav-card" onClick={() => onNavigate(key)}>
            <span className={`ic ${chip}`}><Ico /></span>
            <h3>{title}</h3>
            <p>{desc}</p>
            <span className="go">Abrir <span className="chev" aria-hidden="true">›</span></span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PageHeader({ title, onBack }) {
  return (
    <div className="page-top">
      <button className="btn-back" onClick={onBack} aria-label="Voltar ao menu">
        <span className="chev" aria-hidden="true">‹</span> Voltar ao menu
      </button>
      <h1 className="page-title">{title}</h1>
      <div className="esc-hint">
        Pressione <kbd>Esc</kbd> para voltar ao início
      </div>
    </div>
  )
}

export function GaugeIcon({ size = 24 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><line x1="12" y1="2.5" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="21.5" /><line x1="2.5" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="21.5" y2="12" /><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" /></svg>)
}
export function IcoSaida() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" /><path d="M12 15V3" /><path d="M8 7l4-4 4 4" /></svg>)
}
export function IcoEntrada() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" /><path d="M12 3v12" /><path d="M8 11l4 4 4-4" /></svg>)
}
export function IcoHistorico() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" /></svg>)
}
export function IcoCadastros() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h8" /><path d="M17 7h3" /><circle cx="14.5" cy="7" r="2.4" /><path d="M4 17h3" /><path d="M12 17h8" /><circle cx="9.5" cy="17" r="2.4" /></svg>)
}

export const ICONS = {
  saida: IcoSaida,
  entrada: IcoEntrada,
  historico: IcoHistorico,
  cadastros: IcoCadastros,
}

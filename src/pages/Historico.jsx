import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { listMovimentacoes } from '../db.js'
import { formatDateTime, isoDateOnly, fmtNum, minMax, flatMedicoes } from '../utils.js'

// Classifica a ordem de produção: LA -> Laminação, LQ -> Tratamento Térmico
function tipoOrdem(op) {
  const u = (op || '').trim().toUpperCase()
  if (u.startsWith('LA')) return 'la'
  if (u.startsWith('LQ')) return 'lq'
  return 'outros'
}

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function rotuloMes(key) {
  const [ano, mes] = key.split('-')
  return `${MESES_ABREV[Number(mes) - 1]}/${ano.slice(2)}`
}

// Exporta os dados filtrados para .xlsx usando SheetJS (CDN carregado sob demanda)
async function exportXlsx(rows) {
  // carrega xlsx dinamicamente para não aumentar o bundle principal
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs').catch(() => null)
  if (!XLSX) { alert('Não foi possível carregar a biblioteca de exportação.'); return }

  const ws_data = [
    ['EC', 'Diâmetro', 'Ordem de Prod.', 'Tipo de Ordem',
      // Saída
      'Saída – Pé 1','Saída – Pé 2','Saída – Pé 3',
      'Saída – Centro 1','Saída – Centro 2','Saída – Centro 3',
      'Saída – Ponta 1','Saída – Ponta 2','Saída – Ponta 3',
      'Saída – Mínimo','Saída – Médio','Saída – Máximo',
      'Saída – Responsável','Saída – Data e Hora',
      // Entrada
      'Entrada – Pé 1','Entrada – Pé 2','Entrada – Pé 3',
      'Entrada – Centro 1','Entrada – Centro 2','Entrada – Centro 3',
      'Entrada – Ponta 1','Entrada – Ponta 2','Entrada – Ponta 3',
      'Entrada – Mínimo','Entrada – Médio','Entrada – Máximo',
      'Entrada – Responsável','Entrada – Data e Hora',
    ],
    ...rows.map((l) => {
      const tipoLabel = (op) => {
        const u = (op || '').toUpperCase()
        if (u.startsWith('LA')) return 'Laminação'
        if (u.startsWith('LQ')) return 'Tratamento Térmico'
        return op || ''
      }
      const meds = (reg) => {
        if (!reg?.medicoes) return Array(9).fill('')
        return [...(reg.medicoes.pe||['',' ','']), ...(reg.medicoes.centro||['',' ','']), ...(reg.medicoes.ponta||['',' ',''])]
      }
      const s = l.saida; const e = l.entrada
      const sm = meds(s); const em = meds(e)
      const { min: sMin, max: sMax } = minMax(flatMedicoes(s?.medicoes))
      const { min: eMin, max: eMax } = minMax(flatMedicoes(e?.medicoes))
      return [
        l.ec, l.diametro, l.ordem || '', tipoLabel(l.ordem),
        ...sm, sMin ?? '', s?.valorMedio ?? '', sMax ?? '', s?.responsavelNome || '', s ? formatDateTime(s.dataHora) : '',
        ...em, eMin ?? '', e?.valorMedio ?? '', eMax ?? '', e?.responsavelNome || '', e ? formatDateTime(e.dataHora) : '',
      ]
    }),
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(ws_data)
  // largura de colunas
  ws['!cols'] = [
    {wch:12},{wch:10},{wch:16},{wch:18},
    ...Array(9).fill({wch:9}),...Array(3).fill({wch:10}),{wch:20},{wch:18},
    ...Array(9).fill({wch:9}),...Array(3).fill({wch:10}),{wch:20},{wch:18},
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Drifts')
  XLSX.writeFile(wb, `historico_drifts_${new Date().toISOString().slice(0,10)}.xlsx`)
}

export default function Historico({ onBack }) {
  const [saidas, setSaidas] = useState([])
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [fEc, setFEc] = useState('')
  const [fOrdem, setFOrdem] = useState('')
  const [fData, setFData] = useState('')
  const [fDiametro, setFDiametro] = useState('')

  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const [s, e] = await Promise.all([
          listMovimentacoes('saida'),
          listMovimentacoes('entrada'),
        ])
        if (!ativo) return
        setSaidas(s)
        setEntradas(e)
      } catch (err) {
        if (ativo) setLoadError(true)
      } finally {
        if (ativo) setLoading(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [])

  // Consolida por EC: para cada EC, pareia saídas e entradas em ordem
  // cronológica (1ª saída ↔ 1ª entrada, e assim por diante). A Ordem de
  // produção vem da saída; quem não tem par fica com o lado em branco.
  const linhas = useMemo(() => {
    const grupos = new Map()
    const ensure = (ec, diametro) => {
      if (!grupos.has(ec)) grupos.set(ec, { ec, diametro, saidas: [], entradas: [] })
      const g = grupos.get(ec)
      if ((g.diametro === null || g.diametro === undefined) && diametro != null) g.diametro = diametro
      return g
    }
    saidas.forEach((s) => ensure(s.ec, s.diametro).saidas.push(s))
    entradas.forEach((e) => ensure(e.ec, e.diametro).entradas.push(e))

    const byDate = (a, b) => new Date(a.dataHora) - new Date(b.dataHora)
    const rows = []
    for (const g of grupos.values()) {
      const sa = [...g.saidas].sort(byDate)
      const en = [...g.entradas].sort(byDate)
      const n = Math.max(sa.length, en.length)
      for (let i = 0; i < n; i++) {
        const saida = sa[i] || null
        const entrada = en[i] || null
        rows.push({
          ec: g.ec,
          diametro: saida?.diametro ?? entrada?.diametro ?? g.diametro,
          ordem: saida?.ordemProducao || '',
          saida,
          entrada,
        })
      }
    }
    return rows.sort((a, b) => {
      const ta = new Date(a.saida?.dataHora || a.entrada?.dataHora).getTime()
      const tb = new Date(b.saida?.dataHora || b.entrada?.dataHora).getTime()
      return tb - ta
    })
  }, [saidas, entradas])

  const filtradas = useMemo(() => {
    return linhas.filter((l) => {
      if (fEc && !l.ec.toLowerCase().includes(fEc.toLowerCase())) return false
      if (fOrdem && !l.ordem.toLowerCase().includes(fOrdem.toLowerCase())) return false
      if (fDiametro) {
        const q = fDiametro.trim().replace(',', '.')
        if (!String(l.diametro).includes(q)) return false
      }
      if (fData) {
        const datas = [l.saida?.dataHora, l.entrada?.dataHora]
          .filter(Boolean)
          .map(isoDateOnly)
        if (!datas.includes(fData)) return false
      }
      return true
    })
  }, [linhas, fEc, fOrdem, fData, fDiametro])

  // Dashboard: utilizações (saídas) por EC e tipo de ordem, respeitando os filtros
  const dash = useMemo(() => {
    const filtroSaida = (s) => {
      if (fEc && !s.ec.toLowerCase().includes(fEc.toLowerCase())) return false
      if (fOrdem && !(s.ordemProducao || '').toLowerCase().includes(fOrdem.toLowerCase())) return false
      if (fDiametro) {
        const q = fDiametro.trim().replace(',', '.')
        if (!String(s.diametro).includes(q)) return false
      }
      if (fData && isoDateOnly(s.dataHora) !== fData) return false
      return true
    }
    const usos = saidas.filter(filtroSaida)
    const m = new Map()
    const mm = new Map()
    let la = 0, lq = 0, outros = 0
    usos.forEach((s) => {
      const t = tipoOrdem(s.ordemProducao)
      if (t === 'la') la++
      else if (t === 'lq') lq++
      else outros++
      if (!m.has(s.ec)) m.set(s.ec, { ec: s.ec, la: 0, lq: 0, outros: 0, total: 0 })
      const g = m.get(s.ec)
      g[t]++
      g.total++
      // quebra por mês (YYYY-MM a partir da data da medição)
      const d = new Date(s.dataHora)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!mm.has(key)) mm.set(key, { key, la: 0, lq: 0, outros: 0, total: 0 })
      const gm = mm.get(key)
      gm[t]++
      gm.total++
    })
    const rows = Array.from(m.values()).sort((a, b) => b.total - a.total)
    const max = rows.reduce((mx, r) => Math.max(mx, r.total), 0) || 1
    const meses = Array.from(mm.values()).sort((a, b) => a.key.localeCompare(b.key)).slice(-12)
    const maxMes = meses.reduce((mx, r) => Math.max(mx, r.total), 0) || 1
    return { rows, max, meses, maxMes, la, lq, outros, total: usos.length, ecs: rows.length }
  }, [saidas, fEc, fOrdem, fData, fDiametro])

  const limpar = () => {
    setFEc('')
    setFOrdem('')
    setFData('')
    setFDiametro('')
  }

  const temFiltro = fEc || fOrdem || fData || fDiametro

  return (
    <div className="container wide">
      <PageHeader title="Histórico" onBack={onBack} iconKey="historico" />

      <div className="panel">
        <div className="panel-head">
          <h3>Utilização de drifts</h3>
          <div className="legend">
            <span><i className="dot la" /> Laminação (LA)</span>
            <span><i className="dot lq" /> Tratamento Térmico (LQ)</span>
            {dash.outros > 0 && <span><i className="dot outros" /> Outros</span>}
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat-label">Utilizações</span>
            <span className="stat-value num">{dash.total}</span>
          </div>
          <div className="stat">
            <span className="stat-label"><i className="dot la" /> Laminação</span>
            <span className="stat-value num">{dash.la}</span>
          </div>
          <div className="stat">
            <span className="stat-label"><i className="dot lq" /> Tratamento Térmico</span>
            <span className="stat-value num">{dash.lq}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Drifts utilizados</span>
            <span className="stat-value num">{dash.ecs}</span>
          </div>
        </div>

        <div className="charts">
          <div>
            <div className="chart-head"><span className="chart-title">Por EC e ordem</span></div>
            {dash.rows.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>Nenhuma utilização registrada.</div>
            ) : (
              dash.rows.map((r) => (
                <div className="bar-row" key={r.ec}>
                  <span className="bar-ec">{r.ec}</span>
                  <div className="bar-track">
                    {r.la > 0 && <div className="bar-seg la" style={{ width: `${(r.la / dash.max) * 100}%` }} title={`Laminação: ${r.la}`} />}
                    {r.lq > 0 && <div className="bar-seg lq" style={{ width: `${(r.lq / dash.max) * 100}%` }} title={`Tratamento Térmico: ${r.lq}`} />}
                    {r.outros > 0 && <div className="bar-seg outros" style={{ width: `${(r.outros / dash.max) * 100}%` }} title={`Outros: ${r.outros}`} />}
                  </div>
                  <span className="bar-total num">{r.total}</span>
                </div>
              ))
            )}
          </div>

          <div>
            <div className="chart-head"><span className="chart-title">Por mês</span></div>
            {dash.meses.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>Sem dados no período.</div>
            ) : (
              <div className="month-chart">
                {dash.meses.map((mes) => (
                  <div className="month-col" key={mes.key}>
                    <span className="month-count num">{mes.total}</span>
                    <div className="month-track">
                      <div className="month-bar" style={{ height: `${(mes.total / dash.maxMes) * 100}%` }}>
                        {mes.la > 0 && <div className="month-seg la" style={{ height: `${(mes.la / mes.total) * 100}%` }} title={`Laminação: ${mes.la}`} />}
                        {mes.lq > 0 && <div className="month-seg lq" style={{ height: `${(mes.lq / mes.total) * 100}%` }} title={`Tratamento Térmico: ${mes.lq}`} />}
                        {mes.outros > 0 && <div className="month-seg outros" style={{ height: `${(mes.outros / mes.total) * 100}%` }} title={`Outros: ${mes.outros}`} />}
                      </div>
                    </div>
                    <span className="month-label">{rotuloMes(mes.key)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h3>Pesquisar registros</h3>
          {temFiltro && (
            <button className="icon-btn" onClick={limpar}>
              Limpar filtros
            </button>
          )}
        </div>
        <div className="filters">
          <div className="field" style={{ margin: 0 }}>
            <label>EC do drift</label>
            <input value={fEc} onChange={(e) => setFEc(e.target.value)} placeholder="Ex.: EC-1001" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Ordem de produção</label>
            <input value={fOrdem} onChange={(e) => setFOrdem(e.target.value)} placeholder="Ex.: LA0000000" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Data</label>
            <input type="date" value={fData} onChange={(e) => setFData(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Diâmetro do drift</label>
            <input value={fDiametro} onChange={(e) => setFDiametro(e.target.value)} placeholder="Ex.: 12.7" />
          </div>
        </div>
      </div>

      <div className="table-wrap scroll" style={{ marginTop: 18 }}>
        <div className="table-toolbar" style={{ padding: '14px 16px 0' }}>
          <h3>Registros</h3>
          <button className="btn-excel" onClick={() => exportXlsx(filtradas)} title="Baixar em Excel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
            Exportar Excel
          </button>
        </div>
        <table>
          <thead>
            <tr className="group-head">
              <th className="grp-ref" colSpan={4}>Referência</th>
              <th className="grp-saida" colSpan={5}>Saída</th>
              <th className="grp-entrada" colSpan={5}>Entrada</th>
            </tr>
            <tr>
              <th className="col-ec">EC</th>
              <th>Ø (mm)</th>
              <th>Ordem</th>
              <th>Tipo</th>

              <th>Medições (Pé / Centro / Ponta)</th>
              <th>Mín</th>
              <th>Méd</th>
              <th>Máx</th>
              <th>Responsável / Data</th>

              <th>Medições (Pé / Centro / Ponta)</th>
              <th>Mín</th>
              <th>Méd</th>
              <th>Máx</th>
              <th>Responsável / Data</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={14}><div className="empty-state">Carregando histórico…</div></td></tr>
            )}
            {!loading && loadError && (
              <tr><td colSpan={14}><div className="empty-state"><div className="big">⚠️</div>Não foi possível carregar o histórico do Supabase.</div></td></tr>
            )}
            {!loading && !loadError && filtradas.length === 0 && (
              <tr><td colSpan={14}><div className="empty-state"><div className="big">🔍</div>
                {linhas.length === 0 ? 'Nenhuma medição registrada ainda.' : 'Nenhum registro corresponde aos filtros.'}
              </div></td></tr>
            )}
            {!loading && !loadError && filtradas.map((l, idx) => {
              const tipoLabel = (op) => {
                const u = (op || '').toUpperCase()
                if (u.startsWith('LA')) return 'Laminação'
                if (u.startsWith('LQ')) return 'Tratamento Térmico'
                return op ? 'Outro' : '—'
              }
              const MedsCells = ({ reg, diametro }) => {
                if (!reg) return <><td className="sep-left"></td><td></td><td></td><td></td><td></td></>
                const flat = flatMedicoes(reg.medicoes)
                const { min: vMin, max: vMax } = minMax(flat)
                const warn = (v) => v !== '' && v != null && diametro && Number(v) < Number(diametro)
                const MedGrid = ({ vals, label }) => (
                  <div>
                    <div className="meds-pos">{label}</div>
                    <div className="meds-grid">
                      {vals.map((v, i) => (
                        <span key={i} className={`meds-val${warn(v) ? ' warn' : ''}`}>{fmtNum(v)}</span>
                      ))}
                    </div>
                  </div>
                )
                return (
                  <>
                    <td className="sep-left" style={{ minWidth: 180 }}>
                      {reg.medicoes ? (
                        <>
                          <MedGrid vals={reg.medicoes.pe || []} label="Pé" />
                          <MedGrid vals={reg.medicoes.centro || []} label="Centro" />
                          <MedGrid vals={reg.medicoes.ponta || []} label="Ponta" />
                        </>
                      ) : '—'}
                    </td>
                    <td className={`num${warn(vMin) ? ' meds-val warn' : ''}`}>{fmtNum(vMin)}</td>
                    <td className="num">{fmtNum(reg.valorMedio)}</td>
                    <td className={`num${warn(vMax) ? ' meds-val warn' : ''}`}>{fmtNum(vMax)}</td>
                    <td style={{ minWidth: 150 }}>
                      <div style={{ fontSize: 13 }}>{reg.responsavelNome}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatDateTime(reg.dataHora)}</div>
                    </td>
                  </>
                )
              }
              return (
                <tr key={idx}>
                  <td className="ec-cell">{l.ec}</td>
                  <td className="num">{fmtNum(l.diametro)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{l.ordem || <span className="empty-cell">—</span>}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{tipoLabel(l.ordem)}</td>
                  <MedsCells reg={l.saida} diametro={l.diametro} />
                  <MedsCells reg={l.entrada} diametro={l.diametro} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

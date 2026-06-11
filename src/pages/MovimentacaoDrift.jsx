import { useState, useEffect, useMemo, Fragment } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { listDrifts, listResponsaveis, createMovimentacao } from '../db.js'
import { formatDateTime, average, fmtNum, fmtNum2, minMax, flatMedicoes, parseNum } from '../utils.js'

const POSICOES = [
  { key: 'pe', label: 'PÉ' },
  { key: 'centro', label: 'CENTRO' },
  { key: 'ponta', label: 'PONTA' },
]

const emptyMedicoes = () => ({
  pe: ['', '', ''],
  centro: ['', '', ''],
  ponta: ['', '', ''],
})

export default function MovimentacaoDrift({ tipo, onBack, showToast, registerLeaveGuard, clearLeaveGuard }) {
  const isSaida = tipo === 'saida'
  const titulo = isSaida ? 'Saída de drifts' : 'Entrada de drifts'

  const [drifts, setDrifts] = useState([])
  const [responsaveis, setResponsaveis] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)

  const [ec, setEc] = useState('')
  const [ordem, setOrdem] = useState('')
  const [medicoes, setMedicoes] = useState(emptyMedicoes())
  const [responsavelId, setResponsavelId] = useState('')
  const [agora, setAgora] = useState(new Date())
  const [submitted, setSubmitted] = useState(false)

  // Carrega listas de drifts e responsáveis do Supabase
  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const [d, r] = await Promise.all([listDrifts(), listResponsaveis()])
        if (!ativo) return
        setDrifts(d)
        setResponsaveis(r)
      } catch (e) {
        if (ativo) setLoadError(true)
      } finally {
        if (ativo) setLoading(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [])

  // Relógio ao vivo para o campo de data e hora
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000 * 15)
    return () => clearInterval(t)
  }, [])

  const driftSelecionado = drifts.find((d) => d.ec === ec)
  const diametro = driftSelecionado ? driftSelecionado.diametro : ''

  const todasMedicoes = [...medicoes.pe, ...medicoes.centro, ...medicoes.ponta]
  const media = average(todasMedicoes, 9)
  const { min: valMin, max: valMax } = minMax(todasMedicoes)

  // Verifica quais células individuais estão abaixo do  do drift
  const abaixo = (v) =>
    diametro !== '' && v !== '' && v !== null && Number(v) < Number(diametro)

  function setMedida(posKey, idx, value) {
    // aceita vírgula como decimal (pt-BR) e normaliza para ponto
    const normalizado = value.replace(',', '.')
    setMedicoes((prev) => {
      const next = { ...prev, [posKey]: [...prev[posKey]] }
      next[posKey][idx] = normalizado
      return next
    })
  }

  const ecInvalid = ec.trim() !== '' && !driftSelecionado
  // dirty: qualquer campo preenchido = alterações não salvas
  const isDirty = useMemo(() => Boolean(
    ec || ordem || responsavelId ||
    medicoes.pe.some(v => v !== '') ||
    medicoes.centro.some(v => v !== '') ||
    medicoes.ponta.some(v => v !== '')
  ), [ec, ordem, responsavelId, medicoes])

  // Registra o guard de saída enquanto há alterações não salvas
  useEffect(() => {
    if (isDirty) {
      registerLeaveGuard?.(() =>
        window.confirm('Há medições não salvas. Deseja sair sem salvar?')
      )
    } else {
      clearLeaveGuard?.()
    }
    return () => clearLeaveGuard?.()
  }, [isDirty])

  const errors = {
    ec: !driftSelecionado,
    ordem: isSaida ? !ordem.trim() : false,
    responsavel: !responsavelId,
    medicoes: !media.all,
  }
  const hasError = Object.values(errors).some(Boolean)

  async function handleSubmit() {
    setSubmitted(true)
    if (hasError) {
      showToast('Preencha todos os campos antes de salvar.', 'err')
      return
    }
    const resp = responsaveis.find((r) => r.id === responsavelId)
    const registro = {
      tipo,
      ec,
      diametro: driftSelecionado.diametro,
      ordemProducao: isSaida ? ordem.trim() : null,
      medicoes,
      valorMedio: media.value,
      valorMin: valMin,
      valorMax: valMax,
      responsavelPN: resp.pn,
      responsavelNome: resp.nome,
      dataHora: new Date().toISOString(),
    }

    setSaving(true)
    try {
      await createMovimentacao(registro)
      setEc('')
      setOrdem('')
      setMedicoes(emptyMedicoes())
      setResponsavelId('')
      setSubmitted(false)
      showToast(`Medição de ${isSaida ? 'saída' : 'entrada'} registrada com sucesso.`, 'ok')
    } catch (e) {
      showToast('Erro ao salvar no Supabase. Verifique a conexão.', 'err')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container narrow">
        <PageHeader title={titulo} onBack={onBack} iconKey={tipo} />
        <div className="panel">
          <div className="empty-state">Carregando dados…</div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="container narrow">
        <PageHeader title={titulo} onBack={onBack} iconKey={tipo} />
        <div className="panel">
          <div className="empty-state">
            <div className="big">⚠️</div>
            Não foi possível carregar os cadastros do Supabase. Verifique as variáveis de
            ambiente e a conexão.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container narrow">
      <PageHeader title={titulo} onBack={onBack} iconKey={tipo} />

      <div className="panel">
        <div className="grid-2">
          <div className="field">
            <label>Código do drift</label>
            <input
              value={ec}
              onChange={(e) => setEc(e.target.value)}
              placeholder="Digite o código…"
              autoComplete="off"
              style={ecInvalid || (submitted && errors.ec) ? { borderColor: 'var(--red)' } : undefined}
            />
            {ecInvalid && <div className="error-text">Código não cadastrado.</div>}
            {submitted && !ec.trim() && <div className="error-text">Informe o código EC.</div>}
          </div>

          <div className="field">
            <label>Diâmetro mínimo [mm]</label>
            <input
              className="num"
              readOnly
              value={diametro === '' ? '' : fmtNum(diametro)}
              placeholder="Definido pelo EC"
            />
          </div>
        </div>

        {isSaida && (
          <div className="field">
            <label>Ordem de produção</label>
            <input
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              placeholder="Ex.: LA0000000 ou LQ0000000"
              style={submitted && errors.ordem ? { borderColor: 'var(--red)' } : undefined}
            />
            {submitted && errors.ordem && (
              <div className="error-text">Informe a ordem de produção.</div>
            )}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Medições</h3>
        </div>

        <div className="meas-grid">
          <div className="head" />
          <div className="head">Leitura 1</div>
          <div className="head">Leitura 2</div>
          <div className="head">Leitura 3</div>

          {POSICOES.map((pos) => (
            <Fragment key={pos.key}>
              <div className="pos-label">
                <span className="dot" /> {pos.label}
              </div>
              {[0, 1, 2].map((i) => {
                const val = medicoes[pos.key][i]
                const isEmpty = submitted && val === ''
                const isWarn = abaixo(val)
                return (
                  <input
                    key={i}
                    className={`num${isWarn ? ' inp-warn' : ''}`}
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={val}
                    onChange={(e) => setMedida(pos.key, i, e.target.value)}
                    placeholder="0,000"
                    style={isEmpty ? { borderColor: 'var(--red)' } : undefined}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>

        {submitted && errors.medicoes && (
          <div className="error-text" style={{ marginTop: 10 }}>
            Preencha todas as 9 medições.
          </div>
        )}

        <div className="readout">
          <div className={`readout-cell${valMin !== null && abaixo(valMin) ? ' warn' : ''}`}>
            <div className="readout-label">Mínimo</div>
            <div className={`readout-value${valMin !== null && abaixo(valMin) ? ' warn' : ''}`}>
              {valMin === null ? '—' : fmtNum2(valMin)}
            </div>
            {valMin !== null && abaixo(valMin) && (
              <div className="readout-warn-text">⚠ abaixo do Ø</div>
            )}
          </div>
          <div className="readout-cell">
            <div className="readout-label">Médio ({media.count}/9)</div>
            <div className={`readout-value med${media.value === null ? ' empty' : ''}`}>
              {media.value === null ? '—' : fmtNum2(media.value)}
            </div>
          </div>
          <div className={`readout-cell${valMax !== null && abaixo(valMax) ? ' warn' : ''}`}>
            <div className="readout-label">Máximo</div>
            <div className={`readout-value${valMax !== null && abaixo(valMax) ? ' warn' : ''}`}>
              {valMax === null ? '—' : fmtNum2(valMax)}
            </div>
            {valMax !== null && abaixo(valMax) && (
              <div className="readout-warn-text">⚠ abaixo do Ø</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="grid-2">
          <div className="field">
            <label>Responsável pela medição</label>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              style={
                submitted && errors.responsavel ? { borderColor: 'var(--red)' } : undefined
              }
            >
              <option value="">Selecione o responsável…</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome} ({r.pn})
                </option>
              ))}
            </select>
            {submitted && errors.responsavel && (
              <div className="error-text">Selecione o responsável.</div>
            )}
          </div>

          <div className="field">
            <label>Data e hora da medição</label>
            <div className="datetime-live">
              <span className="dot" />
              {formatDateTime(agora)}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar medição'}
          </button>
          <button className="btn btn-ghost" onClick={onBack} disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import {
  listDrifts,
  createDrift,
  updateDrift,
  deleteDrift,
  listResponsaveis,
  createResponsavel,
  updateResponsavel,
  deleteResponsavel,
} from '../db.js'
import { fmtNum, parseNum } from '../utils.js'

export default function Cadastros({ onBack, showToast, registerLeaveGuard, clearLeaveGuard }) {
  const [tab, setTab] = useState('drifts')

  return (
    <div className="container">
      <PageHeader title="Cadastros" onBack={onBack} iconKey="cadastros" />

      <div className="tabs">
        <button className={`tab ${tab === 'drifts' ? 'active' : ''}`} onClick={() => setTab('drifts')}>
          Drifts
        </button>
        <button
          className={`tab ${tab === 'responsaveis' ? 'active' : ''}`}
          onClick={() => setTab('responsaveis')}
        >
          Responsáveis
        </button>
      </div>

      {tab === 'drifts' ? (
        <CrudSection
          key="drifts"
          list={listDrifts}
          create={createDrift}
          update={updateDrift}
          remove={deleteDrift}
          showToast={showToast}
          itemNome="drift"
          fields={[
            { key: 'ec', label: 'Código do drift', type: 'text', placeholder: 'Ex.: 1004' },
            { key: 'diametro', label: 'Diâmetro [mm]', type: 'number', placeholder: 'Ex.: 215,90' },
          ]}
          searchKey="ec"
          searchLabel="Buscar por EC"
          columns={[
            { key: 'ec', label: 'Código EC', className: 'ec-cell' },
            { key: 'diametro', label: 'Diâmetro [mm]', className: 'num', format: (v) => fmtNum(v) },
          ]}
        />
      ) : (
        <CrudSection
          key="responsaveis"
          list={listResponsaveis}
          create={createResponsavel}
          update={updateResponsavel}
          remove={deleteResponsavel}
          showToast={showToast}
          itemNome="responsável"
          fields={[
            { key: 'pn', label: 'PN', type: 'text', placeholder: 'Ex.: 701234' },
            { key: 'nome', label: 'Nome', type: 'text', placeholder: 'Ex.: Nome Sobrenome' },
          ]}
          searchKey="pn"
          searchLabel="Buscar por PN"
          columns={[
            { key: 'pn', label: 'PN', className: 'ec-cell' },
            { key: 'nome', label: 'Nome' },
          ]}
        />
      )}
    </div>
  )
}

function emptyForm(fields) {
  return fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})
}

function CrudSection({ registerLeaveGuard, clearLeaveGuard,
  list,
  create,
  update,
  remove,
  fields,
  searchKey,
  searchLabel,
  columns,
  itemNome,
  showToast,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState(() => emptyForm(fields))
  const [editingId, setEditingId] = useState(null)
  const [busca, setBusca] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Dirty = há edição em andamento não salva
  const isDirty = useMemo(() =>
    Boolean(editingId && fields.some(f => String(form[f.key]).trim() !== ''))
  , [editingId, form, fields])

  useEffect(() => {
    if (isDirty) {
      registerLeaveGuard?.(() =>
        window.confirm('Há um cadastro em edição não salvo. Deseja sair sem salvar?')
      )
    } else {
      clearLeaveGuard?.()
    }
    return () => clearLeaveGuard?.()
  }, [isDirty])

  async function refresh() {
    try {
      const data = await list()
      setItems(data)
      setLoadError(false)
    } catch (e) {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const data = await list()
        if (ativo) setItems(data)
      } catch (e) {
        if (ativo) setLoadError(true)
      } finally {
        if (ativo) setLoading(false)
      }
    })()
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setCampo(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const faltando = fields.filter((f) => String(form[f.key]).trim() === '')

  async function handleSave() {
    setSubmitted(true)
    if (faltando.length > 0) {
      showToast('Preencha todos os campos.', 'err')
      return
    }

    const valores = fields.reduce((acc, f) => {
      acc[f.key] = f.type === 'number' ? parseNum(form[f.key]) : form[f.key].trim()
      return acc
    }, {})

    setSaving(true)
    try {
      if (editingId) {
        await update(editingId, valores)
        showToast('Cadastro atualizado.', 'ok')
      } else {
        await create(valores)
        showToast(`Novo ${itemNome} cadastrado.`, 'ok')
      }
      cancelEdit()
      await refresh()
    } catch (e) {
      showToast('Erro ao salvar no Supabase. Verifique a conexão.', 'err')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm(fields.reduce((acc, f) => ({ ...acc, [f.key]: String(item[f.key]) }), {}))
    setSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm(fields))
    setSubmitted(false)
  }

  async function handleDelete(item) {
    if (!window.confirm(`Excluir o cadastro "${item[fields[0].key]}"?`)) return
    setSaving(true)
    try {
      await remove(item.id)
      if (editingId === item.id) cancelEdit()
      showToast('Cadastro excluído.', 'ok')
      await refresh()
    } catch (e) {
      showToast('Erro ao excluir no Supabase.', 'err')
    } finally {
      setSaving(false)
    }
  }

  const filtrados = items.filter((it) =>
    busca.trim() === ''
      ? true
      : String(it[searchKey]).toLowerCase().includes(busca.trim().toLowerCase()),
  )

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>{editingId ? 'Editar cadastro' : 'Novo cadastro'}</h3>
        </div>

        {editingId && (
          <div className="editing-banner">
            ✎ Editando registro existente.
            <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={cancelEdit}>
              Cancelar edição
            </button>
          </div>
        )}

        <div className="grid-2">
          {fields.map((f) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                step={f.type === 'number' ? 'any' : undefined}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                value={form[f.key]}
                onChange={(e) => setCampo(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={f.type === 'number' ? 'num' : undefined}
                style={
                  submitted && String(form[f.key]).trim() === ''
                    ? { borderColor: 'var(--red)' }
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar'}
          </button>
          {editingId && (
            <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Cadastros ativos ({filtrados.length})</h3>
        </div>

        <div className="search-row">
          <span className="ico" aria-hidden="true">
            🔍
          </span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={searchLabel}
          />
        </div>

        <div className="table-wrap scroll">
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th style={{ width: 160 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <div className="empty-state">Carregando cadastros…</div>
                  </td>
                </tr>
              )}

              {!loading && loadError && (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <div className="empty-state">
                      <div className="big">⚠️</div>
                      Não foi possível carregar do Supabase.
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !loadError && filtrados.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <div className="empty-state">
                      <div className="big">📋</div>
                      {items.length === 0
                        ? 'Nenhum cadastro ainda. Adicione o primeiro acima.'
                        : 'Nenhum cadastro corresponde à busca.'}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !loadError &&
                filtrados.map((it) => (
                  <tr key={it.id}>
                    {columns.map((c) => (
                      <td key={c.key} className={c.className}>
                        {c.format ? c.format(it[c.key]) : it[c.key]}
                      </td>
                    ))}
                    <td>
                      <div className="list-actions">
                        <button className="icon-btn edit" onClick={() => startEdit(it)}>
                          Editar
                        </button>
                        <button className="icon-btn del" onClick={() => handleDelete(it)} disabled={saving}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

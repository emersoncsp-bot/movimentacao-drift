import { supabase, supabaseConfigured } from './supabaseClient.js'
import { parseNum } from './utils.js'

function assertConfigured() {
  if (!supabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }
}

/* ===========================================================
   DRIFTS  (tabela: drifts)
   =========================================================== */
export async function listDrifts() {
  assertConfigured()
  const { data, error } = await supabase
    .from('drifts')
    .select('*')
    .order('ec', { ascending: true })
  if (error) throw error
  return data
}

export async function createDrift({ ec, diametro }) {
  assertConfigured()
  const { data, error } = await supabase
    .from('drifts')
    .insert({ ec: ec.trim(), diametro: parseNum(diametro) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDrift(id, { ec, diametro }) {
  assertConfigured()
  const { data, error } = await supabase
    .from('drifts')
    .update({ ec: ec.trim(), diametro: parseNum(diametro) })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDrift(id) {
  assertConfigured()
  const { error } = await supabase.from('drifts').delete().eq('id', id)
  if (error) throw error
}

/* ===========================================================
   RESPONSÁVEIS  (tabela: responsaveis)
   =========================================================== */
export async function listResponsaveis() {
  assertConfigured()
  const { data, error } = await supabase
    .from('responsaveis')
    .select('*')
    .order('nome', { ascending: true })
  if (error) throw error
  return data
}

export async function createResponsavel({ pn, nome }) {
  assertConfigured()
  const { data, error } = await supabase
    .from('responsaveis')
    .insert({ pn, nome })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateResponsavel(id, { pn, nome }) {
  assertConfigured()
  const { data, error } = await supabase
    .from('responsaveis')
    .update({ pn, nome })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteResponsavel(id) {
  assertConfigured()
  const { error } = await supabase.from('responsaveis').delete().eq('id', id)
  if (error) throw error
}

/* ===========================================================
   MOVIMENTAÇÕES  (tabela: movimentacoes)
   =========================================================== */
function toUI(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    ec: row.ec,
    diametro: row.diametro,
    ordemProducao: row.ordem_producao || '',
    medicoes: {
      pe: [row.pe_1, row.pe_2, row.pe_3],
      centro: [row.centro_1, row.centro_2, row.centro_3],
      ponta: [row.ponta_1, row.ponta_2, row.ponta_3],
    },
    valorMedio: row.valor_medio,
    valorMin: row.valor_min,
    valorMax: row.valor_max,
    responsavelPN: row.responsavel_pn,
    responsavelNome: row.responsavel_nome,
    dataHora: row.data_hora,
  }
}

export async function listMovimentacoes(tipo) {
  assertConfigured()
  const { data, error } = await supabase
    .from('movimentacoes')
    .select('*')
    .eq('tipo', tipo)
    .order('data_hora', { ascending: false })
  if (error) throw error
  return data.map(toUI)
}

export async function createMovimentacao(reg) {
  assertConfigured()
  const m = reg.medicoes
  const row = {
    tipo: reg.tipo,
    ec: reg.ec,
    diametro: parseNum(reg.diametro),
    ordem_producao: reg.ordemProducao || null,
    pe_1: parseNum(m.pe[0]),
    pe_2: parseNum(m.pe[1]),
    pe_3: parseNum(m.pe[2]),
    centro_1: parseNum(m.centro[0]),
    centro_2: parseNum(m.centro[1]),
    centro_3: parseNum(m.centro[2]),
    ponta_1: parseNum(m.ponta[0]),
    ponta_2: parseNum(m.ponta[1]),
    ponta_3: parseNum(m.ponta[2]),
    valor_medio: parseNum(reg.valorMedio),
    valor_min: parseNum(reg.valorMin),
    valor_max: parseNum(reg.valorMax),
    responsavel_pn: reg.responsavelPN,
    responsavel_nome: reg.responsavelNome,
    data_hora: reg.dataHora,
  }
  const { data, error } = await supabase
    .from('movimentacoes')
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return toUI(data)
}

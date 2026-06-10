import { supabase } from './supabaseClient.js'

/* ===========================================================
   DRIFTS  (tabela: drifts)
   =========================================================== */
export async function listDrifts() {
  const { data, error } = await supabase
    .from('drifts')
    .select('*')
    .order('ec', { ascending: true })
  if (error) throw error
  return data
}

export async function createDrift({ ec, diametro }) {
  const { data, error } = await supabase
    .from('drifts')
    .insert({ ec, diametro })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDrift(id, { ec, diametro }) {
  const { data, error } = await supabase
    .from('drifts')
    .update({ ec, diametro })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDrift(id) {
  const { error } = await supabase.from('drifts').delete().eq('id', id)
  if (error) throw error
}

/* ===========================================================
   RESPONSÁVEIS  (tabela: responsaveis)
   =========================================================== */
export async function listResponsaveis() {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('*')
    .order('nome', { ascending: true })
  if (error) throw error
  return data
}

export async function createResponsavel({ pn, nome }) {
  const { data, error } = await supabase
    .from('responsaveis')
    .insert({ pn, nome })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateResponsavel(id, { pn, nome }) {
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
  const { error } = await supabase.from('responsaveis').delete().eq('id', id)
  if (error) throw error
}

/* ===========================================================
   MOVIMENTAÇÕES  (tabela: movimentacoes)
   Uma única tabela com a coluna `tipo` = 'saida' | 'entrada'.
   =========================================================== */

// Converte uma linha do banco (snake_case) para o formato usado na interface.
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
  const { data, error } = await supabase
    .from('movimentacoes')
    .select('*')
    .eq('tipo', tipo)
    .order('data_hora', { ascending: false })
  if (error) throw error
  return data.map(toUI)
}

export async function createMovimentacao(reg) {
  const m = reg.medicoes
  const row = {
    tipo: reg.tipo,
    ec: reg.ec,
    diametro: reg.diametro,
    ordem_producao: reg.ordemProducao || null,
    pe_1: Number(m.pe[0]),
    pe_2: Number(m.pe[1]),
    pe_3: Number(m.pe[2]),
    centro_1: Number(m.centro[0]),
    centro_2: Number(m.centro[1]),
    centro_3: Number(m.centro[2]),
    ponta_1: Number(m.ponta[0]),
    ponta_2: Number(m.ponta[1]),
    ponta_3: Number(m.ponta[2]),
    valor_medio: reg.valorMedio,
    valor_min: reg.valorMin,
    valor_max: reg.valorMax,
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

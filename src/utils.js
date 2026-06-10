// Formata um ISO string / Date para "DD/MM/AAAA, HH:MM"
export function formatDateTime(iso) {
  const d = iso ? new Date(iso) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const data = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return `${data}, ${hora}`
}

// Retorna apenas a data (YYYY-MM-DD) de um ISO, para comparação com <input type="date">
export function isoDateOnly(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Calcula a média de um array de strings/numbers, ignorando vazios.
// Retorna { value, count, all } onde all = true se houver 9 valores válidos.
export function average(values, expected = 9) {
  const nums = values
    .map((v) => (v === '' || v === null || v === undefined ? NaN : Number(v)))
    .filter((n) => !Number.isNaN(n))
  if (nums.length === 0) return { value: null, count: 0, all: false }
  const sum = nums.reduce((a, b) => a + b, 0)
  return {
    value: sum / nums.length,
    count: nums.length,
    all: nums.length === expected,
  }
}

export function fmtNum(n, digits = 3) {
  if (n === null || n === undefined || n === '') return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

// Converte string para número aceitando vírgula (pt-BR) ou ponto como decimal.
// Retorna null se o valor for vazio ou inválido.
export function parseNum(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isNaN(v) ? null : v
  const s = String(v).trim().replace(',', '.')
  const n = parseFloat(s)
  return Number.isNaN(n) ? null : n
}

export function minMax(values) {
  const nums = values
    .map((v) => (v === '' || v === null || v === undefined ? NaN : Number(v)))
    .filter((n) => !Number.isNaN(n))
  if (nums.length === 0) return { min: null, max: null }
  return { min: Math.min(...nums), max: Math.max(...nums) }
}

// Flat list das 9 medições a partir do objeto medicoes {pe, centro, ponta}
export function flatMedicoes(med) {
  if (!med) return []
  return [...(med.pe || []), ...(med.centro || []), ...(med.ponta || [])]
}

// Atalho para 2 casas decimais — usado nos campos mín / méd / máx
export function fmtNum2(n) {
  if (n == null || n === '') return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const MESI = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre',
]

export const CAT_PALETTE = [
  '#1B4FFF','#FF6B35','#22C55E','#A855F7','#F59E0B',
  '#EC4899','#14B8A6','#EF4444','#6366F1','#84CC16',
  '#0EA5E9','#FB923C','#10B981','#8B5CF6','#EAB308',
]

export function todayMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function todayDay() {
  return new Date().getDate()
}

export function monthLabel(ym) {
  const [y, m] = ym.split('-')
  return `${MESI[parseInt(m) - 1]} ${y}`
}

export function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

export function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

export function monthsInPeriod(ym, viewMode) {
  const [y, m] = ym.split('-').map(Number)
  if (viewMode === 'quarter') {
    const qStart = Math.floor((m - 1) / 3) * 3 + 1
    return [0, 1, 2].map(i => `${y}-${String(qStart + i).padStart(2, '0')}`)
  }
  if (viewMode === 'year') {
    return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`)
  }
  return [ym]
}

export function periodLabel(ym, viewMode) {
  const [y, m] = ym.split('-').map(Number)
  if (viewMode === 'quarter') {
    const qStart = Math.floor((m - 1) / 3) * 3
    return `${MESI[qStart]} - ${MESI[qStart + 2]} ${y}`
  }
  if (viewMode === 'year') return `${y}`
  return monthLabel(ym)
}

export function prevPeriod(ym, viewMode) {
  const steps = viewMode === 'quarter' ? 3 : viewMode === 'year' ? 12 : 1
  let cur = ym
  for (let i = 0; i < steps; i++) cur = prevMonth(cur)
  return cur
}

export function nextPeriod(ym, viewMode) {
  const steps = viewMode === 'quarter' ? 3 : viewMode === 'year' ? 12 : 1
  let cur = ym
  for (let i = 0; i < steps; i++) cur = nextMonth(cur)
  return cur
}

export function fmt(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n ?? 0)
}

export function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function isDarkMode() {
  const t = document.documentElement.getAttribute('data-theme')
  if (t === 'dark') return true
  if (t === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

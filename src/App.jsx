import { useState, useEffect, useCallback } from 'react'
import { SunMedium, Moon, CircleDot, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import { todayMonth, fmt, CAT_PALETTE, monthsInPeriod, periodLabel, prevPeriod, nextPeriod } from './lib/utils'
import AuthPage from './components/AuthPage'
import AddExpenseForm from './components/AddExpenseForm'
import MonthNav from './components/MonthNav'
import ViewModeToggle from './components/ViewModeToggle'
import BudgetCard from './components/BudgetCard'
import TotalCard from './components/TotalCard'
import DetailModal from './components/DetailModal'
import ConfirmDialog from './components/ConfirmDialog'
import ExportModal from './components/ExportModal'
import Toast from './components/Toast'
import EmptyState from './components/EmptyState'

export default function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Data
  const [expenses, setExpenses] = useState([])        // for displayMonth
  const [categories, setCategories] = useState([])    // all user categories
  const [usedCategoryNames, setUsedCategoryNames] = useState(new Set()) // categories with >=1 expense
  const [budget, setBudget] = useState(null)          // number or null
  const [budgetIsGlobal, setBudgetIsGlobal] = useState(false)
  const [recurring, setRecurring] = useState([])      // recurring templates

  // UI
  const [displayMonth, setDisplayMonth] = useState(todayMonth())
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('spese_viewmode') ?? 'month')
  const [theme, setTheme] = useState(() => localStorage.getItem('spese_theme') ?? 'system')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [confirmExp, setConfirmExp] = useState(null)
  const [exportState, setExportState] = useState(null) // { title, content }
  const [toast, setToast] = useState('')

  // ── AUTH ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── THEME ─────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.setAttribute('data-theme', 'dark')
    else if (theme === 'light') root.setAttribute('data-theme', 'light')
    else root.removeAttribute('data-theme')
    localStorage.setItem('spese_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('spese_viewmode', viewMode)
  }, [viewMode])

  function cycleTheme() {
    setTheme(t => ({ system: 'light', light: 'dark', dark: 'system' }[t] ?? 'system'))
  }

  const ThemeIcon = { system: CircleDot, light: SunMedium, dark: Moon }[theme] ?? CircleDot

  function greeting() {
    const h = new Date().getHours()
    if (h < 6) return 'Buonanotte'
    if (h < 12) return 'Buongiorno'
    if (h < 18) return 'Buon pomeriggio'
    return 'Buonasera'
  }

  // ── LOAD DATA ─────────────────────────────────────────────────────
  const loadAll = useCallback(async (uid, months) => {
    setLoading(true)
    await Promise.all([
      loadExpenses(uid, months),
      loadCategories(uid),
      loadUsedCategories(uid),
      loadBudget(uid, months[0]),
      loadRecurring(uid),
    ])
    setLoading(false)
  }, [])

  const periodMonths = monthsInPeriod(displayMonth, viewMode)

  useEffect(() => {
    if (!user) return
    loadAll(user.id, periodMonths)
  }, [user, displayMonth, viewMode, loadAll])

  // After recurring loads, init each month in the period if needed
  useEffect(() => {
    if (!user || !recurring.length) return
    ;(async () => {
      for (const m of periodMonths) await initMonthRecurring(user.id, m)
    })()
  }, [user, displayMonth, viewMode, recurring])

  async function loadExpenses(uid, months) {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', uid)
      .in('month', months)
      .order('day', { ascending: false })
    setExpenses(data ?? [])
  }

  async function loadCategories(uid) {
    const { data } = await supabase
      .from('categories')
      .select('name, color')
      .eq('user_id', uid)
      .order('name')
    setCategories(data ?? [])
  }

  async function loadUsedCategories(uid) {
    const { data } = await supabase
      .from('expenses')
      .select('category')
      .eq('user_id', uid)
    setUsedCategoryNames(new Set((data ?? []).map(e => e.category)))
  }

  async function loadBudget(uid, month) {
    const { data: specific } = await supabase
      .from('budgets').select('amount')
      .eq('user_id', uid).eq('month', month).maybeSingle()
    if (specific) {
      setBudget(specific.amount)
      setBudgetIsGlobal(false)
      return
    }
    const { data: global } = await supabase
      .from('budgets').select('amount')
      .eq('user_id', uid).eq('month', '__global__').maybeSingle()
    setBudget(global?.amount ?? null)
    setBudgetIsGlobal(!!global)
  }

  async function loadRecurring(uid) {
    const { data } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('user_id', uid)
    setRecurring(data ?? [])
  }

  // ── RECURRING INIT ────────────────────────────────────────────────
  async function initMonthRecurring(uid, month) {
    // Check if this month was already initialized
    const { data: existing } = await supabase
      .from('initialized_months')
      .select('id')
      .eq('user_id', uid)
      .eq('month', month)
      .maybeSingle()
    if (existing) return

    const templates = recurring
    if (!templates.length) {
      await supabase.from('initialized_months').insert({ user_id: uid, month })
      return
    }

    const today = new Date()
    const [y, m] = month.split('-').map(Number)
    const isCurrent = y === today.getFullYear() && m === today.getMonth() + 1
    const day = isCurrent ? today.getDate() : 1

    const newExpenses = templates.map(t => ({
      user_id: uid, name: t.name, amount: t.amount, category: t.category,
      note: t.note ?? '', month, day, recurring: true, recurring_id: t.id,
    }))

    const { data: inserted } = await supabase.from('expenses').insert(newExpenses).select()
    await supabase.from('initialized_months').insert({ user_id: uid, month })

    // ensure categories exist for recurring
    for (const t of templates) await ensureCategory(uid, t.category)

    if (inserted?.length) setExpenses(prev => [...prev, ...inserted])
  }

  // ── CATEGORY HELPERS ──────────────────────────────────────────────
  async function ensureCategory(uid, name) {
    if (!name) return
    const exists = categories.find(c => c.name === name)
    if (exists) return exists.color
    const color = CAT_PALETTE[categories.length % CAT_PALETTE.length]
    await supabase.from('categories').upsert({ user_id: uid, name, color }, { onConflict: 'user_id,name' })
    setCategories(prev => [...prev, { name, color }].sort((a, b) => a.name.localeCompare(b.name)))
    return color
  }

  // ── ADD / EDIT EXPENSE ────────────────────────────────────────────
  async function handleExpenseSubmit({ name, amount, category, note, month: expMonth, recurring: isRecurring }) {
    const uid = user.id
    await ensureCategory(uid, category)

    const today = new Date()
    const [y, m] = expMonth.split('-').map(Number)
    const isCurrent = y === today.getFullYear() && m === today.getMonth() + 1
    const day = isCurrent ? today.getDate() : 1

    if (editingExpense) {
      // Update existing
      const old = editingExpense
      let recurringId = old.recurring_id

      // Manage recurring template
      if (old.recurring && old.recurring_id) {
        if (isRecurring) {
          await supabase.from('recurring_templates')
            .update({ name, amount, category, note })
            .eq('id', old.recurring_id)
        } else {
          await supabase.from('recurring_templates').delete().eq('id', old.recurring_id)
          recurringId = null
        }
      } else if (isRecurring && !old.recurring) {
        const { data: tmpl } = await supabase.from('recurring_templates')
          .insert({ user_id: uid, name, amount, category, note }).select().single()
        recurringId = tmpl?.id ?? null
      }

      const { data: updated } = await supabase.from('expenses')
        .update({ name, amount, category, note, month: expMonth, recurring: isRecurring, recurring_id: recurringId })
        .eq('id', old.id).select().single()

      if (updated) {
        setExpenses(prev => {
          const filtered = prev.filter(e => e.id !== old.id)
          return periodMonths.includes(expMonth) ? [...filtered, updated] : filtered
        })
      }
      setEditingExpense(null)
      showToast('Spesa aggiornata')
      loadUsedCategories(uid)
    } else {
      // Insert new
      let recurringId = null
      if (isRecurring) {
        const { data: tmpl } = await supabase.from('recurring_templates')
          .insert({ user_id: uid, name, amount, category, note }).select().single()
        recurringId = tmpl?.id ?? null
      }

      const { data: inserted } = await supabase.from('expenses')
        .insert({ user_id: uid, name, amount, category, note, month: expMonth, day, recurring: isRecurring, recurring_id: recurringId })
        .select().single()

      if (inserted && periodMonths.includes(expMonth)) {
        setExpenses(prev => [inserted, ...prev])
      }
      showToast('Spesa aggiunta')
      loadUsedCategories(uid)
    }
  }

  // ── DELETE EXPENSE ────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmExp) return
    await supabase.from('expenses').delete().eq('id', confirmExp.id)
    setExpenses(prev => prev.filter(e => e.id !== confirmExp.id))
    setConfirmExp(null)
    showToast('Spesa eliminata')
    loadUsedCategories(user.id)
  }

  // ── BUDGET ────────────────────────────────────────────────────────
  async function handleBudgetSave(amount, isGlobal) {
    const uid = user.id
    if (isGlobal) {
      await supabase.from('budgets')
        .upsert({ user_id: uid, month: '__global__', amount }, { onConflict: 'user_id,month' })
      // Rimuovi eventuale override mensile
      await supabase.from('budgets').delete().eq('user_id', uid).eq('month', displayMonth)
      setBudgetIsGlobal(true)
    } else {
      await supabase.from('budgets')
        .upsert({ user_id: uid, month: displayMonth, amount }, { onConflict: 'user_id,month' })
      setBudgetIsGlobal(false)
    }
    setBudget(amount)
    showToast('Budget salvato')
  }

  async function handleBudgetDelete() {
    const uid = user.id
    if (budgetIsGlobal) {
      await supabase.from('budgets').delete().eq('user_id', uid).eq('month', '__global__')
      setBudget(null)
      setBudgetIsGlobal(false)
    } else {
      await supabase.from('budgets').delete().eq('user_id', uid).eq('month', displayMonth)
      // Verifica se esiste budget globale come fallback
      const { data: global } = await supabase.from('budgets').select('amount')
        .eq('user_id', uid).eq('month', '__global__').maybeSingle()
      setBudget(global?.amount ?? null)
      setBudgetIsGlobal(!!global)
    }
    showToast('Budget eliminato')
  }

  // ── PERIOD NAVIGATION ─────────────────────────────────────────────
  function goToPrev() { setDisplayMonth(m => prevPeriod(m, viewMode)) }
  function goToNext() { setDisplayMonth(m => nextPeriod(m, viewMode)) }
  function goToToday() { setDisplayMonth(todayMonth()) }
  const isCurrentPeriod = periodMonths.includes(todayMonth())

  // ── EXPORT ────────────────────────────────────────────────────────
  function handleExport() {
    const rows = [['Mese','Giorno','Nome','Categoria','Importo','Nota','Ricorrente']]
    expenses.forEach(e => rows.push([e.month, e.day ?? 1, e.name, e.category, e.amount, e.note ?? '', e.recurring ? 'Si' : 'No']))
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    setExportState({ title: `CSV – ${periodLabel(displayMonth, viewMode)}`, content: csv })
  }

  // ── TOAST ─────────────────────────────────────────────────────────
  function showToast(msg) { setToast(msg) }

  // ── COMPUTED ──────────────────────────────────────────────────────
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const catColorMap = Object.fromEntries(categories.map(c => [c.name, c.color]))
  const catTotals = {}
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] ?? 0) + Number(e.amount) })
  const totalSegments = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({ cat, amt, color: catColorMap[cat] ?? '#888' }))

  // ── RENDER ────────────────────────────────────────────────────────
  if (!authReady) return null

  if (!user) return <AuthPage />

  return (
    <>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 1rem', paddingBottom: '3rem' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0 1.25rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.03em' }}>
              spese<span style={{
                background: 'var(--grad-accent)', WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>.</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '0.1rem' }}>
              {greeting()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <HeaderBtn onClick={cycleTheme} aria-label="Cambia tema" title="Cambia tema"><ThemeIcon size={16} strokeWidth={2} /></HeaderBtn>
            <HeaderBtn onClick={() => supabase.auth.signOut()} aria-label="Esci" title="Esci"><LogOut size={16} strokeWidth={2} /></HeaderBtn>
          </div>
        </header>

        {/* Form */}
        <div className="rise-in" style={{ '--rise-delay': '0s' }}>
          <AddExpenseForm
            categories={categories.filter(c => usedCategoryNames.has(c.name))}
            onSubmit={handleExpenseSubmit}
            editingExpense={editingExpense}
            onCancelEdit={() => setEditingExpense(null)}
          />
        </div>

        {/* View mode + period nav */}
        <div className="rise-in" style={{ '--rise-delay': '0.05s' }}>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <MonthNav label={periodLabel(displayMonth, viewMode)} onPrev={goToPrev} onNext={goToNext} onToday={goToToday} isCurrent={isCurrentPeriod} />
        </div>

        {loading && !expenses.length ? (
          <>
            <div className="skeleton" style={{ height: 92, marginBottom: '0.75rem' }} />
            <div className="skeleton" style={{ height: 92 }} />
          </>
        ) : (
          <>
            {/* Budget (solo vista mensile) */}
            {viewMode === 'month' && (
              <div className="rise-in" style={{ '--rise-delay': '0.1s' }}>
                <BudgetCard budget={budget} spent={total} isGlobal={budgetIsGlobal} onSave={handleBudgetSave} onDelete={handleBudgetDelete} />
              </div>
            )}

            {/* Total / empty state */}
            <div className="rise-in" style={{ '--rise-delay': '0.15s' }}>
              {expenses.length === 0 ? (
                <EmptyState />
              ) : (
                <TotalCard total={total} count={expenses.length} segments={totalSegments} onClick={() => setModalOpen(true)} viewMode={viewMode} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      <DetailModal
        open={modalOpen}
        periodLabel={periodLabel(displayMonth, viewMode)}
        expenses={expenses}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onEdit={exp => { setEditingExpense(exp); setModalOpen(false) }}
        onDelete={exp => { setConfirmExp(exp); setModalOpen(false) }}
        onExport={handleExport}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!confirmExp}
        title="Elimina spesa"
        text={confirmExp ? `Eliminare "${confirmExp.name}"?` : ''}
        onConfirm={handleDelete}
        onCancel={() => setConfirmExp(null)}
      />

      {/* Export modal */}
      <ExportModal
        open={!!exportState}
        title={exportState?.title ?? ''}
        content={exportState?.content ?? ''}
        onClose={() => setExportState(null)}
      />

      {/* Toast */}
      <Toast message={toast} onDone={() => setToast('')} />
    </>
  )
}

function HeaderBtn({ children, ...props }) {
  return (
    <button {...props} style={{
      width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)',
      border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'var(--text-2)', fontSize: '0.875rem',
      boxShadow: 'var(--sh)', cursor: 'pointer', fontFamily: 'inherit',
      transition: 'background 0.15s, color 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-2)' }}
    >
      {children}
    </button>
  )
}

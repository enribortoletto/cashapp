import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { todayMonth, todayDay, prevMonth, nextMonth, fmt, CAT_PALETTE, monthLabel } from './lib/utils'
import AuthPage from './components/AuthPage'
import AddExpenseForm from './components/AddExpenseForm'
import MonthNav from './components/MonthNav'
import BudgetCard from './components/BudgetCard'
import TotalCard from './components/TotalCard'
import DetailModal from './components/DetailModal'
import ConfirmDialog from './components/ConfirmDialog'
import ExportModal from './components/ExportModal'
import Toast from './components/Toast'

export default function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Data
  const [expenses, setExpenses] = useState([])        // for displayMonth
  const [categories, setCategories] = useState([])    // all user categories
  const [budget, setBudget] = useState(null)          // number or null
  const [budgetIsGlobal, setBudgetIsGlobal] = useState(false)
  const [recurring, setRecurring] = useState([])      // recurring templates

  // UI
  const [displayMonth, setDisplayMonth] = useState(todayMonth())
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

  function cycleTheme() {
    setTheme(t => ({ system: 'light', light: 'dark', dark: 'system' }[t] ?? 'system'))
  }

  const themeIcon = { system: '◑', light: '☀', dark: '☾' }[theme] ?? '◑'

  // ── LOAD DATA ─────────────────────────────────────────────────────
  const loadAll = useCallback(async (uid, month) => {
    setLoading(true)
    await Promise.all([
      loadExpenses(uid, month),
      loadCategories(uid),
      loadBudget(uid, month),
      loadRecurring(uid),
    ])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    loadAll(user.id, displayMonth)
  }, [user, displayMonth, loadAll])

  // After recurring loads, init the month if needed
  useEffect(() => {
    if (!user || !recurring.length) return
    initMonthRecurring(user.id, displayMonth)
  }, [user, displayMonth, recurring])

  async function loadExpenses(uid, month) {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', uid)
      .eq('month', month)
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
          return expMonth === displayMonth ? [...filtered, updated] : filtered
        })
      }
      setEditingExpense(null)
      showToast('Spesa aggiornata')
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

      if (inserted && expMonth === displayMonth) {
        setExpenses(prev => [inserted, ...prev])
      }
      showToast('Spesa aggiunta')
    }
  }

  // ── DELETE EXPENSE ────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmExp) return
    await supabase.from('expenses').delete().eq('id', confirmExp.id)
    setExpenses(prev => prev.filter(e => e.id !== confirmExp.id))
    setConfirmExp(null)
    showToast('Spesa eliminata')
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

  // ── MONTH NAVIGATION ──────────────────────────────────────────────
  function goToPrev() { setDisplayMonth(m => prevMonth(m)) }
  function goToNext() { setDisplayMonth(m => nextMonth(m)) }

  // ── EXPORT ────────────────────────────────────────────────────────
  function handleExport(type) {
    if (type === 'csv') {
      const rows = [['Giorno','Nome','Categoria','Importo','Nota','Ricorrente']]
      expenses.forEach(e => rows.push([e.day ?? 1, e.name, e.category, e.amount, e.note ?? '', e.recurring ? 'Si' : 'No']))
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
      setExportState({ title: `CSV – ${monthLabel(displayMonth)}`, content: csv })
    } else {
      setExportState({ title: `JSON – ${monthLabel(displayMonth)}`, content: JSON.stringify(expenses, null, 2) })
    }
  }

  // ── TOAST ─────────────────────────────────────────────────────────
  function showToast(msg) { setToast(msg) }

  // ── COMPUTED ──────────────────────────────────────────────────────
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  // ── RENDER ────────────────────────────────────────────────────────
  if (!authReady) return null

  if (!user) return <AuthPage />

  return (
    <>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 1rem', paddingBottom: '3rem' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0 1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.03em' }}>
            spese<span style={{ color: 'var(--accent)' }}>.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <HeaderBtn onClick={cycleTheme} aria-label="Cambia tema" title="Cambia tema">{themeIcon}</HeaderBtn>
            <HeaderBtn onClick={() => supabase.auth.signOut()} aria-label="Esci" title="Esci">⎋</HeaderBtn>
          </div>
        </header>

        {/* Form */}
        <AddExpenseForm
          categories={categories}
          onSubmit={handleExpenseSubmit}
          editingExpense={editingExpense}
          onCancelEdit={() => setEditingExpense(null)}
        />

        {/* Month nav */}
        <MonthNav month={displayMonth} onPrev={goToPrev} onNext={goToNext} />

        {/* Budget */}
        <BudgetCard budget={budget} spent={total} isGlobal={budgetIsGlobal} onSave={handleBudgetSave} onDelete={handleBudgetDelete} />

        {/* Total */}
        <TotalCard total={total} count={expenses.length} onClick={() => setModalOpen(true)} />
      </div>

      {/* Detail modal */}
      <DetailModal
        open={modalOpen}
        month={displayMonth}
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

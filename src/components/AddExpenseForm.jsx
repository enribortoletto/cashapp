import { useState, useEffect } from 'react'
import { todayMonth } from '../lib/utils'

export default function AddExpenseForm({ categories, onSubmit, editingExpense, onCancelEdit }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [month, setMonth] = useState(todayMonth())
  const [recurring, setRecurring] = useState(false)

  useEffect(() => {
    if (editingExpense) {
      setName(editingExpense.name)
      setAmount(String(editingExpense.amount))
      setCategory(editingExpense.category)
      setNote(editingExpense.note ?? '')
      setMonth(editingExpense.month)
      setRecurring(editingExpense.recurring ?? false)
    } else {
      reset()
    }
  }, [editingExpense])

  function reset() {
    setName(''); setAmount(''); setCategory(''); setNote('')
    setMonth(todayMonth()); setRecurring(false)
  }

  function handleSubmit() {
    if (!name.trim()) return
    const n = parseFloat(amount)
    if (!amount || isNaN(n) || n <= 0) return
    if (!category.trim()) return
    onSubmit({ name: name.trim(), amount: n, category: category.trim(), note: note.trim(), month, recurring })
    if (!editingExpense) reset()
  }

  const isEditing = !!editingExpense

  return (
    <div className="card p-4 mb-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Row 1: name + amount */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.625rem' }}>
        <Field label="Nome spesa">
          <input className="input-base" type="text" placeholder="Es. Cena, Netflix…"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete="off" />
        </Field>
        <Field label="Importo">
          <div className="amount-wrap">
            <span className="amount-prefix">€</span>
            <input className="input-base" type="number" placeholder="0,00" min="0" step="0.01"
              inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </Field>
      </div>

      {/* Row 2: category + note */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
        <Field label="Categoria">
          <input className="input-base" type="text" list="cat-datalist"
            placeholder="Seleziona o nuova…" value={category}
            onChange={e => setCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete="off" />
          <datalist id="cat-datalist">
            {categories.map(c => <option key={c.name} value={c.name} />)}
          </datalist>
        </Field>
        <Field label="Nota">
          <input className="input-base" type="text" placeholder="Opzionale"
            value={note} onChange={e => setNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete="off" />
        </Field>
      </div>

      {/* Row 3: month + recurring */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.625rem' }}>
        <Field label="Mese" style={{ flex: 1 }}>
          <input className="input-base" type="month" value={month} onChange={e => setMonth(e.target.value)} />
        </Field>
        <div style={{ paddingTop: '1.125rem', flexShrink: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <div className="toggle-wrap">
              <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
              <div className="toggle-track" />
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', userSelect: 'none' }}>Ricorrente</span>
          </label>
        </div>
      </div>

      {/* Buttons */}
      {isEditing ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary success" onClick={handleSubmit} style={{ flex: 1 }}>
            ✓ Salva modifiche
          </button>
          <button onClick={onCancelEdit} style={{
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.875rem', fontWeight: 600,
          }}>
            Annulla
          </button>
        </div>
      ) : (
        <button className="btn-primary" onClick={handleSubmit}>+ Aggiungi spesa</button>
      )}
    </div>
  )
}

function Field({ label, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', ...style }}>
      <label className="label-eyebrow">{label}</label>
      {children}
    </div>
  )
}

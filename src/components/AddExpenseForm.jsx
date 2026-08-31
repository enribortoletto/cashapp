import { useState, useEffect, useRef } from 'react'
import { todayMonth } from '../lib/utils'
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete'

export default function AddExpenseForm({ categories, onSubmit, editingExpense, onCancelEdit }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [month, setMonth] = useState(todayMonth())
  const [recurring, setRecurring] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapperRef = useRef(null)

  const { suggestions, search, clear } = usePlacesAutocomplete()

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

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) clear()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [clear])

  function reset() {
    setName(''); setAmount(''); setCategory(''); setNote('')
    setMonth(todayMonth()); setRecurring(false); clear()
  }

  function handleNameChange(e) {
    const val = e.target.value
    setName(val)
    setActiveIdx(-1)
    search(val)
  }

  function selectSuggestion(pred) {
    const placeName = pred.placePrediction?.mainText?.text
      ?? pred.placePrediction?.text?.text
      ?? pred.description
    setName(placeName)
    clear()
  }

  function handleNameKeyDown(e) {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIdx])
    } else if (e.key === 'Escape') {
      clear()
    }
  }

  function handleSubmit() {
    if (!name.trim() || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !category.trim()) return
    onSubmit({ name: name.trim(), amount: parseFloat(amount), category: category.trim(), note: note.trim(), month, recurring })
    if (!editingExpense) reset()
  }

  const isEditing = !!editingExpense

  return (
    <div className="card p-4 mb-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

      {/* Row 1: name (with autocomplete) + amount */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.625rem', alignItems: 'start' }}>
        {/* Name with Places dropdown */}
        <Field label="Nome spesa">
          <div style={{ position: 'relative' }} ref={wrapperRef}>
            <input
              className="input-base"
              type="text"
              placeholder="Es. Cena, Netflix…"
              value={name}
              onChange={handleNameChange}
              onKeyDown={e => { handleNameKeyDown(e); if (e.key === 'Enter' && activeIdx < 0) handleSubmit() }}
              autoComplete="off"
              style={{ paddingRight: name ? '2rem' : undefined }}
            />
            {name && (
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); setName(''); clear() }}
                style={{
                  position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                  width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                  background: 'var(--text-2)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--surface)', fontSize: '0.625rem', fontWeight: 700,
                  lineHeight: 1, padding: 0, opacity: 0.6, transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                tabIndex={-1}
                aria-label="Cancella"
              >✕</button>
            )}
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', boxShadow: 'var(--sh-lg)',
                zIndex: 50, overflow: 'hidden',
              }}>
                {suggestions.map((pred, i) => {
                  const main = pred.placePrediction?.mainText?.text
                    ?? pred.placePrediction?.text?.text
                    ?? pred.description
                  const sub = pred.placePrediction?.secondaryText?.text ?? ''
                  const isActive = i === activeIdx
                  return (
                    <div
                      key={pred.place_id}
                      onMouseDown={() => selectSuggestion(pred)}
                      onMouseEnter={() => setActiveIdx(i)}
                      style={{
                        padding: '0.5rem 0.75rem', cursor: 'pointer',
                        background: isActive ? 'var(--accent-bg)' : 'transparent',
                        borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {main}
                      </div>
                      {sub && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                          {sub}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
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
          <button className="btn-primary success" onClick={handleSubmit} style={{ flex: 1 }}>✓ Salva modifiche</button>
          <button onClick={onCancelEdit} style={{
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600,
          }}>Annulla</button>
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

import { useState } from 'react'
import { fmt } from '../lib/utils'

export default function BudgetCard({ budget, spent, isGlobal, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [globalToggle, setGlobalToggle] = useState(false)

  function openEdit() {
    setValue(budget != null ? String(budget) : '')
    setGlobalToggle(isGlobal ?? false)
    setEditing(true)
  }
  function save() {
    const n = parseFloat(value)
    if (!isNaN(n) && n >= 0) { onSave(n, globalToggle); setEditing(false) }
  }
  function cancel() { setEditing(false) }
  function handleDelete() { onDelete(); setEditing(false) }

  const rem = budget != null ? budget - spent : null
  const pct = budget != null ? Math.min((spent / budget) * 100, 100) : 0
  const cls = rem != null && rem < 0 ? 'danger' : rem != null && rem < budget * 0.2 ? 'warn' : 'good'
  const fillColor = cls === 'danger' ? 'var(--danger)' : cls === 'warn' ? 'var(--warn)' : 'var(--accent)'

  return (
    <div className="card mb-3" style={{ padding: '0.875rem 1.125rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="label-eyebrow">Budget mensile</span>
          {isGlobal && !editing && (
            <span style={{
              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--accent)',
              background: 'var(--accent-bg)', padding: '0.1rem 0.45rem',
              borderRadius: '999px', letterSpacing: '0.01em',
            }}>
              tutti i mesi
            </span>
          )}
        </div>
        <button onClick={openEdit} style={{
          fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600,
          padding: '0.125rem 0.375rem', borderRadius: 'var(--radius-sm)',
          border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {budget != null ? 'Modifica' : 'Imposta'}
        </button>
      </div>

      {editing ? (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="amount-wrap" style={{ flex: 1 }}>
              <span className="amount-prefix">€</span>
              <input className="input-base" type="number" min="0" step="1"
                placeholder="Budget mensile" inputMode="decimal" value={value}
                onChange={e => setValue(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
                style={{ paddingLeft: '1.625rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <button onClick={save} style={{
              fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)',
              padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-bg)', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>Salva</button>
            <button onClick={cancel} style={{
              fontSize: '0.8125rem', color: 'var(--text-2)', padding: '0.5rem',
              border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>Annulla</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.625rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div className="toggle-wrap">
                <input type="checkbox" checked={globalToggle} onChange={e => setGlobalToggle(e.target.checked)} />
                <div className="toggle-track" />
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', userSelect: 'none' }}>Uguale ogni mese</span>
            </label>
            {budget != null && (
              <button onClick={handleDelete} style={{
                fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600,
                padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--danger)', background: 'none',
                cursor: 'pointer', fontFamily: 'inherit', opacity: 0.8,
                transition: 'opacity 0.15s, background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'color-mix(in srgb, var(--danger) 10%, transparent)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.background = 'none' }}
              >
                Elimina budget
              </button>
            )}
          </div>
        </div>
      ) : budget != null ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.25rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.0625rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(spent)}
            </span>
            <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>/</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(budget)}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: `var(--${cls})` }}>
            {rem < 0 ? `${fmt(Math.abs(rem))} in eccesso` : `${fmt(rem)} rimasti`}
          </span>
          <div className="budget-track">
            <div className="budget-fill" style={{ width: `${pct}%`, background: fillColor }} />
          </div>
        </>
      ) : (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>
          Nessun budget impostato per questo mese.
        </p>
      )}
    </div>
  )
}

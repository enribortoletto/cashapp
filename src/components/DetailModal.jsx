import { useEffect, useState } from 'react'
import { X, Pencil, Trash2, RotateCcw, ArrowDownWideNarrow, ArrowDownAZ, Download } from 'lucide-react'
import { fmt, hexAlpha } from '../lib/utils'
import PieChart from './PieChart'

export default function DetailModal({ open, periodLabel, expenses, categories, onClose, onEdit, onDelete, onExport }) {
  const [sortBy, setSortBy] = useState('date') // 'date' | 'category'

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape' && open) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Build chart segments
  const catTotals = {}
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] ?? 0) + Number(e.amount) })
  const total = Object.values(catTotals).reduce((s, v) => s + v, 0)
  const catMap = Object.fromEntries(categories.map(c => [c.name, c.color]))
  const segments = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({ cat, amt, color: catMap[cat] ?? '#888' }))

  const sorted = [...expenses].sort((a, b) => {
    const byInsertion = (b.created_at ?? '').localeCompare(a.created_at ?? '')
    if (sortBy === 'category') {
      return a.category.localeCompare(b.category) || byInsertion
    }
    return byInsertion
  })

  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {periodLabel}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <IconBtn onClick={onExport} title="Esporta CSV" aria-label="Esporta CSV"><Download size={16} strokeWidth={2} /></IconBtn>
            <CloseBtn onClick={onClose} />
          </div>
        </div>

        {/* Chart + breakdown */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          {total > 0 ? (
            <div style={{ position: 'relative', width: 192, height: 192 }}>
              <PieChart segments={segments} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
              }}>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Totale</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(total)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-2)', fontSize: '0.875rem', padding: '1rem 0' }}>
              Nessuna spesa registrata
            </div>
          )}
          {segments.length > 0 && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {segments.map(({ cat, amt, color }) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-2)', minWidth: '2.25rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {total > 0 ? `${Math.round(amt / total * 100)}%` : '–'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 500, minWidth: '5.5rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(amt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense list */}
        <div style={{ padding: '0 1.25rem 1rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 0 0.5rem', borderTop: '1px solid var(--border)',
          }}>
            <span style={{
              fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
              color: 'var(--text-2)',
            }}>Tutte le spese</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <SortBtn active={sortBy === 'date'} onClick={() => setSortBy('date')} title="Ordina per data">
                <ArrowDownWideNarrow size={13} strokeWidth={2} /> Data
              </SortBtn>
              <SortBtn active={sortBy === 'category'} onClick={() => setSortBy('category')} title="Ordina per categoria">
                <ArrowDownAZ size={13} strokeWidth={2} /> Categoria
              </SortBtn>
            </div>
          </div>
          {sorted.length === 0 ? (
            <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-2)', fontSize: '0.875rem' }}>
              Nessuna spesa per questo mese
            </div>
          ) : sorted.map(exp => {
            const color = catMap[exp.category] ?? '#888'
            return (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.name}</div>
                  {exp.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.note}</div>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.6875rem', padding: '0.125rem 0.375rem', borderRadius: 20, fontWeight: 500, background: hexAlpha(color, 0.14), color }}>
                      {exp.category}
                    </span>
                    {exp.recurring && <RotateCcw size={11} strokeWidth={2.5} style={{ color: 'var(--accent)' }} />}
                    {exp.created_at && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-2)' }}>
                        {(() => {
                          const d = new Date(exp.created_at)
                          const w = d.toLocaleDateString('it-IT', { weekday: 'long' })
                          const day = d.toLocaleDateString('it-IT', { day: '2-digit' })
                          return `${w.charAt(0).toUpperCase() + w.slice(1)} ${day}`
                        })()}
                        {' · '}
                        {new Date(exp.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {fmt(exp.amount)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <ActionBtn onClick={() => { onClose(); onEdit(exp) }} title="Modifica"><Pencil size={13} strokeWidth={2} /></ActionBtn>
                    <ActionBtn onClick={() => onDelete(exp)} title="Elimina" danger><Trash2 size={13} strokeWidth={2} /></ActionBtn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function IconBtn({ onClick, title, children, ...props }) {
  return (
    <button onClick={onClick} title={title} {...props} style={{
      width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)',
      color: 'var(--text-2)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      transition: 'background 0.15s, color 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
    >{children}</button>
  )
}

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Chiudi" style={{
      width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)',
      color: 'var(--text-2)', fontSize: '1.125rem', display: 'flex', alignItems: 'center',
      justifyContent: 'center', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
    ><X size={16} strokeWidth={2} /></button>
  )
}

function ActionBtn({ onClick, title, danger, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 26, height: 26, borderRadius: 'var(--radius-sm)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem',
      color: 'var(--text-2)', border: 'none', background: 'none', cursor: 'pointer',
      transition: 'background 0.15s, color 0.15s', fontFamily: 'inherit',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'var(--danger-bg)' : 'var(--surface-2)'
        e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text)'
      }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-2)' }}
    >{children}</button>
  )
}

function SortBtn({ active, onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.6875rem', fontWeight: 600, padding: '0.25rem 0.5rem',
      borderRadius: 999, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
      transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      borderColor: active ? 'var(--accent)' : 'var(--border)',
      background: active ? 'var(--accent-bg)' : 'none',
      color: active ? 'var(--accent)' : 'var(--text-2)',
    }}>
      {children}
    </button>
  )
}

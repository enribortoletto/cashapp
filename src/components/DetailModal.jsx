import { useEffect } from 'react'
import { fmt, hexAlpha, monthLabel } from '../lib/utils'
import PieChart from './PieChart'

export default function DetailModal({ open, month, expenses, categories, onClose, onEdit, onDelete, onExport }) {
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

  const sorted = [...expenses].sort((a, b) => (b.day ?? 1) - (a.day ?? 1) || b.created_at?.localeCompare(a.created_at ?? '') * -1)

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
            {monthLabel(month)}
          </h2>
          <CloseBtn onClick={onClose} />
        </div>

        {/* Chart + breakdown */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          {total > 0 ? <PieChart segments={segments} /> : (
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
            fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'var(--text-2)', padding: '0.875rem 0 0.5rem', borderTop: '1px solid var(--border)',
          }}>Tutte le spese</div>
          {sorted.length === 0 ? (
            <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-2)', fontSize: '0.875rem' }}>
              Nessuna spesa per questo mese
            </div>
          ) : sorted.map(exp => {
            const color = catMap[exp.category] ?? '#888'
            return (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-2)', minWidth: '1.75rem', paddingTop: '0.1rem', fontVariantNumeric: 'tabular-nums' }}>
                  {String(exp.day ?? 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.name}</div>
                  {exp.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.note}</div>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.6875rem', padding: '0.125rem 0.375rem', borderRadius: 20, marginTop: '0.25rem', fontWeight: 500, background: hexAlpha(color, 0.14), color }}>
                    {exp.category}
                  </span>
                  {exp.recurring && <span style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontWeight: 600, marginLeft: '0.25rem' }}>↺</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {fmt(exp.amount)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <ActionBtn onClick={() => { onClose(); onEdit(exp) }} title="Modifica">✎</ActionBtn>
                    <ActionBtn onClick={() => onDelete(exp)} title="Elimina" danger>✕</ActionBtn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Export */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.875rem 1.25rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <ExportBtn onClick={() => onExport('csv')}>Esporta CSV</ExportBtn>
          <ExportBtn onClick={() => onExport('json')}>Esporta JSON</ExportBtn>
        </div>
      </div>
    </div>
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
    >×</button>
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

function ExportBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '0.5rem', background: 'var(--surface-2)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer',
      transition: 'background 0.15s, color 0.15s, border-color 0.15s', fontFamily: 'inherit',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >{children}</button>
  )
}

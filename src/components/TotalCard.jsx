import { useEffect, useRef, useState } from 'react'
import { fmt } from '../lib/utils'
import PieChart from './PieChart'

const LABELS = {
  month: 'Totale del mese',
  quarter: 'Totale del trimestre',
  year: "Totale dell'anno",
}

export default function TotalCard({ total, count, segments = [], onClick, viewMode = 'month' }) {
  const [showTip, setShowTip] = useState(false)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!showTip) return
    function handler(e) { if (chartRef.current && !chartRef.current.contains(e.target)) setShowTip(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showTip])

  const hint = count === 0
    ? 'Nessuna spesa · aggiungine una sopra'
    : `${count} ${count === 1 ? 'spesa' : 'spese'} · Tocca per il dettaglio →`

  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-app)', padding: '1.25rem 1.25rem 1.125rem',
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem',
      boxShadow: 'var(--sh)', cursor: 'pointer', textAlign: 'left',
      transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
      fontFamily: 'inherit',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.boxShadow = 'var(--sh-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.boxShadow = 'var(--sh)' }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.995)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.125rem', flex: 1, minWidth: 0 }}>
        <span className="label-eyebrow">{LABELS[viewMode] ?? LABELS.month}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: 500,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1.1,
          color: 'var(--text)',
        }}>
          {fmt(total)}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '0.25rem' }}>{hint}</span>
      </div>
      {segments.length > 0 && (
        <div
          ref={chartRef}
          style={{ flexShrink: 0, width: 67, height: 67, position: 'relative' }}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onClick={e => { e.stopPropagation(); setShowTip(v => !v) }}
        >
          <PieChart segments={segments} size={67} />
          {showTip && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', boxShadow: 'var(--sh-lg)',
              padding: '0.5rem 0.625rem', minWidth: 150, zIndex: 20,
              display: 'flex', flexDirection: 'column', gap: '0.3rem',
            }}>
              {segments.map(({ cat, amt, color }) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>{cat}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontWeight: 600 }}>
                    {total > 0 ? Math.round(amt / total * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  )
}

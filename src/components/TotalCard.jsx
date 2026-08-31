import { fmt } from '../lib/utils'

export default function TotalCard({ total, count, onClick }) {
  const hint = count === 0
    ? 'Nessuna spesa · aggiungine una sopra'
    : `${count} ${count === 1 ? 'spesa' : 'spese'} · Tocca per il dettaglio →`

  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-app)', padding: '1.25rem 1.25rem 1.125rem',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.125rem',
      boxShadow: 'var(--sh)', cursor: 'pointer', textAlign: 'left',
      transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
      fontFamily: 'inherit',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.boxShadow = 'var(--sh-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.boxShadow = 'var(--sh)' }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.995)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span className="label-eyebrow">Totale del mese</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: 500,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1.1,
        color: 'var(--text)',
      }}>
        {fmt(total)}
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '0.25rem' }}>{hint}</span>
    </button>
  )
}

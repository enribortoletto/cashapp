import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

export default function MonthNav({ label, onPrev, onNext, onToday, isCurrent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
      <NavBtn onClick={onPrev} label="Periodo precedente"><ChevronLeft size={18} strokeWidth={2} /></NavBtn>
      <span style={{
        flex: 1, textAlign: 'center', fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em'
      }}>
        {label}
      </span>
      {!isCurrent && (
        <NavBtn onClick={onToday} label="Vai al periodo corrente"><CalendarDays size={17} strokeWidth={2} /></NavBtn>
      )}
      <NavBtn onClick={onNext} label="Periodo successivo"><ChevronRight size={18} strokeWidth={2} /></NavBtn>
    </div>
  )
}

function NavBtn({ onClick, label, children }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      color: 'var(--text-2)', fontSize: '1.125rem', boxShadow: 'var(--sh)',
      cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s, color 0.15s',
      fontFamily: 'inherit',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-2)' }}
    >
      {children}
    </button>
  )
}

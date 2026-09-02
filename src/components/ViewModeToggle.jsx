const OPTIONS = [
  { value: 'month', label: 'Mese' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Anno' },
]

export default function ViewModeToggle({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--surface-2)', borderRadius: 999,
      padding: 3, gap: 2, marginBottom: '0.625rem',
    }}>
      {OPTIONS.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, padding: '0.4rem 0.5rem', borderRadius: 999, border: 'none',
              fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-2)',
              boxShadow: active ? 'var(--sh)' : 'none',
              transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

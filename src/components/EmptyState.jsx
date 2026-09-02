export default function EmptyState() {
  return (
    <div className="card" style={{
      padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center', gap: '0.75rem',
    }}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="10" y="20" width="52" height="38" rx="8" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M10 30h52" stroke="var(--border)" strokeWidth="1.5" />
        <circle cx="36" cy="44" r="9" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1.5" />
        <path d="M36 40v8M32 44h8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 20v-4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v4" stroke="var(--border)" strokeWidth="1.5" />
      </svg>
      <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Nessuna spesa questo mese</div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', maxWidth: 220 }}>
        Aggiungi la tua prima spesa dal modulo qui sopra per iniziare a tracciarle.
      </div>
    </div>
  )
}

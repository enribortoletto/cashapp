export default function ConfirmDialog({ open, title, text, onConfirm, onCancel }) {
  return (
    <div className={`modal-center${open ? ' open' : ''}`}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-app)',
        padding: '1.5rem', maxWidth: 320, width: '100%', boxShadow: 'var(--sh-lg)',
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>{text}</div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '0.625rem', background: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-2)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Annulla</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '0.625rem', background: 'var(--danger)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Elimina</button>
        </div>
      </div>
    </div>
  )
}

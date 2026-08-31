export default function ExportModal({ open, title, content, onClose }) {
  function copy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content)
    } else {
      const ta = document.getElementById('export-ta')
      ta.select(); document.execCommand('copy')
    }
  }

  return (
    <div className={`modal-center${open ? ' open' : ''}`} style={{ zIndex: 160 }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-app)',
        padding: '1.25rem', maxWidth: 480, width: '100%',
        boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)',
            color: 'var(--text-2)', fontSize: '1.125rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>×</button>
        </div>
        <textarea id="export-ta" readOnly value={content} style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          padding: '0.625rem', height: 200, resize: 'none', width: '100%',
          color: 'var(--text)', overflowX: 'auto', whiteSpace: 'pre', outline: 'none',
        }} />
        <button onClick={copy} style={{
          padding: '0.625rem', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>Copia negli appunti</button>
      </div>
    </div>
  )
}

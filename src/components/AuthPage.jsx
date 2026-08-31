import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    setLoading(true)
    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setInfo('Controlla la tua email per confermare il account.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6">
          <h1 style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.03em' }}>
            spese<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginTop: '0.25rem' }}>
            Le tue spese, sempre sotto controllo.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6" style={{
          background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '3px', gap: '3px'
        }}>
          {['login','signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setInfo('') }}
              style={{
                flex: 1, padding: '0.375rem', borderRadius: '4px', fontSize: '0.875rem',
                fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text-2)',
                boxShadow: tab === t ? 'var(--sh)' : 'none',
              }}>
              {t === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="label-eyebrow" htmlFor="auth-email">Email</label>
            <input id="auth-email" className="input-base" type="email" required
              value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="label-eyebrow" htmlFor="auth-pw">Password</label>
            <input id="auth-pw" className="input-base" type="password" required minLength={6}
              value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', padding: '0.5rem 0.75rem',
              background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </p>
          )}
          {info && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--good)', padding: '0.5rem 0.75rem',
              background: 'color-mix(in srgb, var(--good) 10%, transparent)',
              borderRadius: 'var(--radius-sm)' }}>
              {info}
            </p>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
            {loading ? '…' : tab === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  )
}

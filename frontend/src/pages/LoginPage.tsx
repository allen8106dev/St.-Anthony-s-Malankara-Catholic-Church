import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false)
  if (isAuthenticated) return <Navigate to="/admin" replace />
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setSubmitting(true); try { await login(email, password); const from = (location.state as { from?: string } | null)?.from; navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true }) } catch { setError('Unable to sign in with those credentials.') } finally { setSubmitting(false) } }
  return <main className="login-page"><section className="login-panel"><p className="eyebrow">St. Anthony’s</p><h1>Administration</h1><p>Sign in with an authorized administrator account.</p><form onSubmit={submit}><label>Email<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="button button--primary" disabled={submitting} type="submit">{submitting ? 'Signing in…' : 'Sign in'}</button></form></section></main>
}

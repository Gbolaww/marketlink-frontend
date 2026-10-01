import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthIntro from '@/components/AuthIntro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api'
import { apiError, cn } from '@/lib/utils'
import { getUser, isLoggedIn, setAuth } from '@/lib/auth'
import type { User } from '@/lib/auth'

type Mode = 'signin' | 'signup'
type Role = 'customer' | 'vendor'

const landingFor = (u: User) => (u.role === 'vendor' ? '/vendor-dashboard' : u.role === 'admin' ? '/admin' : '/account')

function Field({ id, label, ...rest }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none">{label}</label>
      <Input id={id} {...rest} />
    </div>
  )
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [role, setRole] = useState<Role>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const existing = isLoggedIn() ? getUser() : null
  if (existing) return <Navigate to={landingFor(existing)} replace />

  // The API returns tokens only, so store the access token first and then load the user.
  const finish = async (tokens: { access_token: string; refresh_token: string }) => {
    localStorage.setItem('access_token', tokens.access_token)
    try {
      const { data: user } = await authApi.me()
      setAuth(tokens.access_token, tokens.refresh_token, user as User)
      navigate(landingFor(user as User))
    } catch (err) {
      localStorage.removeItem('access_token')
      throw err
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mfaToken) {
        const { data } = await authApi.mfaVerify({ mfa_token: mfaToken, code })
        await finish(data)
      } else if (mode === 'signin') {
        const { data } = await authApi.login({ email, password })
        if (data.mfa_token) setMfaToken(data.mfa_token)
        else await finish(data)
      } else {
        await authApi.register({ email, password, role })
        setNotice('Account created. Sign in to continue.')
        setMode('signin')
      }
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => { setMode(m); setError(null); setNotice(null) }}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
        mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="overflow-x-clip">
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Welcome to MarketLink</h1>
        <p className="mt-4 text-muted-foreground">
          One account to buy from verified vendors, track your orders, leave reviews — or open your own storefront and start selling.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
          <li>• Order tracking from payment to delivery</li>
          <li>• Saved locations for distance-based search</li>
          <li>• Vendor tools: catalogue, orders, payouts and analytics</li>
        </ul>
      </div>

      <AuthIntro>
      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 shadow-card">
        {mfaToken ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Two-factor authentication</h2>
            <Field id="code" label="Authentication code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
        ) : (
          <>
            <div className="flex rounded-lg bg-muted p-1">{tab('signin', 'Sign in')}{tab('signup', 'Create account')}</div>
            <div className="mt-5 space-y-4">
              <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Field id="password" label={mode === 'signup' ? 'Password (at least 10 characters)' : 'Password'} type="password" minLength={mode === 'signup' ? 10 : undefined} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
              {mode === 'signup' && (
                <div className="space-y-2">
                  <span className="text-sm font-medium leading-none">I want to</span>
                  <div className="grid grid-cols-2 gap-2">
                    {([['customer', 'Buy'], ['vendor', 'Sell']] as const).map(([r, label]) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer',
                          role === r ? 'border-primary bg-primary/10 text-primary' : 'border-input',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {notice && <p className="mt-4 text-sm text-accent">{notice}</p>}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="mt-5 w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {mfaToken ? 'Verify' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
      </AuthIntro>
    </div>
    </div>
  )
}

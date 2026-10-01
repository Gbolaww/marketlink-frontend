import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { apiError } from '@/lib/utils'

export default function SecurityPage() {
  const user = getUser()
  const [code, setCode] = useState('')

  const start = useMutation({ mutationFn: async () => (await authApi.mfaSetup()).data as { secret: string; provisioning_uri: string } })
  const confirm = useMutation({ mutationFn: () => authApi.mfaConfirm(code) })

  const home = user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor-dashboard' : '/account'

  const onConfirm = (e: FormEvent) => {
    e.preventDefault()
    confirm.mutate()
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Security</h1>
      <p className="mt-2 text-muted-foreground">Protect your account with a code from an authenticator app.</p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card">
        {confirm.isSuccess ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-12 text-accent" />
            <h2 className="mt-4 text-xl font-bold">Two-factor authentication is on</h2>
            <p className="mt-2 text-sm text-muted-foreground">From now on you'll be asked for a code from your app when you sign in.</p>
            <Link to={home} className={buttonClass('default', 'md', 'mt-5')}>Continue</Link>
          </div>
        ) : !start.data ? (
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="size-5 text-primary" /> Two-factor authentication</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You'll need an authenticator app such as Google Authenticator, Microsoft Authenticator or Authy on your phone.
            </p>
            {start.isError && <p role="alert" className="mt-3 text-sm text-destructive">{apiError(start.error)}</p>}
            <Button className="mt-5" disabled={start.isPending} onClick={() => start.mutate()}>
              {start.isPending && <Loader2 className="animate-spin" />} Start setup
            </Button>
          </div>
        ) : (
          <form onSubmit={onConfirm} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">1. Scan this code</h2>
              <p className="mt-1 text-sm text-muted-foreground">Open your authenticator app, add an account and scan the QR code.</p>
              <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG value={start.data.provisioning_uri} size={180} />
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Can't scan? Enter this key manually:
                <span className="mt-1 block break-all font-mono text-sm text-foreground">{start.data.secret}</span>
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">2. Enter the 6-digit code</h2>
              <Input
                className="mt-3 text-center font-mono text-lg tracking-[0.4em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            {confirm.isError && <p role="alert" className="text-sm text-destructive">{apiError(confirm.error)}</p>}
            <Button type="submit" className="w-full" disabled={confirm.isPending || code.length !== 6}>
              {confirm.isPending && <Loader2 className="animate-spin" />} Turn on two-factor authentication
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

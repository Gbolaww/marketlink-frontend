import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Search, ShoppingBag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { clearAuth, getUser, isLoggedIn } from '@/lib/auth'
import { cartCount, useCart } from '@/lib/cart'

const NAV = [
  { to: '/search', label: 'Browse' },
  { to: '/vendor-dashboard', label: 'Sell on MarketLink' },
]

function Logo({ small }: { small?: boolean }) {
  return (
    <span className={'flex items-center gap-2 font-display font-extrabold tracking-tight ' + (small ? 'text-lg' : 'text-lg')}>
      <span className={'grid place-items-center rounded-lg bg-primary text-primary-foreground ' + (small ? 'size-7' : 'size-8')}>M</span>
      MarketLink
    </span>
  )
}

function Header() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const user = isLoggedIn() ? getUser() : null
  const count = cartCount(useCart())
  const home = user?.role === 'vendor' ? '/vendor-dashboard' : user?.role === 'admin' ? '/admin' : '/account'

  const signOut = () => {
    clearAuth()
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/"><Logo /></Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/search" aria-label="Search" className={buttonClass('ghost', 'icon')}><Search /></Link>
          <Link to="/cart" aria-label={'Cart, ' + count + ' items'} className={buttonClass('ghost', 'icon', 'relative')}>
            <ShoppingBag />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">{count}</span>
            )}
          </Link>
          {user && <Link to="/security" className={buttonClass('ghost', 'sm', 'hidden sm:inline-flex')}>Security</Link>}
          {user ? (
            <>
              <Link to={home} className={buttonClass('secondary', 'sm', 'max-w-40')}>
                <span className="truncate">{user.email}</span>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}><LogOut /></Button>
            </>
          ) : (
            <Link to="/auth" className={buttonClass('default', 'sm')}>Sign in</Link>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
              {n.label}
            </Link>
          ))}
          {user && (
            <Link to={home} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
              My account
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

function Footer() {
  const link = 'hover:text-foreground'
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo small />
          <p className="mt-3 text-sm text-muted-foreground">Find real vendors near you across Nigeria, pay safely, and track every order.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Shop</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link to="/search" className={link}>Browse products</Link></li>
            <li><Link to="/search?sort=distance" className={link}>Vendors near me</Link></li>
            <li><Link to="/account" className={link}>My orders</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Sell</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link to="/vendor-dashboard" className={link}>Vendor dashboard</Link></li>
            <li><Link to="/vendor-dashboard" className={link}>Get verified</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Coverage</p>
          <p className="mt-3 text-muted-foreground">Lagos · Abuja · Ibadan · Port Harcourt · Kano</p>
          <p className="mt-3 text-xs text-muted-foreground">Prices in Nigerian Naira. Expanding across Africa.</p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MarketLink. All rights reserved.
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}

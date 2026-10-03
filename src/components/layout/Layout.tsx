import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Search, ShoppingBag, X } from 'lucide-react'
import LocationDialog, { LocationChip } from '@/components/LocationDialog'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { clearAuth, getUser, isLoggedIn } from '@/lib/auth'
import { cartCount, useCart } from '@/lib/cart'
import { openLocationDialog, promptWasDismissed, useSavedLocation } from '@/lib/location'

const NAV = [
  { to: '/search', label: 'Browse' },
  { to: '/vendor-dashboard', label: 'Sell on MarketLink' },
]

function Logo({ small }: { small?: boolean }) {
  return (
    <span className={'flex items-center gap-2 font-display font-extrabold tracking-tight ' + (small ? 'text-lg' : 'text-base sm:text-lg')}>
      <span className={'grid place-items-center rounded-lg bg-primary text-primary-foreground ' + (small ? 'size-7' : 'size-7 sm:size-8')}>M</span>
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
  const close = () => setOpen(false)

  const signOut = () => {
    clearAuth()
    close()
    navigate('/')
  }

  const menuLink = 'block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary'

  // Phones and tablets get a compact bar (logo, location, cart, menu) with everything else in the menu.
  // The full bar only appears from 1024px up, where there is room for it.
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3">
        <Link to="/" className="shrink-0" aria-label="MarketLink home"><Logo /></Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <LocationChip className="max-w-[9rem] sm:max-w-[12rem]" />
          <Link to="/search" aria-label="Search" className={buttonClass('ghost', 'icon', 'hidden shrink-0 sm:inline-flex')}><Search /></Link>
          <Link to="/cart" aria-label={'Cart, ' + count + ' items'} className={buttonClass('ghost', 'icon', 'relative shrink-0')}>
            <ShoppingBag />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">{count}</span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/security" className={buttonClass('ghost', 'sm', 'hidden shrink-0 xl:inline-flex')}>Security</Link>
              <Link to={home} className={buttonClass('secondary', 'sm', 'hidden max-w-40 lg:inline-flex')}>
                <span className="truncate">{user.email}</span>
              </Link>
              <Button variant="ghost" size="icon" className="hidden shrink-0 lg:inline-flex" aria-label="Sign out" onClick={signOut}><LogOut /></Button>
            </>
          ) : (
            <Link to="/auth" className={buttonClass('default', 'sm', 'hidden shrink-0 sm:inline-flex')}>Sign in</Link>
          )}
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background px-4 py-3 lg:hidden" aria-label="Menu">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={close} className={menuLink}>{n.label}</Link>
          ))}
          <Link to="/cart" onClick={close} className={menuLink}>Cart{count > 0 ? ' (' + count + ')' : ''}</Link>
          {user ? (
            <>
              <div className="my-2 border-t border-border" />
              <p className="px-3 py-1 text-xs text-muted-foreground">Signed in as</p>
              <p className="break-all px-3 pb-2 text-sm font-medium">{user.email}</p>
              <Link to={home} onClick={close} className={menuLink}>My account</Link>
              <Link to="/security" onClick={close} className={menuLink}>Security</Link>
              <button type="button" onClick={signOut} className={menuLink + ' flex w-full cursor-pointer items-center gap-2 text-left'}>
                <LogOut className="size-4" /> Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={close} className={buttonClass('default', 'md', 'mt-3 w-full sm:hidden')}>Sign in</Link>
          )}
        </nav>
      )}
    </header>
  )
}

function Footer() {
  const link = 'hover:text-foreground'
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40 print:hidden">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
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

// Pages where "near you" matters. Asking anywhere else (sign in, checkout, dashboards) would just be in the way.
const ASK_ON = ['/', '/search']

export default function Layout() {
  const { pathname } = useLocation()
  const saved = useSavedLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // First visit: ask where they are, once.
  useEffect(() => {
    if (saved || promptWasDismissed() || !ASK_ON.includes(pathname)) return
    const t = window.setTimeout(openLocationDialog, 600)
    return () => window.clearTimeout(t)
  }, [pathname, saved])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <LocationDialog />
    </div>
  )
}

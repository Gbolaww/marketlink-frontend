export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <nav className="nav">
        <div className="wrap nav-inner">
          <a href="/" className="logo">Market<em>Link</em></a>
          <a href="/auth" className="ml-btn ml-btn-primary">Join MarketLink</a>
        </div>
      </nav>
      <header className="hero">
        <div className="wrap hero-inner">
          <span className="eyebrow">Nigeria's local marketplace</span>
          <h1 className="hero-title">Find it in the market. <em>Today.</em></h1>
          <p className="hero-sub">Search any product, compare real vendors near you by price and distance, then pay safely on MarketLink.</p>
        </div>
      </header>
      <footer className="footer">
        <div className="wrap footer-inner">
          <a href="/" className="logo">Market<em>Link</em></a>
          <p className="footer-copy">Local commerce, connected. 2026 MarketLink</p>
        </div>
      </footer>
    </div>
  )
}
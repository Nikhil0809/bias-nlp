import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, BrainCircuit, BarChart3, Layers, GitBranch, Menu, X } from 'lucide-react';
import Home from './pages/Home';
import BiasAnalyzer from './pages/BiasAnalyzer';
import Dashboard from './pages/Dashboard';
import ModelInsights from './pages/ModelInsights';

function NavBar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/analyze', label: 'Analyzer', icon: BrainCircuit },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/insights', label: 'Insights', icon: Layers },
  ];

  return (
    <nav className="glass-strong sticky top-0 z-50 shadow-md" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 no-underline" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border" style={{ borderColor: 'var(--border-subtle)' }}>
            <img src="/logo.jpg" alt="FairNLP-MT Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="heading-section text-lg gradient-text">FairNLP-MT</span>
            <span className="block text-xs" style={{ color: 'var(--text-muted)', marginTop: -2, letterSpacing: '0.05em' }}>
              AI Fairness Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="nav-link"
                style={active ? {
                  color: 'var(--text-primary)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderColor: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.15)'
                } : {}}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
          <div style={{ width: 1, height: 24, background: 'var(--border-default)', margin: '0 8px' }} />
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="nav-link">
            <GitBranch size={16} />
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="nav-link"
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '12px 16px',
                  ...(active ? {
                    color: 'var(--text-primary)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.15)'
                  } : {})
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen grid-pattern" style={{ background: 'var(--bg-primary)' }}>
        {/* Background glow orbs */}
        <div className="glow-orb" style={{ top: '-200px', left: '-100px', background: 'var(--accent-blue)', animation: 'pulse-glow 6s ease-in-out infinite' }} />
        <div className="glow-orb" style={{ top: '50%', right: '-200px', background: 'var(--accent-violet)', animation: 'pulse-glow 8s ease-in-out infinite 2s' }} />

        <NavBar />

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<BiasAnalyzer />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/insights" element={<ModelInsights />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              © 2026 FairNLP-MT Research Lab. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>RoBERTa-base</span>
              <span>·</span>
              <span>PyTorch</span>
              <span>·</span>
              <span>FastAPI</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

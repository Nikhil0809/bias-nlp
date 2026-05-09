import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BrainCircuit, BarChart3, Layers, FileText, Database, Box, BookOpen, Settings, Menu, X, ChevronLeft, Zap, Bell, User, Home as HomeIcon } from 'lucide-react';
import Home from './pages/Home';
import BiasAnalyzer from './pages/BiasAnalyzer';
import Dashboard from './pages/Dashboard';
import ModelInsights from './pages/ModelInsights';

const sidebarLinks = [
  { to: '/', label: 'Home Intro', icon: HomeIcon },
  { to: '/analyze', label: 'Analyzer', icon: BrainCircuit },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/insights', label: 'Insights', icon: Layers },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/datasets', label: 'Datasets', icon: Database },
  { to: '/model-hub', label: 'Model Hub', icon: Box },
  { to: '/docs', label: 'API Documentation', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden lg:flex">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src="/logo.jpg" alt="FairNLP-MT" />
          </div>
          <div>
            <span className="sidebar-title">FairNLP-MT</span>
            <span className="sidebar-subtitle">AI Fairness Platform</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {sidebarLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`sidebar-link${location.pathname === to ? ' active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-status">
            <div className="status-dot" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>All Systems Operational</span>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)}>
          <aside className="sidebar sidebar-mobile" onClick={e => e.stopPropagation()}>
            <div className="sidebar-brand">
              <div className="sidebar-logo"><img src="/logo.jpg" alt="FairNLP-MT" /></div>
              <div>
                <span className="sidebar-title">FairNLP-MT</span>
                <span className="sidebar-subtitle">AI Fairness Platform</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="ml-auto" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <nav className="sidebar-nav">
              {sidebarLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={`sidebar-link${location.pathname === to ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>
                  <Icon size={18} /><span>{label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function TopBar({ setMobileOpen }) {
  const location = useLocation();
  const pageName = sidebarLinks.find(l => l.to === location.pathname)?.label || 'Home';
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="lg:hidden topbar-menu-btn" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
        <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />
        <span className="topbar-page">{pageName}</span>
        <span className="badge badge-emerald" style={{ fontSize: 10 }}>Real-time Analysis</span>
      </div>
      <div className="topbar-right">
        <Link to="/" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <HomeIcon size={14} />
          <span>Home Intro</span>
        </Link>
      </div>
    </header>
  );
}

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app-layout">
      {!isHomePage && <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}
      <div className="app-main">
        {!isHomePage && <TopBar setMobileOpen={setMobileOpen} />}
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<BiasAnalyzer />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/insights" element={<ModelInsights />} />
            <Route path="/reports" element={<Dashboard />} />
            <Route path="/datasets" element={<Dashboard />} />
            <Route path="/model-hub" element={<ModelInsights />} />
            <Route path="/docs" element={<ModelInsights />} />
            <Route path="/settings" element={<ModelInsights />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <span>FairNLP-MT v2.0 · Empowering Fairness in NLP</span>
          <span>Built with ❤ for Ethical AI Research</span>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

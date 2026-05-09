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

function Sidebar({ mobileOpen, setMobileOpen, sidebarOpen }) {
  const location = useLocation();
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden lg:flex" style={{ width: sidebarOpen ? '240px' : '70px' }}>
        <div className="sidebar-brand" style={{ padding: sidebarOpen ? '20px 18px 16px' : '20px 12px 16px', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
          <div className="sidebar-logo">
            <img src="/logo.jpg" alt="FairNLP-MT" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="sidebar-title">FairNLP-MT</span>
              <span className="sidebar-subtitle">AI Fairness Platform</span>
            </div>
          )}
        </div>
        <nav className="sidebar-nav" style={{ padding: sidebarOpen ? '12px 10px' : '12px 6px' }}>
          {sidebarLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`sidebar-link${location.pathname === to ? ' active' : ''}`} style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', padding: sidebarOpen ? '10px 14px' : '10px 0' }} title={!sidebarOpen ? label : ''}>
              <Icon size={18} />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer" style={{ padding: sidebarOpen ? '12px 14px 16px' : '12px 0 16px', display: 'flex', justifyContent: 'center' }}>
          <div className="sidebar-status">
            <div className="status-dot" />
            {sidebarOpen && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>All Systems Operational</span>}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)}>
          <aside className="sidebar sidebar-mobile" onClick={e => e.stopPropagation()} style={{ width: '240px' }}>
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

function TopBar({ setMobileOpen, sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const pageName = sidebarLinks.find(l => l.to === location.pathname)?.label || 'Home';
  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile toggle */}
        <button className="lg:hidden topbar-menu-btn" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
        {/* Desktop toggle */}
        <button className="hidden lg:block topbar-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // set default to close!
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app-layout">
      {!isHomePage && <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} sidebarOpen={sidebarOpen} />}
      <div className="app-main">
        {!isHomePage && <TopBar setMobileOpen={setMobileOpen} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
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

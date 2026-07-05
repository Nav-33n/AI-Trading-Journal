export function Sidebar({ activePage, navItems, onNavigate, onRefresh }) {
  return (
    <aside className="sidebar">
      <div className="brand-mark">TJ</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-button ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>
      <button type="button" className="sidebar-refresh" onClick={onRefresh}>
        Sync
      </button>
    </aside>
  )
}

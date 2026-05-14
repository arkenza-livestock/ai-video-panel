import React from 'react';
import { useEditor } from '../context/EditorContext';
import '../styles/Header.css';

function Header() {
  const {
    projectSettings,
    handleUndo,
    handleRedo,
    historyIndex,
    history,
    setShowSettingsModal,
  } = useEditor();

  const [menuOpen, setMenuOpen] = React.useState(null);

  const handleMenuClick = (menu) => {
    setMenuOpen(menuOpen === menu ? null : menu);
  };

  const menuItems = {
    File: [
      { label: 'New Project', icon: '📄' },
      { label: 'Open Project', icon: '📂' },
      { label: 'Save Project', icon: '💾' },
      { label: 'Save As...', icon: '💾' },
      { label: 'Recent', icon: '⏱️' },
      { label: 'Exit', icon: '🚪' },
    ],
    Edit: [
      { label: 'Undo', icon: '↶', action: handleUndo },
      { label: 'Redo', icon: '↷', action: handleRedo },
      { label: 'Cut', icon: '✂️' },
      { label: 'Copy', icon: '📋' },
      { label: 'Paste', icon: '📌' },
      { label: 'Delete', icon: '🗑️' },
    ],
    View: [
      { label: 'Zoom In', icon: '🔍' },
      { label: 'Zoom Out', icon: '🔍' },
      { label: 'Fit to Screen', icon: '📺' },
      { label: 'Show Waveform', icon: '📊' },
      { label: 'Dark Theme', icon: '🌙' },
    ],
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="app-title">🌙 {projectSettings.projectName}</h1>
      </div>

      <div className="header-center">
        <div className="undo-redo-group">
          <button 
            className="undo-btn"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            className="redo-btn"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <span className="history-info">
            {historyIndex + 1}/{history.length}
          </span>
        </div>
      </div>

      <div className="header-right">
        <nav className="menu-bar">
          {Object.keys(menuItems).map((menuName) => (
            <div key={menuName} className="menu-item">
              <button
                className={`menu-btn ${menuOpen === menuName ? 'active' : ''}`}
                onClick={() => handleMenuClick(menuName)}
              >
                {menuName}
              </button>
              {menuOpen === menuName && (
                <div className="dropdown-menu">
                  {menuItems[menuName].map((item, i) => (
                    <button
                      key={i}
                      className="dropdown-item"
                      onClick={() => {
                        if (item.action) item.action();
                        setMenuOpen(null);
                      }}
                    >
                      <span className="icon">{item.icon}</span>
                      <span className="label">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button 
          className="settings-btn"
          onClick={() => setShowSettingsModal(true)}
          title="Settings (Ctrl+,)"
        >
          ⚙️ Settings
        </button>
      </div>
    </header>
  );
}

export default Header;

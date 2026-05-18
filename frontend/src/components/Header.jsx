import React from 'react';
import { useEditor } from '../context/EditorContext';
import '../styles/Header.css';

// showSettingsModal ve setShowSettingsModal propları parametre listesine eklendi!
function Header({ showProjectModal, setShowProjectModal, showSettingsModal, setShowSettingsModal }) {
  const {
    projectSettings,
    handleUndo,
    handleRedo,
    historyIndex,
    history,
    saveProject,
  } = useEditor();

  const [menuOpen, setMenuOpen] = React.useState(null);

  const handleMenuClick = (menu) => {
    setMenuOpen(menuOpen === menu ? null : menu);
  };

  const menuItems = {
    File: [
      { label: 'New Project', icon: '📄', action: () => { if(setShowProjectModal) setShowProjectModal(true); setMenuOpen(null); } },
      { label: 'Open Project', icon: '📂', action: () => { if(setShowProjectModal) setShowProjectModal(true); setMenuOpen(null); } },
      { label: 'Save', icon: '💾', action: () => { if(saveProject) saveProject(); setMenuOpen(null); } },
      { label: 'Recent', icon: '⏱️' },
      { label: 'Exit', icon: '🚪' },
    ],
    Edit: [
      { label: 'Undo', icon: '↶', action: () => { handleUndo(); setMenuOpen(null); } },
      { label: 'Redo', icon: '↷', action: () => { handleRedo(); setMenuOpen(null); } },
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

  const handleSettingsClick = () => {
    if (typeof setShowSettingsModal === 'function') {
      setShowSettingsModal(true);
    } else {
      alert("Ayarlar penceresi tetiklenemedi. State aktarımında bir problem var.");
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="app-title">🌙 {projectSettings?.projectName || 'Yeni Proje'}</h1>
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
            disabled={historyIndex >= (history?.length || 1) - 1}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <span className="history-info">
            {historyIndex + 1}/{history?.length || 1}
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
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleMenuClick(menuName);
                }}
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
                      onTouchStart={(e) => {
                        e.preventDefault();
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
          onClick={handleSettingsClick}
          onTouchStart={(e) => {
            e.preventDefault();
            handleSettingsClick();
          }}
          title="Settings (Ctrl+,)"
        >
          ⚙️ Settings
        </button>
      </div>
    </header>
  );
}

export default Header;

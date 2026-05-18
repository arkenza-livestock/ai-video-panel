import React, { useState, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import '../styles/Header.css';

function Header({ showProjectModal, setShowProjectModal, showSettingsModal, setShowSettingsModal }) {
  const {
    projectSettings,
    handleUndo,
    handleRedo,
    historyIndex,
    history,
    saveProject,
  } = useEditor();

  const [menuOpen, setMenuOpen] = useState(null);

  const handleMenuToggle = (e, menuName) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMenuOpen(prev => (prev === menuName ? null : menuName));
  };

  const menuItems = {
    File: [
      { label: 'New Project', icon: '📄', action: () => { if (setShowProjectModal) setShowProjectModal(true); } },
      { label: 'Open Project', icon: '📂', action: () => { if (setShowProjectModal) setShowProjectModal(true); } },
      { label: 'Save', icon: '💾', action: () => { if (saveProject) saveProject(); } },
      { label: 'Recent', icon: '⏱️' },
      { label: 'Exit', icon: '🚪' },
    ],
    Edit: [
      { label: 'Undo', icon: '↶', action: () => handleUndo() },
      { label: 'Redo', icon: '↷', action: () => handleRedo() },
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

  const handleSettingsClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Eski alert uyarısını tamamen sildik, doğrudan modalı tetikliyoruz
    if (setShowSettingsModal) {
      setShowSettingsModal(true);
    }
    setMenuOpen(null);
  };

  const handleDropdownItemClick = (e, action) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (action) action();
    setMenuOpen(null);
  };

  useEffect(() => {
    const closeAllMenus = () => setMenuOpen(null);
    window.addEventListener('pointerdown', closeAllMenus);
    return () => window.removeEventListener('pointerdown', closeAllMenus);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="app-title">🌙 {projectSettings?.projectName || 'Yeni Proje'}</h1>
      </div>

      <div className="header-center">
        <div className="undo-redo-group">
          <button className="undo-btn" onClick={handleUndo} disabled={historyIndex <= 0}>
            ↶ Undo
          </button>
          <button className="redo-btn" onClick={handleRedo} disabled={historyIndex >= (history?.length || 1) - 1}>
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
            <div key={menuName} className="menu-item" onClick={(e) => e.stopPropagation()}>
              <button
                className={`menu-btn ${menuOpen === menuName ? 'active' : ''}`}
                onPointerDown={(e) => handleMenuToggle(e, menuName)}
              >
                {menuName}
              </button>
              {menuOpen === menuName && (
                <div className="dropdown-menu">
                  {menuItems[menuName].map((item, i) => (
                    <button
                      key={i}
                      className="dropdown-item"
                      onPointerDown={(e) => handleDropdownItemClick(e, item.action)}
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
          onPointerDown={handleSettingsClick}
        >
          ⚙️ Settings
        </button>
      </div>
    </header>
  );
}

export default Header;

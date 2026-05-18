import React, { useState, useEffect } from 'react';
import { useEditor } from './context/EditorContext';
import projectService from './services/projectService';
import './ProjectModal.css';

function ProjectModal({ isOpen, onClose, onProjectSelect }) {
  const {
    projectSettings,
    createNewProject,
    loadProject,
    deleteProject,
    apiReady,
    isLoading,
  } = useEditor();

  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('New Project');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Modal her açıldığında projeleri yükle
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, apiReady]);

  const loadProjects = async () => {
    try {
      // API hazır değilse istek atıp konsolu hataya boğma, boş liste ver geç
      if (!apiReady || !projectService || typeof projectService.getProjects !== 'function') {
        setProjects([]);
        return;
      }
      const result = await projectService.getProjects();
      setProjects(result?.projects || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading projects:', err);
    }
  };

  const handleCreateProject = async () => {
    try {
      // HATA DÜZELTİLDİ: Inputa yazılan isim (newProjectName) artık fonksiyona gönderiliyor!
      const result = await createNewProject(newProjectName);
      
      setNewProjectName('New Project');
      setShowNewProjectForm(false);
      await loadProjects();
      
      if (onProjectSelect) {
        onProjectSelect(result || true);
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoadProject = async (projectId) => {
    try {
      await loadProject(projectId);
      if (onProjectSelect) {
        onProjectSelect(projectId);
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      setDeleting(projectId);
      if (deleteProject) {
        await deleteProject(projectId);
        await loadProjects();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Eğer isOpen false ise kesinlikle ekrana hiçbir şey çizme
  if (!isOpen) return null;

  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div className="project-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <h2>📁 Projects</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* CONTENT */}
        <div className="modal-content">
          {/* NEW PROJECT FORM */}
          {showNewProjectForm && (
            <div className="new-project-form">
              <input
                type="text"
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="project-name-input"
                autoFocus
              />
              <div className="form-buttons">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowNewProjectForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="create-btn"
                  onClick={handleCreateProject}
                  disabled={!newProjectName || isLoading}
                >
                  {isLoading ? '⏳ Creating...' : '✨ Create'}
                </button>
              </div>
            </div>
          )}

          {/* PROJECTS LIST */}
          {!showNewProjectForm && (
            <>
              <div className="list-header">
                <p className="list-title">
                  {projects.length === 0 ? 'No projects yet' : `${projects.length} project(s)`}
                </p>
                <button 
                  className="new-project-btn"
                  onClick={() => setShowNewProjectForm(true)}
                >
                  ➕ New Project
                </button>
              </div>

              {projects.length > 0 ? (
                <div className="projects-list">
                  {projects.map((project) => (
                    <div key={project.id} className="project-item">
                      <div className="project-info">
                        <p className="project-name">📌 {project.name}</p>
                        <p className="project-date">
                          Created: {formatDate(project.created)}
                        </p>
                      </div>
                      <div className="project-actions">
                        <button
                          className="load-btn"
                          onClick={() => handleLoadProject(project.id)}
                          title="Load project"
                        >
                          📂 Open
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={deleting === project.id}
                          title="Delete project"
                        >
                          {deleting === project.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No projects found</p>
                  <p className="hint">Create a new project to get started</p>
                </div>
              )}
            </>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* API STATUS */}
          {!apiReady && (
            <div className="warning-message" style={{ margin: '10px 0', padding: '8px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '12px' }}>
              ⚠️ Backend API not available. Working in offline mode.
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button className="close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectModal;

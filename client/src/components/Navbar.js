import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to={isAdmin() ? '/admin' : '/colaborador'} className="navbar-brand" onClick={closeMenu}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="navbar-logo">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Gestão de Projetos</span>
        </Link>

        {/* Menu Desktop */}
        <div className="navbar-menu">
          <div className="navbar-nav">
            <Link 
              to={isAdmin() ? '/admin' : '/colaborador'} 
              className="nav-link"
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            {isAdmin() && (
              <Link to="/usuarios" className="nav-link" onClick={closeMenu}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                Usuários
              </Link>
            )}

            <Link to="/perfil" className="nav-link" onClick={closeMenu}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Perfil
            </Link>
          </div>

          {/* User Menu */}
          <div className="navbar-user">
            <div className="user-info">
              <div className="user-avatar">
                {user?.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.nome}</span>
                <span className={`user-role role-${user?.role?.toLowerCase()}`}>
                  {user?.role}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="logout-btn"
              title="Sair"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-user-info">
            <div className="user-avatar">
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.nome}</span>
              <span className={`user-role role-${user?.role?.toLowerCase()}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mobile-nav">
          <Link 
            to={isAdmin() ? '/admin' : '/colaborador'} 
            className="mobile-nav-link"
            onClick={closeMenu}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          {isAdmin() && (
            <Link to="/usuarios" className="mobile-nav-link" onClick={closeMenu}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              Usuários
            </Link>
          )}

          <Link to="/perfil" className="mobile-nav-link" onClick={closeMenu}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Perfil
          </Link>

          <button 
            onClick={() => {
              closeMenu();
              handleLogout();
            }} 
            className="mobile-nav-link logout"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;
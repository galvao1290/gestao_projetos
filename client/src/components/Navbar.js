import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProjectIcon, HomeIcon, UsersIcon, LogoutIcon, MenuIcon } from './Icons';

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
          <ProjectIcon className="navbar-logo" />
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
              <HomeIcon />
              Dashboard
            </Link>

            {isAdmin() && (
              <Link to="/usuarios" className="nav-link" onClick={closeMenu}>
                <UsersIcon />
                Usuários
              </Link>
            )}


          </div>

          {/* User Menu */}
          <div className="navbar-user">
            <div className="user-avatar" title={`${user?.nome} (${user?.role})`}>
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
            
            <button 
              onClick={handleLogout} 
              className="logout-btn"
              title="Sair"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <MenuIcon />
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
            <HomeIcon />
            Dashboard
          </Link>

          {isAdmin() && (
            <Link to="/usuarios" className="mobile-nav-link" onClick={closeMenu}>
              <UsersIcon />
              Usuários
            </Link>
          )}



          <button 
            onClick={() => {
              closeMenu();
              handleLogout();
            }} 
            className="mobile-nav-link logout"
          >
            <LogoutIcon />
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
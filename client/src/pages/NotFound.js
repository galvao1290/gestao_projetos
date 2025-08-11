import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (isAuthenticated && user) {
      if (user.role === 'ADM') {
        navigate('/admin');
      } else if (user.role === 'COLABORADOR') {
        navigate('/colaborador');
      } else {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-illustration">
          <svg viewBox="0 0 200 200" fill="none" className="not-found-svg">
            {/* Ilustração 404 */}
            <circle cx="100" cy="100" r="80" stroke="#e5e7eb" strokeWidth="2" fill="none" />
            <path 
              d="M70 70 L130 130 M130 70 L70 130" 
              stroke="#ef4444" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
            <text 
              x="100" 
              y="180" 
              textAnchor="middle" 
              className="not-found-text"
              fontSize="24" 
              fontWeight="bold" 
              fill="#374151"
            >
              404
            </text>
          </svg>
        </div>
        
        <div className="not-found-info">
          <h1>Página Não Encontrada</h1>
          <p>
            Oops! A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="not-found-actions">
            <button 
              onClick={handleGoHome}
              className="btn btn-primary"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ir para o Dashboard
            </button>
            
            <button 
              onClick={() => navigate(-1)}
              className="btn btn-outline"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Voltar
            </button>
          </div>
          
          {isAuthenticated && (
            <div className="not-found-links">
              <h3>Links Úteis:</h3>
              <ul>
                {user?.role === 'ADM' && (
                  <>
                    <li><Link to="/admin">Dashboard Administrativo</Link></li>
                    <li><Link to="/usuarios">Gerenciar Usuários</Link></li>
                  </>
                )}
                {user?.role === 'COLABORADOR' && (
                  <li><Link to="/colaborador">Dashboard do Colaborador</Link></li>
                )}

              </ul>
            </div>
          )}
          
          {!isAuthenticated && (
            <div className="not-found-links">
              <h3>Acesso:</h3>
              <ul>
                <li><Link to="/login">Fazer Login</Link></li>
                <li><Link to="/registro">Criar Conta</Link></li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="not-found-footer">
        <p>
          Se você acredita que isso é um erro, entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
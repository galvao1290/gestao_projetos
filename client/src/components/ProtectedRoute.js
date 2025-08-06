import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar role específica se requerida
  if (requiredRole && user.role !== requiredRole) {
    // Redirecionar para a página apropriada baseada na role do usuário
    if (user.role === 'ADM') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'COLABORADOR') {
      return <Navigate to="/colaborador" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Verificar se a conta está ativa
  if (user.ativo === false) {
    return (
      <div className="conta-desativada">
        <div className="container">
          <div className="card">
            <h2>Conta Desativada</h2>
            <p>Sua conta foi desativada. Entre em contato com o administrador.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="btn btn-primary"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
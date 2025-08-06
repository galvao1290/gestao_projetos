import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <LoadingSpinner />;
  }

  // Se o usuário já está autenticado, redirecionar para o dashboard apropriado
  if (isAuthenticated && user) {
    if (user.role === 'ADM') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'COLABORADOR') {
      return <Navigate to="/colaborador" replace />;
    }
  }

  return children;
};

export default PublicRoute;
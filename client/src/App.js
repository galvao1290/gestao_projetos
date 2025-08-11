import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Páginas
import Login from './pages/Login';
import Registro from './pages/Registro';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardColaborador from './pages/DashboardColaborador';
import MeusProjetos from './pages/MeusProjetos';

import GerenciarUsuarios from './pages/GerenciarUsuarios';
import CriarProjeto from './pages/CriarProjeto';
import Projeto from './pages/Projeto';
import NotFound from './pages/NotFound';

// Estilos globais
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rotas Públicas */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/registro" 
              element={
                <PublicRoute>
                  <Registro />
                </PublicRoute>
              } 
            />
            
            {/* Rotas Protegidas */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="ADM">
                  <DashboardAdmin />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/colaborador" 
              element={
                <ProtectedRoute requiredRole="COLABORADOR">
                  <DashboardColaborador />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/meus-projetos" 
              element={
                <ProtectedRoute requiredRole="COLABORADOR">
                  <MeusProjetos />
                </ProtectedRoute>
              } 
            />
            

            
            <Route 
              path="/usuarios" 
              element={
                <ProtectedRoute requiredRole="ADM">
                  <GerenciarUsuarios />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/criar-projeto" 
              element={
                <ProtectedRoute requiredRole="ADM">
                  <CriarProjeto />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/projeto/:id" 
              element={
                <ProtectedRoute>
                  <Projeto />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirecionamentos */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Notificações Toast */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Componente para redirecionar baseado na role do usuário
const DashboardRedirect = () => {
  const { user } = React.useContext(require('./contexts/AuthContext').AuthContext);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === 'ADM') {
    return <Navigate to="/admin" replace />;
  } else if (user.role === 'COLABORADOR') {
    return <Navigate to="/colaborador" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

export default App;
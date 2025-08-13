import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Configurar interceptador do axios para incluir token automaticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de resposta para lidar com tokens expirados
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar se há um usuário logado ao carregar a aplicação
  useEffect(() => {
    const verificarAutenticacao = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          // Verificar se o token ainda é válido
          const response = await axios.post('/api/auth/verificar-token');
          
          if (response.data.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpar dados
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    verificarAutenticacao();
  }, []);

  // Função de login
  const login = async (username, senha) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', {
        username,
        senha
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Salvar no localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Atualizar estado
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Login realizado com sucesso!');
        return { success: true, user: userData };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Função de registro
  const registro = async (dadosUsuario) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/registro', dadosUsuario);

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Salvar no localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Atualizar estado
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Registro realizado com sucesso!');
        return { success: true, user: userData };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer registro';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar dados locais independentemente do resultado da API
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logout realizado com sucesso!');
    }
  };

  // Função para atualizar dados do usuário
  const atualizarUsuario = (dadosAtualizados) => {
    const usuarioAtualizado = { ...user, ...dadosAtualizados };
    setUser(usuarioAtualizado);
    localStorage.setItem('user', JSON.stringify(usuarioAtualizado));
  };

  // Função para verificar se o usuário tem uma role específica
  const temRole = (roleRequerida) => {
    return user && user.role === roleRequerida;
  };

  // Função para verificar se o usuário é admin
  const isAdmin = () => {
    return temRole('ADM');
  };

  // Função para verificar se o usuário é colaborador
  const isColaborador = () => {
    return temRole('COLABORADOR');
  };

  const value = {
    user,
    token: localStorage.getItem('token'),
    loading,
    isAuthenticated,
    login,
    registro,
    logout,
    atualizarUsuario,
    temRole,
    isAdmin,
    isColaborador
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
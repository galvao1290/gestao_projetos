import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    senha: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const result = await login(formData.username, formData.senha);
      
      if (result.success) {
        // Redirecionar baseado na role do usuário
        if (result.user.role === 'ADM') {
          navigate('/admin');
        } else if (result.user.role === 'COLABORADOR') {
          navigate('/colaborador');
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Fazendo login..." />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Entrar</h1>
          <p>Acesse sua conta para continuar</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Nome de Usuário</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              placeholder="Digite seu nome de usuário"
              required
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              className={errors.senha ? 'error' : ''}
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
            {errors.senha && <span className="error-message">{errors.senha}</span>}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="demo-accounts">
          <h3>Contas de Demonstração</h3>
          <div className="demo-buttons">
            <button 
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => {
                setFormData({
                  username: 'admin',
                  senha: '123'
                });
              }}
            >
              Admin Demo
            </button>
            <button 
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => {
                setFormData({
                  username: 'joao123',
                  senha: '123'
                });
              }}
            >
              Colaborador Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
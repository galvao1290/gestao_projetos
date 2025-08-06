import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Registro = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    role: 'COLABORADOR'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { registro } = useAuth();
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
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (!formData.confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { confirmarSenha, ...dadosRegistro } = formData;
      const result = await registro(dadosRegistro);
      
      if (result.success) {
        // Redirecionar baseado na role do usuário
        if (result.user.role === 'ADM') {
          navigate('/admin');
        } else if (result.user.role === 'COLABORADOR') {
          navigate('/colaborador');
        }
      }
    } catch (error) {
      console.error('Erro no registro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Criando conta..." />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Criar Conta</h1>
          <p>Preencha os dados para criar sua conta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nome">Nome Completo</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={errors.nome ? 'error' : ''}
              placeholder="Digite seu nome completo"
              autoComplete="name"
            />
            {errors.nome && <span className="error-message">{errors.nome}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Digite seu email"
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Tipo de Conta</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={errors.role ? 'error' : ''}
            >
              <option value="COLABORADOR">Colaborador</option>
              <option value="ADM">Administrador</option>
            </select>
            {errors.role && <span className="error-message">{errors.role}</span>}
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
              placeholder="Digite sua senha (mín. 6 caracteres)"
              autoComplete="new-password"
            />
            {errors.senha && <span className="error-message">{errors.senha}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              className={errors.confirmarSenha ? 'error' : ''}
              placeholder="Confirme sua senha"
              autoComplete="new-password"
            />
            {errors.confirmarSenha && <span className="error-message">{errors.confirmarSenha}</span>}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Já tem uma conta? {' '}
            <Link to="/login" className="auth-link">
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
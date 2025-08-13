import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { UsersIcon, ShieldIcon, AlertCircleIcon, CheckCircleIcon } from '../components/Icons';
import '../styles/CriarUsuario.css';

const CriarUsuario = () => {
  const [formData, setFormData] = useState({
    nome: '',
    username: '',
    senha: '',
    role: 'COLABORADOR'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
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

    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
    } else if (formData.username.trim().length > 20) {
      newErrors.username = 'Nome de usuário deve ter no máximo 20 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Nome de usuário deve conter apenas letras, números e underscore';
    }

    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.trim().length < 3) {
      newErrors.senha = 'Senha deve ter pelo menos 3 caracteres';
    }

    if (!formData.role) {
      newErrors.role = 'Cargo é obrigatório';
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
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/auth/criar-usuario', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Usuário criado com sucesso!');
        navigate('/usuarios');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao criar usuário';
      toast.error(message);
      
      // Se houver erros de validação do servidor
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.path || err.param] = err.msg;
        });
        setErrors(serverErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="criar-usuario-container">
      <Navbar />
      
      <div className="criar-usuario-main">
        <div className="criar-usuario-content">
          <div className="criar-usuario-header">
            <h1>Criar Novo Usuário</h1>
            <p>Preencha os dados para adicionar um novo membro à equipe</p>
          </div>

          <div className="form-card">
            <form onSubmit={handleSubmit} className="modern-form">
              <div className="form-group-modern">
                <label htmlFor="nome">
                  <UsersIcon /> Nome Completo
                </label>
                <div className="input-with-validation">
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={`form-input-modern ${errors.nome ? 'error' : ''}`}
                    placeholder="Digite o nome completo do usuário"
                    required
                  />
                  {formData.nome && !errors.nome && (
                    <CheckCircleIcon className="validation-icon success" />
                  )}
                  {errors.nome && (
                    <AlertCircleIcon className="validation-icon error" />
                  )}
                </div>
                {errors.nome && (
                  <div className="error-message-modern">
                    <AlertCircleIcon />
                    {errors.nome}
                  </div>
                )}
              </div>

              <div className="form-group-modern">
                <label htmlFor="username">
                  <UsersIcon /> Nome de Usuário
                </label>
                <div className="input-with-validation">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`form-input-modern ${errors.username ? 'error' : ''}`}
                    placeholder="Digite o nome de usuário único"
                    required
                  />
                  {formData.username && !errors.username && (
                    <CheckCircleIcon className="validation-icon success" />
                  )}
                  {errors.username && (
                    <AlertCircleIcon className="validation-icon error" />
                  )}
                </div>
                {errors.username && (
                  <div className="error-message-modern">
                    <AlertCircleIcon />
                    {errors.username}
                  </div>
                )}
                <div className="form-help-text">
                  Apenas letras, números e underscore. Entre 3 e 20 caracteres.
                </div>
              </div>

              <div className="form-group-modern">
                <label htmlFor="senha">
                  <ShieldIcon /> Senha
                </label>
                <div className="input-with-validation">
                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    className={`form-input-modern ${errors.senha ? 'error' : ''}`}
                    placeholder="Digite uma senha segura"
                    required
                  />
                  {formData.senha && !errors.senha && (
                    <CheckCircleIcon className="validation-icon success" />
                  )}
                  {errors.senha && (
                    <AlertCircleIcon className="validation-icon error" />
                  )}
                </div>
                {errors.senha && (
                  <div className="error-message-modern">
                    <AlertCircleIcon />
                    {errors.senha}
                  </div>
                )}
                <div className="form-help-text">
                  Mínimo de 3 caracteres. Recomendamos usar uma senha forte.
                </div>
              </div>

              <div className="form-group-modern">
                <label htmlFor="role">
                  <ShieldIcon /> Nível de Acesso
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`form-select-modern ${errors.role ? 'error' : ''}`}
                  required
                >
                  <option value="COLABORADOR">Colaborador - Acesso básico</option>
                  <option value="ADM">Administrador - Acesso completo</option>
                </select>
                {errors.role && (
                  <div className="error-message-modern">
                    <AlertCircleIcon />
                    {errors.role}
                  </div>
                )}
                <div className="form-help-text">
                  Colaboradores podem gerenciar projetos. Administradores têm acesso total.
                </div>
              </div>

              <div className="form-actions-modern">
                <button 
                  type="button" 
                  className="btn-modern btn-secondary-modern"
                  onClick={() => navigate('/admin/usuarios')}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`btn-modern btn-primary-modern ${isLoading ? 'btn-loading' : ''}`}
                  disabled={isLoading}
                >
                  {!isLoading && <UsersIcon />}
                  {isLoading ? '' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriarUsuario;
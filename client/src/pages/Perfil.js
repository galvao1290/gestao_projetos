import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import axios from 'axios';

const Perfil = () => {
  const { user, atualizarUsuario } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.put(`/api/users/${user._id}`, formData);
      
      if (response.data.success) {
        atualizarUsuario(response.data.data);
        setIsEditing(false);
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nome: user?.nome || '',
      email: user?.email || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não disponível';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Atualizando perfil..." />;
  }

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="page-header">
          <h1>Meu Perfil</h1>
          <p>Visualize e edite suas informações pessoais</p>
        </div>

        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {user?.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h2>{user?.nome}</h2>
                <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
                  {user?.role}
                </span>
                <span className={`status-badge ${user?.ativo ? 'active' : 'inactive'}`}>
                  {user?.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="profile-actions">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="m18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button 
                      onClick={handleCancel}
                      className="btn btn-outline"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSubmit}
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-content">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="profile-form">
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
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                </form>
              ) : (
                <div className="profile-details">
                  <div className="detail-group">
                    <label>Nome Completo</label>
                    <p>{user?.nome}</p>
                  </div>
                  
                  <div className="detail-group">
                    <label>Email</label>
                    <p>{user?.email}</p>
                  </div>
                  
                  <div className="detail-group">
                    <label>Função</label>
                    <p>{user?.role}</p>
                  </div>
                  
                  <div className="detail-group">
                    <label>Status da Conta</label>
                    <p className={user?.ativo ? 'text-success' : 'text-danger'}>
                      {user?.ativo ? 'Ativa' : 'Inativa'}
                    </p>
                  </div>
                  
                  <div className="detail-group">
                    <label>Data de Criação</label>
                    <p>{formatDate(user?.dataCriacao)}</p>
                  </div>
                  
                  <div className="detail-group">
                    <label>Último Login</label>
                    <p>{formatDate(user?.ultimoLogin)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-sidebar">
            <div className="sidebar-card">
              <h3>Informações da Conta</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">ID do Usuário:</span>
                  <span className="info-value">{user?._id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tipo de Conta:</span>
                  <span className="info-value">{user?.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Membro desde:</span>
                  <span className="info-value">
                    {user?.dataCriacao ? 
                      new Date(user.dataCriacao).toLocaleDateString('pt-BR') : 
                      'Não disponível'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="sidebar-card">
              <h3>Segurança</h3>
              <p>Para alterar sua senha ou outras configurações de segurança, entre em contato com o administrador.</p>
              <div className="security-tips">
                <h4>Dicas de Segurança:</h4>
                <ul>
                  <li>Mantenha suas informações sempre atualizadas</li>
                  <li>Não compartilhe suas credenciais</li>
                  <li>Faça logout ao sair de computadores públicos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
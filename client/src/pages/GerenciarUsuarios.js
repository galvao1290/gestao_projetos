import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

const GerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    carregarUsuarios();
  }, [currentPage, searchTerm, roleFilter]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter
      };
      
      const response = await axios.get('/api/users', { params });
      
      if (response.data.success) {
        setUsuarios(response.data.data.usuarios);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      
      let response;
      if (currentStatus) {
        // Desativar usuário
        response = await axios.delete(`/api/users/${userId}`);
      } else {
        // Reativar usuário
        response = await axios.post(`/api/users/${userId}/reativar`);
      }
      
      if (response.data.success) {
        toast.success(response.data.message);
        carregarUsuarios();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao alterar status do usuário';
      toast.error(message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading && usuarios.length === 0) {
    return <LoadingSpinner message="Carregando usuários..." />;
  }

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="page-header">
          <h1>Gerenciar Usuários</h1>
          <p>Visualize e gerencie todos os usuários do sistema</p>
        </div>

        {/* Filtros */}
        <div className="filters-section">
          <div className="filters-container">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="currentColor" className="search-icon">
                <path d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              className="filter-select"
            >
              <option value="">Todas as funções</option>
              <option value="ADM">Administrador</option>
              <option value="COLABORADOR">Colaborador</option>
            </select>
            
            <button 
              onClick={carregarUsuarios}
              className="btn btn-outline"
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="users-table-container">
          {loading ? (
            <div className="table-loading">
              <LoadingSpinner size="small" message="Carregando..." />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              <h3>Nenhum usuário encontrado</h3>
              <p>Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Email</th>
                    <th>Função</th>
                    <th>Status</th>
                    <th>Último Login</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {usuario.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{usuario.nome}</span>
                            <span className="user-id">ID: {usuario._id.slice(-8)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{usuario.email}</td>
                      <td>
                        <span className={`role-badge role-${usuario.role.toLowerCase()}`}>
                          {usuario.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${usuario.ativo ? 'active' : 'inactive'}`}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>{formatDate(usuario.ultimoLogin)}</td>
                      <td>{formatDate(usuario.dataCriacao)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => toggleUserStatus(usuario._id, usuario.ativo)}
                            className={`btn btn-small ${
                              usuario.ativo ? 'btn-danger' : 'btn-success'
                            }`}
                            disabled={actionLoading[usuario._id]}
                            title={usuario.ativo ? 'Desativar usuário' : 'Reativar usuário'}
                          >
                            {actionLoading[usuario._id] ? (
                              <div className="btn-spinner"></div>
                            ) : usuario.ativo ? (
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {usuario.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="pagination-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Anterior
            </button>
            
            <div className="pagination-info">
              <span>
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <span className="total-count">
                Total: {pagination.totalUsers} usuários
              </span>
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="pagination-btn"
            >
              Próxima
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* Estatísticas Resumidas */}
        {pagination && (
          <div className="users-summary">
            <div className="summary-card">
              <h3>Resumo</h3>
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="stat-label">Total de usuários:</span>
                  <span className="stat-value">{pagination.totalUsers}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Exibindo:</span>
                  <span className="stat-value">{usuarios.length} usuários</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Filtros ativos:</span>
                  <span className="stat-value">
                    {[searchTerm && 'Busca', roleFilter && 'Função'].filter(Boolean).join(', ') || 'Nenhum'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GerenciarUsuarios;
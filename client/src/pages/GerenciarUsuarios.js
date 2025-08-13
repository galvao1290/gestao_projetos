import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/GerenciarUsuarios.css';
import { SearchIcon, FilterIcon, GridIcon, ListIcon, ChevronUpIcon, ChevronDownIcon, SortIcon, UsersIcon, UserCheckIcon, UserXIcon, ShieldIcon, CheckIcon, XIcon, RefreshIcon, PlusIcon } from '../components/Icons';

const GerenciarUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'cards'
  const [sortBy, setSortBy] = useState('dataCriacao');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Estados para paginação (compatibilidade)
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);

  useEffect(() => {
    carregarUsuarios();
  }, [currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        sortBy: sortBy,
        sortOrder: sortOrder
      };
      
      const response = await axios.get('/api/users', { params });
      
      if (response.data.success) {
        setUsuarios(response.data.data.usuarios);
        setPagination(response.data.data.pagination);
        // Atualizar estados de paginação para compatibilidade
        setPaginaAtual(response.data.data.pagination.currentPage);
        setTotalPaginas(response.data.data.pagination.totalPages);
        setTotalUsuarios(response.data.data.pagination.totalUsers);
        // Limpar seleções ao carregar nova página
        setSelectedUsers([]);
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

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setSortBy('dataCriacao');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === usuarios.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usuarios.map(user => user._id));
    }
  };

  const bulkToggleStatus = async (activate = true) => {
    if (selectedUsers.length === 0) {
      toast.warning('Selecione pelo menos um usuário');
      return;
    }

    try {
      setBulkActionLoading(true);
      const promises = selectedUsers.map(userId => {
        const user = usuarios.find(u => u._id === userId);
        if (!user) return Promise.resolve();
        
        if (activate && !user.ativo) {
          return axios.post(`/api/users/${userId}/reativar`);
        } else if (!activate && user.ativo) {
          return axios.delete(`/api/users/${userId}`);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      toast.success(`${selectedUsers.length} usuário(s) ${activate ? 'ativado(s)' : 'desativado(s)'} com sucesso`);
      setSelectedUsers([]);
      carregarUsuarios();
    } catch (error) {
      toast.error('Erro ao executar ação em lote');
    } finally {
      setBulkActionLoading(false);
    }
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

  // Estatísticas calculadas
  const statsUsuarios = useMemo(() => {
    const total = totalUsuarios;
    const ativos = usuarios.filter(u => u.ativo).length;
    const inativos = usuarios.filter(u => !u.ativo).length;
    const administradores = usuarios.filter(u => u.role === 'ADM').length;
    const colaboradores = usuarios.filter(u => u.role === 'COLABORADOR').length;
    
    return {
      total,
      ativos,
      inativos,
      administradores,
      colaboradores
    };
  }, [usuarios, totalUsuarios]);
  
  // Alias para compatibilidade
  const stats = {
    total: statsUsuarios.total,
    ativos: statsUsuarios.ativos,
    inativos: statsUsuarios.inativos,
    admins: statsUsuarios.administradores,
    colaboradores: statsUsuarios.colaboradores
  };

  const hasActiveFilters = searchTerm || roleFilter || statusFilter;

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <SortIcon className="sort-icon" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="sort-icon active" />
    ) : (
      <ChevronDownIcon className="sort-icon active" />
    );
  };

  if (loading && usuarios.length === 0) {
    return <LoadingSpinner message="Carregando usuários..." />;
  }

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        {/* Header com estatísticas */}
        <div className="users-page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Gerenciar Usuários</h1>
              <p>Visualize e gerencie todos os usuários do sistema</p>
            </div>
            
            <div className="header-stats">
              <div className="stat-card">
                <div className="stat-icon total">
                  <UsersIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-number">{pagination?.totalUsers || 0}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon active">
                  <UserCheckIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-number">{statsUsuarios.ativos}</span>
                  <span className="stat-label">Ativos</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon inactive">
                  <UserXIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-number">{statsUsuarios.inativos}</span>
                  <span className="stat-label">Inativos</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon admin">
                  <ShieldIcon />
                </div>
                <div className="stat-content">
                  <span className="stat-number">{statsUsuarios.administradores}</span>
                  <span className="stat-label">Admins</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de ferramentas */}
        <div className="users-toolbar">
          <div className="toolbar-main">
            <div className="toolbar-left">
              <div className="search-container">
                <SearchIcon className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou username..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="clear-search"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="toolbar-actions">
                <div className="action-group">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`toolbar-btn filter-toggle ${showFilters ? 'active' : ''}`}
                  >
                    <FilterIcon />
                    Filtros
                    {hasActiveFilters && <span className="filter-badge">{[searchTerm, roleFilter, statusFilter].filter(Boolean).length}</span>}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="toolbar-right">
              <div className="toolbar-actions">
                <div className="action-group">
                  <button 
                    onClick={() => navigate('/criar-usuario')}
                    className="toolbar-btn btn-primary"
                  >
                    <PlusIcon />
                    Criar Usuário
                  </button>
                  
                  <button 
                    onClick={carregarUsuarios}
                    className="toolbar-btn btn-outline"
                    disabled={loading}
                  >
                    <RefreshIcon />
                    Atualizar
                  </button>
                </div>
              </div>
              
              <div className="view-toggle">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  title="Visualização em tabela"
                >
                  <ListIcon />
                </button>
                <button 
                  onClick={() => setViewMode('cards')}
                  className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  title="Visualização em cards"
                >
                  <GridIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="filters-expanded">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Função</label>
                <select value={roleFilter} onChange={handleRoleFilter}>
                  <option value="">Todas as funções</option>
                  <option value="ADM">Administrador</option>
                  <option value="COLABORADOR">Colaborador</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={handleStatusFilter}>
                  <option value="">Todos os status</option>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Ordenar por</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="dataCriacao">Data de criação</option>
                  <option value="nome">Nome</option>
                  <option value="username">Username</option>
                  <option value="ultimoLogin">Último login</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Ordem</label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="asc">Crescente</option>
                  <option value="desc">Decrescente</option>
                </select>
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="filters-actions">
                <button onClick={clearFilters} className="btn btn-outline btn-small">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ações em lote */}
        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <div className="bulk-info">
              <span>{selectedUsers.length} usuário(s) selecionado(s)</span>
            </div>
            <div className="bulk-buttons">
              <button 
                onClick={() => bulkToggleStatus(true)}
                className="btn btn-success btn-small"
                disabled={bulkActionLoading}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ativar selecionados
              </button>
              <button 
                onClick={() => bulkToggleStatus(false)}
                className="btn btn-danger btn-small"
                disabled={bulkActionLoading}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                Desativar selecionados
              </button>
              <button 
                onClick={() => setSelectedUsers([])}
                className="btn btn-outline btn-small"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo dos usuários */}
        <div className="users-content">
          {loading ? (
            <div className="content-loading">
              <LoadingSpinner size="medium" message="Carregando usuários..." />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <h3>Nenhum usuário encontrado</h3>
              <p>{hasActiveFilters ? 'Tente ajustar os filtros de busca' : 'Ainda não há usuários cadastrados no sistema'}</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn btn-primary">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <div className="table-container">
              <div className="table-wrapper">
                <table className="users-table modern">
                  <thead>
                    <tr>
                      <th className="select-column">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === usuarios.length && usuarios.length > 0}
                          onChange={toggleSelectAll}
                          className="checkbox"
                        />
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('nome')}
                      >
                        <div className="th-content">
                          <span>Usuário</span>
                          {getSortIcon('nome')}
                        </div>
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('username')}
                      >
                        <div className="th-content">
                          <span>Username</span>
                          {getSortIcon('username')}
                        </div>
                      </th>
                      <th>Função</th>
                      <th>Status</th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('ultimoLogin')}
                      >
                        <div className="th-content">
                          <span>Último Login</span>
                          {getSortIcon('ultimoLogin')}
                        </div>
                      </th>
                      <th 
                        className="sortable"
                        onClick={() => handleSort('dataCriacao')}
                      >
                        <div className="th-content">
                          <span>Criado em</span>
                          {getSortIcon('dataCriacao')}
                        </div>
                      </th>
                      <th className="actions-column">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr 
                        key={usuario._id}
                        className={selectedUsers.includes(usuario._id) ? 'selected' : ''}
                      >
                        <td className="select-column">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(usuario._id)}
                            onChange={() => toggleUserSelection(usuario._id)}
                            className="checkbox"
                          />
                        </td>
                        <td>
                          <div className="user-cell">
                            <div className={`user-avatar ${usuario.ativo ? 'active' : 'inactive'}`}>
                              {usuario.nome?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="user-info">
                              <span className="user-name">{usuario.nome}</span>
                              <span className="user-id">#{usuario._id.slice(-6)}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="email-cell">
                            <span className="email-text">{usuario.username}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge modern role-${usuario.role.toLowerCase()}`}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              {usuario.role === 'ADM' ? (
                                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              ) : (
                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              )}
                            </svg>
                            {usuario.role === 'ADM' ? 'Admin' : 'Colaborador'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge modern ${usuario.ativo ? 'active' : 'inactive'}`}>
                            <div className="status-indicator"></div>
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <div className="date-cell">
                            <span className="date-text">{formatDate(usuario.ultimoLogin)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            <span className="date-text">{formatDate(usuario.dataCriacao)}</span>
                          </div>
                        </td>
                        <td className="actions-column">
                          <div className="action-buttons">
                            <button
                              onClick={() => toggleUserStatus(usuario._id, usuario.ativo)}
                              className={`action-btn ${
                                usuario.ativo ? 'deactivate' : 'activate'
                              }`}
                              disabled={actionLoading[usuario._id]}
                              title={usuario.ativo ? 'Desativar usuário' : 'Reativar usuário'}
                            >
                              {actionLoading[usuario._id] ? (
                                <div className="btn-spinner small"></div>
                              ) : usuario.ativo ? (
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="cards-container">
              <div className="users-grid">
                {usuarios.map((usuario) => (
                  <div 
                    key={usuario._id}
                    className={`user-card ${selectedUsers.includes(usuario._id) ? 'selected' : ''} ${usuario.ativo ? 'active' : 'inactive'}`}
                  >
                    <div className="card-header">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(usuario._id)}
                        onChange={() => toggleUserSelection(usuario._id)}
                        className="card-checkbox"
                      />
                      <div className={`card-avatar ${usuario.ativo ? 'active' : 'inactive'}`}>
                        {usuario.nome?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="card-status">
                        <span className={`status-dot ${usuario.ativo ? 'active' : 'inactive'}`}></span>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <h3 className="card-name">{usuario.nome}</h3>
                      <p className="card-email">{usuario.username}</p>
                      
                      <div className="card-meta">
                        <span className={`card-role role-${usuario.role.toLowerCase()}`}>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            {usuario.role === 'ADM' ? (
                              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            ) : (
                              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            )}
                          </svg>
                          {usuario.role === 'ADM' ? 'Administrador' : 'Colaborador'}
                        </span>
                      </div>
                      
                      <div className="card-dates">
                        <div className="date-item">
                          <span className="date-label">Último login:</span>
                          <span className="date-value">{formatDate(usuario.ultimoLogin)}</span>
                        </div>
                        <div className="date-item">
                          <span className="date-label">Criado em:</span>
                          <span className="date-value">{formatDate(usuario.dataCriacao)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button
                        onClick={() => toggleUserStatus(usuario._id, usuario.ativo)}
                        className={`card-action-btn ${
                          usuario.ativo ? 'deactivate' : 'activate'
                        }`}
                        disabled={actionLoading[usuario._id]}
                      >
                        {actionLoading[usuario._id] ? (
                          <div className="btn-spinner small"></div>
                        ) : (
                          <>
                            {usuario.ativo ? (
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {usuario.ativo ? 'Desativar' : 'Reativar'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Paginação moderna */}
        {pagination && pagination.totalPages > 1 && (
          <div className="modern-pagination">
            <div className="pagination-info">
              <span className="info-text">
                Exibindo <strong>{usuarios.length}</strong> de <strong>{pagination.totalUsers}</strong> usuários
              </span>
              <span className="page-info">
                Página <strong>{pagination.currentPage}</strong> de <strong>{pagination.totalPages}</strong>
              </span>
            </div>
            
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="pagination-btn first"
                title="Primeira página"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" />
                </svg>
              </button>
              
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev || loading}
                className="pagination-btn prev"
                title="Página anterior"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
                Anterior
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                      disabled={loading}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext || loading}
                className="pagination-btn next"
                title="Próxima página"
              >
                Próxima
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                </svg>
              </button>
              
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={currentPage === pagination.totalPages || loading}
                className="pagination-btn last"
                title="Última página"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Rodapé com estatísticas */}
        {pagination && (
          <div className="page-footer">
            <div className="footer-stats">
              <div className="stat-group">

              </div>
              
              {hasActiveFilters && (
                <div className="active-filters">
                  <span className="filters-label">Filtros ativos:</span>
                  <div className="filter-tags">
                    {searchTerm && (
                      <span className="filter-tag">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Busca: "{searchTerm}"
                      </span>
                    )}
                    {roleFilter && (
                      <span className="filter-tag">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Função: {roleFilter === 'ADM' ? 'Administrador' : 'Colaborador'}
                      </span>
                    )}
                    {statusFilter && (
                      <span className="filter-tag">
                        <CheckIcon />
                        Status: {statusFilter === 'true' ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                    <button onClick={clearFilters} className="clear-filters-btn">
                      <XIcon />
                      Limpar filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GerenciarUsuarios;
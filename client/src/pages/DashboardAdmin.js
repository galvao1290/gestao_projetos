import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const DashboardAdmin = () => {
  const [stats, setStats] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjetos, setLoadingProjetos] = useState(false);
  const [error, setError] = useState('');
  const [excluindoProjeto, setExcluindoProjeto] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    carregarEstatisticas();
    carregarProjetos();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/stats/dashboard');
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const carregarProjetos = async () => {
    try {
      setLoadingProjetos(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/projetos?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setProjetos(response.data.data.projetos);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoadingProjetos(false);
    }
  };

  const excluirProjeto = async (projetoId, nomeProjeto) => {
    console.log('Tentando excluir projeto:', projetoId, nomeProjeto);
    
    if (!window.confirm(`Tem certeza que deseja excluir o projeto "${nomeProjeto}"? Esta ação não pode ser desfeita.`)) {
      console.log('Exclusão cancelada pelo usuário');
      return;
    }

    try {
      console.log('Iniciando exclusão...');
      setExcluindoProjeto(projetoId);
      const token = localStorage.getItem('token');
      console.log('Token encontrado:', !!token);
      
      const response = await axios.delete(`/api/projetos/${projetoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Resposta da API:', response.data);
      
      if (response.data.success) {
        setProjetos(projetos.filter(p => p._id !== projetoId));
        setError('');
        console.log('Projeto excluído com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      console.error('Detalhes do erro:', error.response?.data);
      setError(error.response?.data?.message || 'Erro ao excluir projeto');
    } finally {
      setExcluindoProjeto(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard Administrativo</h1>
          <p>Bem-vindo, {user?.nome}!</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={carregarEstatisticas} className="btn btn-small">
              Tentar novamente
            </button>
          </div>
        )}

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon users">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>{stats.totalUsuarios}</h3>
                <p>Total de Usuários</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon active">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>{stats.usuariosAtivos}</h3>
                <p>Usuários Ativos</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon admin">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>{stats.administradores}</h3>
                <p>Administradores</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon collaborator">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>{stats.colaboradores}</h3>
                <p>Colaboradores</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon new">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>{stats.novosUsuarios}</h3>
                <p>Novos (30 dias)</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon inactive">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>{stats.usuariosInativos}</h3>
                <p>Usuários Inativos</p>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Projetos */}
        <div className="projetos-section">
          <div className="section-header">
            <h2>Projetos</h2>
            <div className="section-actions">
              <Link to="/criar-projeto" className="btn btn-primary">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Novo Projeto
              </Link>
            </div>
          </div>

          {loadingProjetos ? (
            <div className="loading-projetos">
              <div className="spinner"></div>
              <span>Carregando projetos...</span>
            </div>
          ) : projetos.length > 0 ? (
            <div className="projetos-grid">
              {projetos.map((projeto) => (
                <div key={projeto._id} className="projeto-card" style={{ position: 'relative' }}>
                  <div className="projeto-actions">
                    <button
                      type="button"
                      onClick={() => excluirProjeto(projeto._id, projeto.nome)}
                      className={`btn-delete ${excluindoProjeto === projeto._id ? 'loading' : ''}`}
                      disabled={excluindoProjeto === projeto._id}
                      title="Excluir projeto"
                    >
                      {excluindoProjeto === projeto._id ? (
                        <div className="spinner-small"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <Link 
                    to={`/projeto/${projeto._id}`} 
                    className="projeto-card-link"
                  >
                    <div className="projeto-header">
                      <h3>{projeto.nome}</h3>
                      <span 
                        className="status-badge"
                        data-status={projeto.status}
                      >
                        {projeto.status}
                      </span>
                    </div>
                    
                    {projeto.descricao && (
                      <p className="projeto-descricao">{projeto.descricao}</p>
                    )}
                    
                    <div className="projeto-meta">
                      <div className="meta-item">
                        <span className="meta-label">Criado por:</span>
                        <span className="meta-value">{projeto.criador?.nome}</span>
                      </div>
                      
                      <div className="meta-item">
                        <span className="meta-label">Progresso:</span>
                        <div className="progress-mini">
                          <div 
                            className="progress-fill"
                            style={{ width: `${projeto.progresso || 0}%` }}
                          ></div>
                          <span className="progress-text">{projeto.progresso || 0}%</span>
                        </div>
                      </div>
                      
                      <div className="meta-item">
                        <span className="meta-label">Linhas de dados:</span>
                        <span className="meta-value">
                          {projeto.dados?.linhas?.length || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="projeto-footer">
                      <span className="projeto-date">
                        Atualizado em {new Date(projeto.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="arrow-icon">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-projetos">
              <div className="empty-content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3>Nenhum projeto encontrado</h3>
                <p>Comece criando seu primeiro projeto</p>
                <Link to="/criar-projeto" className="btn btn-primary">
                  Criar Primeiro Projeto
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-actions">
          <div className="action-grid">
            <Link to="/usuarios" className="action-card">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <h3>Gerenciar Usuários</h3>
              <p>Visualizar, editar e gerenciar todos os usuários do sistema</p>
            </Link>

            <Link to="/perfil" className="action-card">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3>Meu Perfil</h3>
              <p>Visualizar e editar informações do seu perfil</p>
            </Link>

            <Link to="/criar-projeto" className="action-card">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h3>Criar Novo Projeto</h3>
              <p>Criar um novo projeto e importar dados via CSV</p>
            </Link>

            <div className="action-card disabled">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3>Relatórios</h3>
              <p>Em breve - Visualizar relatórios e análises</p>
            </div>
          </div>
        </div>

        <div className="dashboard-info">
          <div className="info-card">
            <h3>Sistema de Gestão de Projetos</h3>
            <p>
              Bem-vindo ao painel administrativo! Aqui você pode gerenciar usuários, 
              visualizar estatísticas e controlar o acesso ao sistema.
            </p>
            <ul>
              <li>✅ Sistema de autenticação implementado</li>
              <li>✅ Controle de roles (ADM/COLABORADOR)</li>
              <li>✅ Gerenciamento de usuários</li>
              <li>🔄 Gestão de projetos (em desenvolvimento)</li>
              <li>🔄 Sistema de relatórios (em desenvolvimento)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
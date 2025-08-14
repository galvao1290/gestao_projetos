import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import { UsersIcon, UserCheckIcon, ShieldIcon, CrownIcon, TrendingUpIcon, UserXIcon, PlusIcon, ChevronRightIcon, DeleteIcon, ProjectIcon, StatsIcon } from '../components/Icons';

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
                <UsersIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.totalUsuarios}</h3>
                <p>Total de Usuários</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon active">
                <UserCheckIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.usuariosAtivos}</h3>
                <p>Usuários Ativos</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon admin">
                <ShieldIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.administradores}</h3>
                <p>Administradores</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon collaborator">
                <CrownIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.colaboradores}</h3>
                <p>Colaboradores</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon new">
                <TrendingUpIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.novosUsuarios}</h3>
                <p>Novos (30 dias)</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon inactive">
                <UserXIcon />
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
                <PlusIcon />
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
                <div key={projeto._id} className="projeto-card-modern">
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => excluirProjeto(projeto._id, projeto.nome)}
                      className={`btn-delete-modern ${excluindoProjeto === projeto._id ? 'loading' : ''}`}
                      disabled={excluindoProjeto === projeto._id}
                      title="Excluir projeto"
                    >
                      {excluindoProjeto === projeto._id ? (
                        <div className="spinner-small"></div>
                      ) : (
                        <DeleteIcon size={18} />
                      )}
                    </button>
                  </div>
                  
                  <Link 
                    to={`/projeto/${projeto._id}`} 
                    className="card-content"
                  >
                    <div className="card-header">
                      <h3 className="card-title">{projeto.nome}</h3>
                      <div className="card-header-right">
                        {projeto.mensagensNaoLidas > 0 && (
                          <div className="notification-badge">
                            {projeto.mensagensNaoLidas}
                          </div>
                        )}
                        <div className="card-icon">
                          <ChevronRightIcon />
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <p className="card-description">
                        {projeto.descricao || 'Sem descrição disponível'}
                      </p>
                    </div>
                    
                    <div className="card-footer">
                      <div className="creator-info">
                        <div className="creator-avatar">
                          {projeto.criador?.nome?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="creator-details">
                          <span className="creator-label">Criado por</span>
                          <span className="creator-name">{projeto.criador?.nome || 'Administrador'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-projetos">
              <div className="empty-content">
                <ProjectIcon size={48} />
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
                <UsersIcon />
              </div>
              <h3>Gerenciar Usuários</h3>
              <p>Visualizar, editar e gerenciar todos os usuários do sistema</p>
            </Link>



            <Link to="/criar-projeto" className="action-card">
              <div className="action-icon">
                <PlusIcon />
              </div>
              <h3>Criar Novo Projeto</h3>
              <p>Criar um novo projeto e importar dados via CSV</p>
            </Link>


          </div>
        </div>


      </div>
    </div>
  );
};

export default DashboardAdmin;
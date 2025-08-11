import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const MeusProjetos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const carregarProjetos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/projetos/colaborador/meus', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjetos(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      setError('Erro ao carregar projetos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarProjetos();
  }, [carregarProjetos]);

  const projetosFiltrados = projetos.filter(projeto =>
    projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    projeto.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return '#10b981';
      case 'pausado': return '#f59e0b';
      case 'concluido': return '#6b7280';
      case 'cancelado': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baixa': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatarData = (data) => {
    if (!data) return 'Não definida';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Navbar />
        <div className="dashboard-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Meus Projetos</h1>
            <p>Projetos aos quais você foi atribuído como colaborador</p>
          </div>

        </div>

        <div className="dashboard-content">
          {error && (
            <div className="error-message">
              {error}
              <button 
                className="btn btn-secondary btn-sm"
                onClick={carregarProjetos}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          <div className="dashboard-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="projetos-stats">
              <span className="stat-item">
                Total: <strong>{projetos.length}</strong>
              </span>

            </div>
          </div>

          {projetosFiltrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Nenhum projeto encontrado</h3>
              <p>
                {searchTerm 
                  ? 'Nenhum projeto corresponde à sua busca.'
                  : 'Você ainda não foi atribuído a nenhum projeto.'
                }
              </p>
              {searchTerm && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => setSearchTerm('')}
                >
                  Limpar Busca
                </button>
              )}
            </div>
          ) : (
            <div className="projetos-grid">
              {projetosFiltrados.map(projeto => {
                const colaborador = projeto.colaboradores.find(c => c.usuario._id === user.id);
                
                return (
                  <div 
                    key={projeto._id} 
                    className="projeto-card clickable"
                    onClick={() => navigate(`/projeto/${projeto._id}`)}
                  >
                    <div className="projeto-header">
                      <h3 className="projeto-nome">{projeto.nome}</h3>
                      <div className="projeto-badges">
                        <span 
                          className="badge status-badge"
                          style={{ backgroundColor: getStatusColor(projeto.status) }}
                        >
                          {projeto.status}
                        </span>
                        <span 
                          className="badge prioridade-badge"
                          style={{ backgroundColor: getPrioridadeColor(projeto.prioridade) }}
                        >
                          {projeto.prioridade}
                        </span>
                      </div>
                    </div>
                    
                    <p className="projeto-descricao">{projeto.descricao}</p>
                    
                    <div className="projeto-info">
                      <div className="info-item">
                        <span className="info-label">Meu Papel:</span>
                        <span className="info-value papel-badge">
                          {colaborador?.papel || 'COLABORADOR'}
                        </span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-label">Progresso:</span>
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${projeto.progresso || 0}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{projeto.progresso || 0}%</span>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-label">Criado por:</span>
                        <span className="info-value">{projeto.criador?.nome || 'N/A'}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-label">Prazo:</span>
                        <span className="info-value">{formatarData(projeto.dataFim)}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-label">Colunas:</span>
                        <span className="info-value">{projeto.colunas?.length || 0}</span>
                      </div>
                    </div>
                    
                    <div className="projeto-footer">
                      <span className="data-adicao">
                        Adicionado em {formatarData(colaborador?.dataAdicao)}
                      </span>
                      <span className="click-hint">
                        Clique para abrir →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeusProjetos;
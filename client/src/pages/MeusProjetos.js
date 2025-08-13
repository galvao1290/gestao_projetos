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

  // Funções removidas pois não são mais utilizadas no design moderno

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
                
                return (
                  <div 
                    key={projeto._id} 
                    className="projeto-card-modern clickable"
                    onClick={() => navigate(`/projeto/${projeto._id}`)}
                  >
                    <div className="card-content">
                      <div className="card-header">
                        <h3 className="card-title">{projeto.nome}</h3>
                        <div className="card-icon">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
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
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

const GerenciarColaboradores = ({ projetoId, onClose }) => {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processando, setProcessando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const carregarColaboradores = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projetos/${projetoId}/colaboradores`);
      
      if (response.data.success) {
        setColaboradores(response.data.data.colaboradores);
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      setError('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregarColaboradores();
  }, [carregarColaboradores]);

  const adicionarColaborador = async (usuarioId, papel = 'DESENVOLVEDOR') => {
    try {
      setProcessando(true);
      const response = await axios.post(`/api/projetos/${projetoId}/colaboradores`, {
        usuarioId,
        papel
      });
      
      if (response.data.success) {
        await carregarColaboradores();
      }
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      setError(error.response?.data?.message || 'Erro ao adicionar colaborador');
    } finally {
      setProcessando(false);
    }
  };

  const removerColaborador = async (usuarioId) => {
    try {
      setProcessando(true);
      const response = await axios.delete(`/api/projetos/${projetoId}/colaboradores/${usuarioId}`);
      
      if (response.data.success) {
        await carregarColaboradores();
      }
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      setError(error.response?.data?.message || 'Erro ao remover colaborador');
    } finally {
      setProcessando(false);
    }
  };

  const colaboradoresFiltrados = colaboradores.filter(colaborador =>
    colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colaboradoresNoProjeto = colaboradoresFiltrados.filter(c => c.noProjeto);
  const colaboradoresDisponiveis = colaboradoresFiltrados.filter(c => !c.noProjeto);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content gerenciar-colaboradores">
          <LoadingSpinner message="Carregando colaboradores..." />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content gerenciar-colaboradores">
        <div className="modal-header">
          <h2>Gerenciar Colaboradores</h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-error">
              ×
            </button>
          </div>
        )}

        <div className="search-section">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="currentColor" className="search-icon">
              <path d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar colaboradores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="colaboradores-sections">
          {/* Colaboradores no Projeto */}
          <div className="colaboradores-section">
            <h3>Colaboradores no Projeto ({colaboradoresNoProjeto.length})</h3>
            <div className="colaboradores-list">
              {colaboradoresNoProjeto.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum colaborador no projeto</p>
                </div>
              ) : (
                colaboradoresNoProjeto.map(colaborador => (
                  <div key={colaborador._id} className="colaborador-card no-projeto">
                    <div className="colaborador-info">
                      <div className="colaborador-avatar">
                        {colaborador.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="colaborador-details">
                        <h4>{colaborador.nome}</h4>
                        <p>{colaborador.email}</p>
                        <span className="papel-badge">{colaborador.papel}</span>
                        {colaborador.dataAdicao && (
                          <small className="data-adicao">
                            Adicionado em {new Date(colaborador.dataAdicao).toLocaleDateString('pt-BR')}
                          </small>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removerColaborador(colaborador._id)}
                      disabled={processando}
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colaboradores Disponíveis */}
          <div className="colaboradores-section">
            <h3>Colaboradores Disponíveis ({colaboradoresDisponiveis.length})</h3>
            <div className="colaboradores-list">
              {colaboradoresDisponiveis.length === 0 ? (
                <div className="empty-state">
                  <p>Todos os colaboradores já estão no projeto</p>
                </div>
              ) : (
                colaboradoresDisponiveis.map(colaborador => (
                  <div key={colaborador._id} className="colaborador-card disponivel">
                    <div className="colaborador-info">
                      <div className="colaborador-avatar">
                        {colaborador.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="colaborador-details">
                        <h4>{colaborador.nome}</h4>
                        <p>{colaborador.email}</p>
                      </div>
                    </div>
                    <div className="colaborador-actions">
                      <select 
                        className="papel-select"
                        defaultValue="DESENVOLVEDOR"
                        id={`papel-${colaborador._id}`}
                      >
                        <option value="DESENVOLVEDOR">Desenvolvedor</option>
                        <option value="ANALISTA">Analista</option>
                        <option value="DESIGNER">Designer</option>
                        <option value="TESTER">Tester</option>
                        <option value="GERENTE">Gerente</option>
                      </select>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const papel = document.getElementById(`papel-${colaborador._id}`).value;
                          adicionarColaborador(colaborador._id, papel);
                        }}
                        disabled={processando}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GerenciarColaboradores;
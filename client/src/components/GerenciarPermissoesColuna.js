import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

const GerenciarPermissoesColuna = ({ projetoId, onClose, onPermissoesChange }) => {
  const [permissoes, setPermissoes] = useState([]);
  const [colunas, setColunas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState('');
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(new Set());

  const carregarPermissoes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/projetos/${projetoId}/permissoes-coluna`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPermissoes(response.data.data.permissoes);
        setColunas(response.data.data.colunas);
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      setError(error.response?.data?.message || 'Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregarPermissoes();
  }, [carregarPermissoes]);

  const atualizarPermissao = (colaboradorId, nomeColuna, novoTipo) => {
    setPermissoes(prevPermissoes => 
      prevPermissoes.map(permissaoColaborador => {
        if (permissaoColaborador.colaborador._id === colaboradorId) {
          const novasPermissoes = permissaoColaborador.permissoes.map(perm => 
            perm.nomeColuna === nomeColuna 
              ? { ...perm, tipo: novoTipo }
              : perm
          );
          
          // Marcar colaborador como tendo alterações pendentes
          setAlteracoesPendentes(prev => new Set([...prev, colaboradorId]));
          
          return {
            ...permissaoColaborador,
            permissoes: novasPermissoes
          };
        }
        return permissaoColaborador;
      })
    );
  };

  const salvarPermissoesColaborador = async (colaboradorId) => {
    console.log('ADM ESTÁ SALVANDO ESTES DADOS:', { colaboradorId, permissoesParaSalvar: permissoes.find(p => p.colaborador._id === colaboradorId)?.permissoes });
    try {
      setSalvando(true);
      
      const permissoesColaborador = permissoes.find(
        p => p.colaborador._id === colaboradorId
      );
      
      if (!permissoesColaborador) return;
      
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/projetos/${projetoId}/permissoes-coluna/${colaboradorId}`,
        { colaboradorId: colaboradorId, permissoes: permissoesColaborador.permissoes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remover das alterações pendentes
      setAlteracoesPendentes(prev => {
        const novas = new Set(prev);
        novas.delete(colaboradorId);
        return novas;
      });
      
      // Recarregar permissões na planilha
      if (onPermissoesChange) {
        onPermissoesChange();
      }
      
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      setError(error.response?.data?.message || 'Erro ao salvar permissões');
    } finally {
      setSalvando(false);
    }
  };

  const salvarTodasPermissoes = async () => {
    try {
      setSalvando(true);
      
      const token = localStorage.getItem('token');
      
      // Salvar permissões de todos os colaboradores com alterações pendentes
      for (const colaboradorId of alteracoesPendentes) {
        const permissoesColaborador = permissoes.find(
          p => p.colaborador._id === colaboradorId
        );
        
        if (permissoesColaborador) {
          await axios.put(
            `/api/projetos/${projetoId}/permissoes-coluna/${colaboradorId}`,
            { colaboradorId: colaboradorId, permissoes: permissoesColaborador.permissoes },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      
      setAlteracoesPendentes(new Set());
      
      // Recarregar permissões na planilha
      if (onPermissoesChange) {
        onPermissoesChange();
      }
      
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      setError(error.response?.data?.message || 'Erro ao salvar permissões');
    } finally {
      setSalvando(false);
    }
  };



  const getTipoPermissaoColor = (tipo) => {
    switch (tipo) {
      case 'OCULTA': return '#ef4444';
      case 'APENAS_LEITURA': return '#f59e0b';
      case 'LEITURA_ESCRITA': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content permissoes-coluna-modal">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content permissoes-coluna-modal">
        <div className="modal-header">
          <h2>Gerenciar Permissões de Coluna</h2>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button className="close-error" onClick={() => setError('')}>
              ×
            </button>
          </div>
        )}

        <div className="permissoes-content">
          <div className="permissoes-info">
            <p>Configure as permissões de cada colaborador para cada coluna da planilha:</p>
            <div className="legenda-permissoes">
              <div className="legenda-item">
                <span className="legenda-cor" style={{ backgroundColor: '#ef4444' }}></span>
                <span>Oculta - Coluna não aparece</span>
              </div>
              <div className="legenda-item">
                <span className="legenda-cor" style={{ backgroundColor: '#f59e0b' }}></span>
                <span>Apenas Leitura - Visualiza mas não edita</span>
              </div>
              <div className="legenda-item">
                <span className="legenda-cor" style={{ backgroundColor: '#10b981' }}></span>
                <span>Leitura e Escrita - Visualiza e edita</span>
              </div>
            </div>
          </div>

          <div className="permissoes-tabela-container">
            <table className="permissoes-tabela">
              <thead>
                <tr>
                  <th className="colaborador-header">Colaborador</th>
                  {colunas.map(coluna => (
                    <th key={coluna.nome} className="coluna-header">
                      {coluna.nome}
                      <span className="tipo-coluna">({coluna.tipo})</span>
                    </th>
                  ))}
                  <th className="acoes-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {permissoes.map(permissaoColaborador => (
                  <tr key={permissaoColaborador.colaborador._id}>
                    <td className="colaborador-cell">
                      <div className="colaborador-info">
                        <div className="colaborador-avatar">
                          {permissaoColaborador.colaborador.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="colaborador-details">
                          <div className="colaborador-nome">
                            {permissaoColaborador.colaborador.nome}
                          </div>
                          <div className="colaborador-email">
                            {permissaoColaborador.colaborador.email}
                          </div>
                          <div className="colaborador-papel">
                            {permissaoColaborador.papel}
                          </div>
                        </div>
                      </div>
                    </td>
                    {colunas.map(coluna => {
                      const permissaoColuna = permissaoColaborador.permissoes.find(
                        p => p.nomeColuna === coluna.nome
                      );
                      const tipoAtual = permissaoColuna?.tipo || 'LEITURA_ESCRITA';
                      
                      return (
                        <td key={coluna.nome} className="permissao-cell">
                          <select
                            value={tipoAtual}
                            onChange={(e) => atualizarPermissao(
                              permissaoColaborador.colaborador._id,
                              coluna.nome,
                              e.target.value
                            )}
                            className="permissao-select"
                            style={{ borderColor: getTipoPermissaoColor(tipoAtual) }}
                          >
                            <option value="OCULTA">Oculta</option>
                            <option value="APENAS_LEITURA">Apenas Leitura</option>
                            <option value="LEITURA_ESCRITA">Leitura e Escrita</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="acoes-cell">
                      {alteracoesPendentes.has(permissaoColaborador.colaborador._id) && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => salvarPermissoesColaborador(permissaoColaborador.colaborador._id)}
                          disabled={salvando}
                        >
                          Salvar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-info">
            {alteracoesPendentes.size > 0 && (
              <span className="alteracoes-pendentes">
                {alteracoesPendentes.size} colaborador(es) com alterações pendentes
              </span>
            )}
          </div>
          <div className="footer-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
            {alteracoesPendentes.size > 0 && (
              <button
                className="btn btn-primary"
                onClick={salvarTodasPermissoes}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Todas'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerenciarPermissoesColuna;
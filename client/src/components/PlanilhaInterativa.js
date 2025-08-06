import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const PlanilhaInterativa = ({ dados, projeto, onDadosChange, readOnly = false, permissoesColuna = {}, carregandoPermissoes = false }) => {
  const { user } = useAuth();
  const [dadosLocais, setDadosLocais] = useState(dados || { colunas: [], linhas: [] });
  const [editandoCelula, setEditandoCelula] = useState(null);
  const [valorEdicao, setValorEdicao] = useState('');
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [filtros, setFiltros] = useState({});
  const [ordenacao, setOrdenacao] = useState({ coluna: null, direcao: 'asc' });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhasPorPagina] = useState(20);

  useEffect(() => {
    if (dados) {
      setDadosLocais(dados);
    }
  }, [dados]);



  // Função para obter permissão de uma coluna específica
  const getPermissaoColuna = (nomeColuna) => {
    if (user?.role === 'ADM') {
      return 'LEITURA_ESCRITA'; // ADMs têm acesso total
    }
    
    // Para colaboradores, usar permissão específica ou padrão seguro
    return permissoesColuna[nomeColuna] || 'APENAS_LEITURA'; // ← Padrão mais seguro
  };
  
  // Função para verificar se o usuário pode editar uma coluna
  const podeEditarColuna = (nomeColuna) => {
    return getPermissaoColuna(nomeColuna) === 'LEITURA_ESCRITA';
  };
  
  // Função para verificar se uma coluna está oculta
  const colunaEstaOculta = (nomeColuna) => {
    return getPermissaoColuna(nomeColuna) === 'OCULTA';
  };

  const iniciarEdicao = (linhaIndex, colunaIndex) => {
    if (readOnly) return;
    
    const nomeColuna = dadosLocais.colunas[colunaIndex];
    if (!podeEditarColuna(nomeColuna)) {
      toast.warning('Você não tem permissão para editar esta coluna.');
      return;
    }
    
    setEditandoCelula({ linha: linhaIndex, coluna: colunaIndex });
    const valorAtual = dadosLocais.linhas[linhaIndex]?.[colunaIndex] || '';
    setValorEdicao(valorAtual);
  };

  const cancelarEdicao = () => {
    setEditandoCelula(null);
    setValorEdicao('');
  };

  const salvarEdicao = async () => {
    if (!editandoCelula) return;

    const novosDados = { ...dadosLocais };
    if (!novosDados.linhas[editandoCelula.linha]) {
      novosDados.linhas[editandoCelula.linha] = [];
    }
    novosDados.linhas[editandoCelula.linha][editandoCelula.coluna] = valorEdicao;

    setDadosLocais(novosDados);
    setEditandoCelula(null);
    setValorEdicao('');

    if (onDadosChange) {
      onDadosChange(novosDados);
    }

    // Salvar no backend se o projeto já existe
    if (projeto?._id && !readOnly) {
      await salvarDadosBackend(novosDados);
    }
  };

  const salvarDadosBackend = async (dados) => {
    setSalvandoDados(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/projetos/${projeto._id}/dados`, {
        dados
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Dados salvos com sucesso!');
      } else {
        toast.error('Erro ao salvar dados: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      const message = error.response?.data?.message || 'Erro ao salvar dados';
      toast.error(message);
    } finally {
      setSalvandoDados(false);
    }
  };

  const adicionarLinha = () => {
    if (readOnly) return;
    
    const novaLinha = new Array(dadosLocais.colunas.length).fill('');
    const novosDados = {
      ...dadosLocais,
      linhas: [...dadosLocais.linhas, novaLinha]
    };
    
    setDadosLocais(novosDados);
    if (onDadosChange) {
      onDadosChange(novosDados);
    }
  };

  const removerLinha = (index) => {
    if (readOnly) return;
    
    const novosDados = {
      ...dadosLocais,
      linhas: dadosLocais.linhas.filter((_, i) => i !== index)
    };
    
    setDadosLocais(novosDados);
    if (onDadosChange) {
      onDadosChange(novosDados);
    }
  };

  const adicionarColuna = () => {
    if (readOnly) return;
    
    if (user?.role !== 'ADM') {
      toast.warning('Apenas administradores podem adicionar colunas.');
      return;
    }
    
    const nomeColuna = prompt('Nome da nova coluna:');
    if (!nomeColuna) return;
    
    const novosDados = {
      colunas: [...dadosLocais.colunas, nomeColuna],
      linhas: dadosLocais.linhas.map(linha => [...linha, ''])
    };
    
    setDadosLocais(novosDados);
    if (onDadosChange) {
      onDadosChange(novosDados);
    }
  };

  const aplicarFiltro = (colunaIndex, valor) => {
    setFiltros(prev => ({
      ...prev,
      [colunaIndex]: valor
    }));
    setPaginaAtual(1);
  };

  const aplicarOrdenacao = (colunaIndex) => {
    const novaDirecao = ordenacao.coluna === colunaIndex && ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    setOrdenacao({ coluna: colunaIndex, direcao: novaDirecao });
    setPaginaAtual(1);
  };

  const linhasFiltradas = dadosLocais.linhas.filter(linha => {
    return Object.entries(filtros).every(([colunaIndex, filtro]) => {
      if (!filtro) return true;
      const valor = linha[parseInt(colunaIndex)] || '';
      return valor.toString().toLowerCase().includes(filtro.toLowerCase());
    });
  });

  const linhasOrdenadas = [...linhasFiltradas].sort((a, b) => {
    if (ordenacao.coluna === null) return 0;
    
    const valorA = a[ordenacao.coluna] || '';
    const valorB = b[ordenacao.coluna] || '';
    
    const comparacao = valorA.toString().localeCompare(valorB.toString(), 'pt-BR', { numeric: true });
    return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
  });

  const totalPaginas = Math.ceil(linhasOrdenadas.length / linhasPorPagina);
  const indiceInicio = (paginaAtual - 1) * linhasPorPagina;
  const indiceFim = indiceInicio + linhasPorPagina;
  const linhasPaginadas = linhasOrdenadas.slice(indiceInicio, indiceFim);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      salvarEdicao();
    } else if (e.key === 'Escape') {
      cancelarEdicao();
    }
  };

  // Mostrar loading enquanto carrega permissões para colaboradores
  if (carregandoPermissoes && user?.role !== 'ADM') {
    return (
      <div className="planilha-container">
        <div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner"></div>
          <p>Carregando permissões...</p>
        </div>
      </div>
    );
  }

  if (!dadosLocais.colunas || dadosLocais.colunas.length === 0) {
    return (
      <div className="planilha-vazia">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
          <h3>Nenhum dado disponível</h3>
          <p>Faça o upload de um arquivo CSV para visualizar os dados aqui.</p>
          {!readOnly && (
            <button className="btn btn-primary" onClick={adicionarColuna}>
              Criar Primeira Coluna
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="planilha-container">
      <div className="planilha-header">
        <div className="planilha-info">
          <h3>Dados do Projeto</h3>
          <span className="data-count">
            {linhasOrdenadas.length} linha(s) • {dadosLocais.colunas.length} coluna(s)
          </span>
        </div>
        
        {!readOnly && (
          <div className="planilha-actions">
            <button className="btn btn-sm btn-outline" onClick={adicionarColuna}>
              + Coluna
            </button>
            <button className="btn btn-sm btn-outline" onClick={adicionarLinha}>
              + Linha
            </button>
            {salvandoDados && (
              <div className="saving-indicator">
                <div className="spinner-sm"></div>
                Salvando...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="planilha-wrapper">
        <table className="planilha-table">
          <thead>
            <tr>
              {!readOnly && <th className="row-actions">#</th>}
              {dadosLocais.colunas.map((coluna, index) => {
                if (colunaEstaOculta(coluna)) {
                  return null; // Não renderizar colunas ocultas
                }
                
                const podeEditar = podeEditarColuna(coluna);
                
                return (
                  <th key={index} className={`column-header ${!podeEditar ? 'readonly-column' : ''}`}>
                    <div className="column-header-content">
                      <span 
                        className="column-title"
                        onClick={() => aplicarOrdenacao(index)}
                      >
                        {coluna}
                        {!podeEditar && (
                          <span className="readonly-indicator" title="Apenas leitura">
                            🔒
                          </span>
                        )}
                        {ordenacao.coluna === index && (
                          <span className="sort-indicator">
                            {ordenacao.direcao === 'asc' ? ' ↑' : ' ↓'}
                          </span>
                        )}
                      </span>
                      <input
                        type="text"
                        placeholder="Filtrar..."
                        className="column-filter"
                        value={filtros[index] || ''}
                        onChange={(e) => aplicarFiltro(index, e.target.value)}
                      />
                    </div>
                  </th>
                );
              }).filter(Boolean)}
            </tr>
          </thead>
          <tbody>
            {linhasPaginadas.map((linha, linhaIndex) => {
              const linhaOriginalIndex = dadosLocais.linhas.indexOf(linha);
              return (
                <tr key={linhaOriginalIndex}>
                  {!readOnly && (
                    <td className="row-actions">
                      <button
                        className="btn-icon btn-danger-outline"
                        onClick={() => removerLinha(linhaOriginalIndex)}
                        title="Remover linha"
                      >
                        ×
                      </button>
                    </td>
                  )}
                  {linha.map((celula, colunaIndex) => {
                    const nomeColuna = dadosLocais.colunas[colunaIndex];
                    
                    if (colunaEstaOculta(nomeColuna)) {
                      return null; // Não renderizar células de colunas ocultas
                    }
                    
                    const podeEditar = podeEditarColuna(nomeColuna);
                    const isReadOnlyCell = readOnly || !podeEditar;
                    
                    return (
                      <td key={colunaIndex} className={`data-cell ${!podeEditar ? 'readonly-cell' : ''}`}>
                        {editandoCelula?.linha === linhaOriginalIndex && editandoCelula?.coluna === colunaIndex ? (
                          <input
                            type="text"
                            value={valorEdicao}
                            onChange={(e) => setValorEdicao(e.target.value)}
                            onBlur={salvarEdicao}
                            onKeyPress={handleKeyPress}
                            className="cell-input"
                            autoFocus
                          />
                        ) : (
                          <div
                            className={`cell-content ${!isReadOnlyCell ? 'editable' : 'readonly'}`}
                            onClick={() => iniciarEdicao(linhaOriginalIndex, colunaIndex)}
                            title={!podeEditar ? 'Apenas leitura' : ''}
                          >
                            {celula || ''}
                          </div>
                        )}
                      </td>
                    );
                  }).filter(Boolean)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="planilha-pagination">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
            disabled={paginaAtual === 1}
          >
            Anterior
          </button>
          
          <span className="pagination-info">
            Página {paginaAtual} de {totalPaginas}
          </span>
          
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
            disabled={paginaAtual === totalPaginas}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanilhaInterativa;
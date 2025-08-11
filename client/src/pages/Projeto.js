import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import PlanilhaInterativa from '../components/PlanilhaInterativa';
import GerenciarColaboradores from '../components/GerenciarColaboradores';
import GerenciarPermissoesColuna from '../components/GerenciarPermissoesColuna';

const Projeto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projeto, setProjeto] = useState(null);
  const [dadosCSV, setDadosCSV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarGerenciarColaboradores, setMostrarGerenciarColaboradores] = useState(false);
  const [mostrarPermissoesColuna, setMostrarPermissoesColuna] = useState(false);
  const [permissoesColuna, setPermissoesColuna] = useState({});
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);

  const carregarPermissoesColuna = useCallback(async () => {
    console.log('DIAGNÓSTICO FINAL: Entrei na função carregarPermissoesColuna. User:', user);
    if (!id || !user?._id) {  // ← Usar user._id consistentemente
      setCarregandoPermissoes(false);
      return;
    }
  
    if (user?.role === 'ADM') {
      setPermissoesColuna({});
      setCarregandoPermissoes(false);
      return;
    }
  
    setCarregandoPermissoes(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/projetos/${id}/permissoes-coluna/${user._id}?cacheBust=${new Date().getTime()}`, // ← Usar user._id
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          } 
        }
      );
      
      console.log('DIAGNÓSTICO: Resposta do backend:', response.data); // ← Adicionar log
      
      const permissoesMap = {};
      const permissoes = response.data.data?.permissoes || [];
      permissoes.forEach(permissao => {
        permissoesMap[permissao.nomeColuna] = permissao.tipo;
      });
      
      console.log('DIAGNÓSTICO: Permissões processadas:', permissoesMap); // ← Adicionar log
      setPermissoesColuna(permissoesMap);
    } catch (error) {
      console.error('Erro ao carregar permissões de coluna:', error);
      setPermissoesColuna({}); // ← Manter vazio para usar padrão seguro
    } finally {
      setCarregandoPermissoes(false);
    }
  }, [id, user]);

  const carregarProjeto = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Usar endpoint específico para colaboradores se não for ADM
      const endpoint = user?.role === 'ADM' 
        ? `/api/projetos/${id}`
        : `/api/projetos/${id}`; // Mesmo endpoint, mas com verificação de permissão no backend
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const projetoData = response.data.data;
        setProjeto(projetoData);
        
        // Converter dados para formato da planilha
        const dadosConvertidos = converterDadosParaPlanilha(projetoData.dados);
        setDadosCSV(dadosConvertidos);
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      if (error.response?.status === 404) {
        setError('Projeto não encontrado');
      } else if (error.response?.status === 403) {
        setError('Você não tem permissão para acessar este projeto');
      } else {
        setError('Erro ao carregar projeto');
      }
    } finally {
      setLoading(false);
    }
  }, [id, user?.role]);

  useEffect(() => {
    carregarProjeto();
  }, [carregarProjeto]);

  useEffect(() => {
    if (id) {
      carregarPermissoesColuna();
    }
  }, [id, carregarPermissoesColuna]);

  // Função para converter dados do backend para formato da planilha
  const converterDadosParaPlanilha = (dadosBackend) => {
    if (!dadosBackend || !dadosBackend.colunas || !dadosBackend.linhas) {
      return { colunas: [], linhas: [] };
    }

    const colunas = dadosBackend.colunas.map(col => 
      typeof col === 'string' ? col : col.nome
    );

    const linhas = dadosBackend.linhas.map(linha => {
      if (Array.isArray(linha)) {
        return linha;
      }
      
      // Se a linha tem estrutura {dados: {...}, ...}
      if (linha.dados) {
        return colunas.map(coluna => linha.dados[coluna] || '');
      }
      
      // Se a linha é um objeto direto
      return colunas.map(coluna => linha[coluna] || '');
    });

    return { colunas, linhas };
  };

  const handleDadosChange = async (novosDados) => {
    setDadosCSV(novosDados);
    
    // Salvar automaticamente no backend quando há mudanças
    if (projeto?._id) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`/api/projetos/${projeto._id}/dados`, {
          dados: novosDados
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          // Dados salvos com sucesso - não mostrar toast para não incomodar o usuário
          console.log('Dados salvos automaticamente');
        } else {
          toast.error('Erro ao salvar dados: ' + response.data.message);
        }
      } catch (error) {
        console.error('Erro ao salvar dados automaticamente:', error);
        const message = error.response?.data?.message || 'Erro ao salvar dados';
        toast.error(message);
      }
    }
  };

  const voltarParaDashboard = () => {
    if (user?.role === 'ADM') {
      navigate('/admin');
    } else {
      navigate('/meus-projetos');
    }
  };


  if (loading) {
    return <LoadingSpinner message="Carregando projeto..." />;
  }

  if (error) {
    return (
      <div className="dashboard">
        <Navbar />
        <div className="dashboard-container">
          <div className="error-container">
            <div className="error-card">
              <h2>Erro</h2>
              <p>{error}</p>
              <button onClick={voltarParaDashboard} className="btn btn-primary">
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-container">
        {/* Header do Projeto */}
        <div className="projeto-header">
          <div className="projeto-header-content">
            <div className="projeto-title-section">
              <button 
                onClick={voltarParaDashboard}
                className="btn-back"
                title={user?.role === 'ADM' ? 'Voltar ao Dashboard' : 'Voltar aos Meus Projetos'}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 12H5m7-7l-7 7 7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div>
                <h1>{projeto?.nome}</h1>
                {projeto?.descricao && (
                  <p className="projeto-descricao">{projeto.descricao}</p>
                )}
              </div>
            </div>
            
            {user?.role === 'ADM' && (
                <>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setMostrarGerenciarColaboradores(true)}
                  >
                    Gerenciar Colaboradores
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setMostrarPermissoesColuna(true)}
                  >
                    Permissões de Coluna
                  </button>
                </>
              )}
            
          </div>
        </div>

        {/* Planilha Interativa */}
        <div className="projeto-content">
          <div className="planilha-section">
            <div className="section-header">
              <h2>Dados do Projeto</h2>
              <div className="section-actions">
                {dadosCSV && dadosCSV.linhas && (
                  <span className="data-count">
                    {dadosCSV.linhas.length} {dadosCSV.linhas.length === 1 ? 'linha' : 'linhas'}
                  </span>
                )}
              </div>
            </div>
            
            {dadosCSV && dadosCSV.colunas && dadosCSV.colunas.length > 0 ? (
              <PlanilhaInterativa
                dados={dadosCSV}
                projeto={projeto}
                onDadosChange={handleDadosChange}
                onPermissoesChange={carregarPermissoesColuna}
                permissoesColuna={permissoesColuna}
                carregandoPermissoes={carregandoPermissoes}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <h3>Nenhum dado encontrado</h3>
                  <p>Este projeto ainda não possui dados importados.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Gerenciar Colaboradores */}
      {mostrarGerenciarColaboradores && (
        <GerenciarColaboradores
          projetoId={id}
          onClose={() => setMostrarGerenciarColaboradores(false)}
        />
      )}
      
      {mostrarPermissoesColuna && (
            <GerenciarPermissoesColuna
              projetoId={id}
              onClose={() => setMostrarPermissoesColuna(false)}
              onPermissoesChange={carregarPermissoesColuna}
            />
          )}
    </div>
  );
};

export default Projeto;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PlanilhaInterativa from '../components/PlanilhaInterativa';
import { UploadIcon } from '../components/Icons';

const CriarProjeto = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [etapa, setEtapa] = useState(1); // 1: Dados básicos, 2: Upload CSV, 3: Visualização
  
  const [dadosProjeto, setDadosProjeto] = useState({
    nome: '',
    descricao: '',
    dataPrevisao: ''
  });
  
  const [projeto, setProjeto] = useState(null);
  const [arquivoCSV, setArquivoCSV] = useState(null);
  const [dadosCSV, setDadosCSV] = useState(null);

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

  // Função para converter dados da planilha para formato do backend
  const converterDadosParaBackend = (dadosPlanilha) => {
    if (!dadosPlanilha || !dadosPlanilha.colunas || !dadosPlanilha.linhas) {
      return { colunas: [], linhas: [] };
    }

    const colunas = dadosPlanilha.colunas.map(col => ({
      nome: col,
      tipo: 'texto',
      obrigatorio: false
    }));

    const linhas = dadosPlanilha.linhas.map(linha => {
      const dados = {};
      dadosPlanilha.colunas.forEach((coluna, index) => {
        dados[coluna] = linha[index] || '';
      });
      return {
        dados,
        criadoEm: new Date()
      };
    });

    return { colunas, linhas };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDadosProjeto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Por favor, selecione um arquivo CSV válido');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }
      setArquivoCSV(file);
    }
  };

  const criarProjeto = async () => {
    if (!dadosProjeto.nome.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/projetos', dadosProjeto);

      if (response.data.success) {
        setProjeto(response.data.data);
        setEtapa(2);
        toast.success('Projeto criado com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao criar projeto');
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      const message = error.response?.data?.message || 'Erro ao criar projeto';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const uploadCSV = async () => {
    if (!arquivoCSV) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setUploadingCSV(true);
    try {
      const formData = new FormData();
      formData.append('csv', arquivoCSV);

      const response = await axios.post(`/api/projetos/${projeto._id}/upload-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setProjeto(response.data.data.projeto);
        // Converter dados do backend para formato da planilha
        const dadosConvertidos = converterDadosParaPlanilha(response.data.data.projeto.dados);
        setDadosCSV(dadosConvertidos);
        setEtapa(3);
        toast.success('CSV processado com sucesso!');
        
        if (response.data.data.estatisticas.erros.length > 0) {
          toast.warning(`${response.data.data.estatisticas.erros.length} erro(s) encontrado(s) no processamento`);
        }
      } else {
        toast.error(response.data.message || 'Erro ao processar CSV');
      }
    } catch (error) {
      console.error('Erro ao fazer upload do CSV:', error);
      const message = error.response?.data?.message || 'Erro ao fazer upload do arquivo';
      toast.error(message);
    } finally {
      setUploadingCSV(false);
    }
  };

  const pularUpload = () => {
    setEtapa(3);
    setDadosCSV({
      colunas: [],
      linhas: []
    });
  };

  const finalizarCriacao = () => {
    toast.success('Projeto criado e configurado com sucesso!');
    navigate('/admin');
  };

  const voltarEtapa = () => {
    if (etapa > 1) {
      setEtapa(etapa - 1);
    }
  };

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-container">
        <div className="page-header">
          <h1>Criar Novo Projeto</h1>
          <p>Configure seu projeto e importe dados via CSV</p>
        </div>

        {/* Indicador de Etapas */}
        <div className="steps-indicator">
          <div className={`step ${etapa >= 1 ? 'active' : ''} ${etapa > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Dados Básicos</div>
          </div>
          <div className={`step ${etapa >= 2 ? 'active' : ''} ${etapa > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Upload CSV</div>
          </div>
          <div className={`step ${etapa >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Visualização</div>
          </div>
        </div>

        {/* Etapa 1: Dados Básicos */}
        {etapa === 1 && (
          <div className="card">
            <h2>Informações do Projeto</h2>
            <form onSubmit={(e) => { e.preventDefault(); criarProjeto(); }}>
              <div className="form-group">
                <label htmlFor="nome">Nome do Projeto *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={dadosProjeto.nome}
                  onChange={handleInputChange}
                  placeholder="Digite o nome do projeto"
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={dadosProjeto.descricao}
                  onChange={handleInputChange}
                  placeholder="Descreva o objetivo e escopo do projeto"
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dataPrevisao">Data de Previsão</label>
                <input
                  type="date"
                  id="dataPrevisao"
                  name="dataPrevisao"
                  value={dadosProjeto.dataPrevisao}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate('/admin')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Criando...
                    </>
                  ) : (
                    'Criar Projeto'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Etapa 2: Upload CSV */}
        {etapa === 2 && (
          <div className="card">
            <h2>Upload de Dados CSV</h2>
            <p>Faça o upload de um arquivo CSV para importar dados para o projeto.</p>
            
            <div className="upload-area">
              <div className="upload-info">
                <UploadIcon size={48} />
                <h3>Selecione um arquivo CSV</h3>
                <p>Tamanho máximo: 10MB</p>
              </div>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file-input"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="btn btn-outline">
                Escolher Arquivo
              </label>
              
              {arquivoCSV && (
                <div className="file-selected">
                  <UploadIcon size={16} />
                  <span>{arquivoCSV.name}</span>
                  <span className="file-size">({(arquivoCSV.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            <div className="csv-requirements">
              <h4>Requisitos do arquivo CSV:</h4>
              <ul>
                <li>Primeira linha deve conter os cabeçalhos das colunas</li>
                <li>Dados separados por vírgula</li>
                <li>Codificação UTF-8 recomendada</li>
                <li>Tamanho máximo de 10MB</li>
              </ul>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={voltarEtapa}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={pularUpload}
              >
                Pular Upload
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={uploadCSV}
                disabled={!arquivoCSV || uploadingCSV}
              >
                {uploadingCSV ? (
                  <>
                    <div className="btn-spinner"></div>
                    Processando...
                  </>
                ) : (
                  'Processar CSV'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Visualização */}
        {etapa === 3 && (
          <div className="visualization-container">
            <div className="card">
              <div className="project-summary">
                <h2>Projeto: {projeto?.nome}</h2>
                {projeto?.descricao && <p>{projeto.descricao}</p>}
                
                <div className="project-stats">
                  <div className="stat">
                    <span className="stat-label">Colunas:</span>
                    <span className="stat-value">{dadosCSV?.colunas?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Linhas:</span>
                    <span className="stat-value">{dadosCSV?.linhas?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Status:</span>
                    <span className="stat-value">{projeto?.status || 'PLANEJAMENTO'}</span>
                  </div>
                </div>
              </div>
            </div>

            {dadosCSV && (
              <PlanilhaInterativa
                  dados={dadosCSV}
                  projeto={projeto}
                  onDadosChange={(novosDados) => {
                    setDadosCSV(novosDados);
                    // Aqui você pode salvar automaticamente ou aguardar ação do usuário
                  }}
                  readOnly={false}
                />
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={voltarEtapa}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={finalizarCriacao}
              >
                Finalizar Projeto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriarProjeto;
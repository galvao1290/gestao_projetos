import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const ComentariosProjeto = ({ projetoId }) => {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [textoEdicao, setTextoEdicao] = useState('');

  const carregarComentarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projetos/${projetoId}/comentarios`);
      if (response.data.success) {
        setComentarios(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar comentários');
      }
    } finally {
      setLoading(false);
    }
  }, [projetoId]);

  useEffect(() => {
    if (projetoId) {
      carregarComentarios();
    }
  }, [projetoId, carregarComentarios]);

  const adicionarComentario = async (e) => {
    e.preventDefault();
    if (!novoComentario.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    try {
      setEnviando(true);
      const response = await axios.post(`/api/projetos/${projetoId}/comentarios`, {
        texto: novoComentario.trim()
      });

      if (response.data.success) {
        setComentarios(prev => [response.data.data, ...prev]);
        setNovoComentario('');
        toast.success('Comentário adicionado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error(error.response?.data?.message || 'Erro ao adicionar comentário');
    } finally {
      setEnviando(false);
    }
  };

  const iniciarEdicao = (comentario) => {
    setEditando(comentario._id);
    setTextoEdicao(comentario.texto);
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setTextoEdicao('');
  };

  const salvarEdicao = async (comentarioId) => {
    if (!textoEdicao.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    try {
      const response = await axios.put(`/api/projetos/${projetoId}/comentarios/${comentarioId}`, {
        texto: textoEdicao.trim()
      });

      if (response.data.success) {
        setComentarios(prev => 
          prev.map(comentario => 
            comentario._id === comentarioId ? response.data.data : comentario
          )
        );
        setEditando(null);
        setTextoEdicao('');
        toast.success('Comentário atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      toast.error(error.response?.data?.message || 'Erro ao editar comentário');
    }
  };

  const excluirComentario = async (comentarioId) => {
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/projetos/${projetoId}/comentarios/${comentarioId}`);

      if (response.data.success) {
        setComentarios(prev => prev.filter(comentario => comentario._id !== comentarioId));
        toast.success('Comentário excluído com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir comentário');
    }
  };

  const formatarData = (data) => {
    const agora = new Date();
    const dataComentario = new Date(data);
    const diffMs = agora - dataComentario;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 1) {
      return 'Agora mesmo';
    } else if (diffMinutos < 60) {
      return `${diffMinutos} min atrás`;
    } else if (diffHoras < 24) {
      return `${diffHoras}h atrás`;
    } else if (diffDias < 7) {
      return `${diffDias}d atrás`;
    } else {
      return dataComentario.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const podeEditarOuExcluir = (comentario) => {
    return user?.role === 'ADM' || comentario.autor._id === user?.id;
  };

  if (loading) {
    return (
      <div className="comentarios-container">
        <div className="comentarios-loading">
          <div className="spinner"></div>
          <span>Carregando comentários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="comentarios-container">
      <div className="comentarios-header">
        <h3>Comentários</h3>
        <span className="comentarios-count">
          {comentarios.length} {comentarios.length === 1 ? 'comentário' : 'comentários'}
        </span>
      </div>

      {/* Formulário para novo comentário */}
      <form onSubmit={adicionarComentario} className="novo-comentario-form">
        <div className="comentario-input-container">
          <div className="usuario-avatar">
            <span>{user?.nome?.charAt(0).toUpperCase()}</span>
          </div>
          <textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Escreva um comentário..."
            className="comentario-textarea"
            rows="3"
            maxLength="1000"
            disabled={enviando}
          />
        </div>
        <div className="comentario-actions">
          <span className="char-count">
            {novoComentario.length}/1000
          </span>
          <button 
            type="submit" 
            className="btn btn-primary btn-sm"
            disabled={enviando || !novoComentario.trim()}
          >
            {enviando ? 'Enviando...' : 'Comentar'}
          </button>
        </div>
      </form>

      {/* Lista de comentários */}
      <div className="comentarios-lista">
        {comentarios.length === 0 ? (
          <div className="comentarios-vazio">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>Nenhum comentário ainda</p>
            <span>Seja o primeiro a comentar neste projeto!</span>
          </div>
        ) : (
          comentarios.map((comentario) => (
            <div key={comentario._id} className="comentario-item">
              <div className="comentario-header">
                <div className="comentario-autor">
                  <div className="usuario-avatar">
                    <span>{comentario.autor.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="autor-info">
                    <span className="autor-nome">{comentario.autor.nome}</span>
                    <span className="comentario-data">
                      {formatarData(comentario.criadoEm)}
                      {comentario.editadoEm && (
                        <span className="editado"> • editado</span>
                      )}
                    </span>
                  </div>
                </div>
                
                {podeEditarOuExcluir(comentario) && (
                  <div className="comentario-opcoes">
                    <button 
                      onClick={() => iniciarEdicao(comentario)}
                      className="btn-icon"
                      title="Editar comentário"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button 
                      onClick={() => excluirComentario(comentario._id)}
                      className="btn-icon btn-danger"
                      title="Excluir comentário"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="comentario-conteudo">
                {editando === comentario._id ? (
                  <div className="comentario-edicao">
                    <textarea
                      value={textoEdicao}
                      onChange={(e) => setTextoEdicao(e.target.value)}
                      className="comentario-textarea"
                      rows="3"
                      maxLength="1000"
                    />
                    <div className="comentario-actions">
                      <span className="char-count">
                        {textoEdicao.length}/1000
                      </span>
                      <div className="action-buttons">
                        <button 
                          onClick={cancelarEdicao}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => salvarEdicao(comentario._id)}
                          className="btn btn-primary btn-sm"
                          disabled={!textoEdicao.trim()}
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="comentario-texto">{comentario.texto}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComentariosProjeto;
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const DashboardColaborador = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [projetos, setProjetos] = useState([]);
  const [loadingProjetos, setLoadingProjetos] = useState(false);

  const carregarProjetos = useCallback(async () => {
    try {
      setLoadingProjetos(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/projetos/colaborador/meus', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjetos(response.data.data || response.data || []);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoadingProjetos(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    carregarProjetos();

    return () => clearInterval(timer);
  }, [carregarProjetos]);

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR');
  };

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard do Colaborador</h1>
          <p>Bem-vindo, {user?.nome}!</p>
        </div>

        <div className="welcome-section">
          <div className="welcome-card">
            <div className="welcome-content">
              <h2>Olá, {user?.nome?.split(' ')[0]}! 👋</h2>
              <p className="welcome-date">{formatDate(currentTime)}</p>
              <p className="welcome-time">{formatTime(currentTime)}</p>
            </div>
            <div className="welcome-stats">
              <div className="stat-item">
                <span className="stat-label">Sua Role:</span>
                <span className="stat-value role-collaborator">{user?.role}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status:</span>
                <span className="stat-value status-active">Ativo</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Último Login:</span>
                <span className="stat-value">
                  {user?.ultimoLogin ? 
                    new Date(user.ultimoLogin).toLocaleDateString('pt-BR') : 
                    'Primeiro acesso'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <div className="action-grid">
            <Link to="/perfil" className="action-card">
              <div className="action-icon profile">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3>Meu Perfil</h3>
              <p>Visualizar e editar suas informações pessoais</p>
            </Link>

            <div className="action-card" onClick={() => navigate('/meus-projetos')}>
              <div className="action-icon projects">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3>Meus Projetos</h3>
              <p>Visualizar projetos atribuídos a você ({projetos.length})</p>
            </div>

            <div className="action-card disabled">
              <div className="action-icon tasks">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3>Minhas Tarefas</h3>
              <p>Em breve - Gerenciar suas tarefas e atividades</p>
            </div>

            <div className="action-card disabled">
              <div className="action-icon calendar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3>Agenda</h3>
              <p>Em breve - Visualizar cronograma e prazos</p>
            </div>

            <div className="action-card disabled">
              <div className="action-icon reports">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path d="M7 17h10v-2a3 3 0 00-3-3h-4a3 3 0 00-3 3v2z" />
                </svg>
              </div>
              <h3>Relatórios</h3>
              <p>Em breve - Visualizar relatórios de progresso</p>
            </div>

            <div className="action-card disabled">
              <div className="action-icon notifications">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3>Notificações</h3>
              <p>Em breve - Receber atualizações importantes</p>
            </div>
          </div>
        </div>

        <div className="dashboard-info">
          <div className="info-grid">
            <div className="info-card">
              <h3>🎯 Bem-vindo ao Sistema!</h3>
              <p>
                Como colaborador, você terá acesso a ferramentas para gerenciar 
                seus projetos, tarefas e acompanhar seu progresso.
              </p>
            </div>
            
            <div className="info-card">
              <h3>🚀 Funcionalidades Disponíveis</h3>
              <ul>
                <li>✅ Perfil pessoal editável</li>
                <li>🔄 Gestão de projetos (em breve)</li>
                <li>🔄 Sistema de tarefas (em breve)</li>
                <li>🔄 Relatórios de progresso (em breve)</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h3>💡 Dicas</h3>
              <ul>
                <li>Mantenha seu perfil sempre atualizado</li>
                <li>Verifique regularmente suas notificações</li>
                <li>Entre em contato com o administrador se precisar de ajuda</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="quick-stats">
          <div className="quick-stat">
            <div className="quick-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="quick-stat-content">
              <h4>{loadingProjetos ? '...' : projetos.filter(p => p.status === 'ativo').length}</h4>
              <p>Projetos Ativos</p>
            </div>
          </div>
          
          <div className="quick-stat">
            <div className="quick-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="quick-stat-content">
              <h4>0</h4>
              <p>Tarefas Concluídas</p>
            </div>
          </div>
          
          <div className="quick-stat">
            <div className="quick-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="quick-stat-content">
              <h4>0</h4>
              <p>Tarefas Pendentes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardColaborador;
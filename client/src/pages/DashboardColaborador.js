import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const DashboardColaborador = () => {
  const navigate = useNavigate();





  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>

        <div className="dashboard-actions">
          <div className="action-grid">


            <div className="action-card" onClick={() => navigate('/meus-projetos')}>
              <div className="action-icon projects">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3>Meus Projetos</h3>
              <p>Visualizar projetos atribuídos a você</p>
            </div>


          </div>
        </div>


      </div>
    </div>
  );
};

export default DashboardColaborador;
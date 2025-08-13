import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ProjectIcon } from '../components/Icons';

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
                <ProjectIcon />
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
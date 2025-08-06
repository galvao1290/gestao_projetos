const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui';

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso negado. Token não fornecido.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-senha');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido. Usuário não encontrado.' 
      });
    }

    if (!user.ativo) {
      return res.status(401).json({ 
        success: false, 
        message: 'Conta desativada. Entre em contato com o administrador.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido.' 
    });
  }
};

// Middleware para verificar se o usuário é ADM
const verificarAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADM') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
    });
  }
};

// Middleware para verificar se o usuário é COLABORADOR ou ADM
const verificarColaboradorOuAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'COLABORADOR' || req.user.role === 'ADM')) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Permissão insuficiente.' 
    });
  }
};

// Middleware para verificar se o usuário pode acessar seus próprios dados ou é admin
const verificarProprioUsuarioOuAdmin = (req, res, next) => {
  const userId = req.params.id || req.params.userId;
  
  if (req.user && (req.user._id.toString() === userId || req.user.role === 'ADM')) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Você só pode acessar seus próprios dados.' 
    });
  }
};

module.exports = {
  verificarToken,
  verificarAdmin,
  verificarColaboradorOuAdmin,
  verificarProprioUsuarioOuAdmin
};
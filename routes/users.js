const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  verificarToken, 
  verificarAdmin, 
  verificarProprioUsuarioOuAdmin 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Listar todos os usuários (apenas ADM)
// @access  Private (ADM)
router.get('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    if (search) {
      filtros.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && ['ADM', 'COLABORADOR'].includes(role)) {
      filtros.role = role;
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Buscar usuários
    const usuarios = await User.find(filtros)
      .select('-senha')
      .sort({ dataCriacao: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Contar total de usuários
    const total = await User.countDocuments(filtros);
    
    res.json({
      success: true,
      data: {
        usuarios,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          hasNext: skip + usuarios.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Obter usuário por ID
// @access  Private (próprio usuário ou ADM)
router.get('/:id', verificarToken, verificarProprioUsuarioOuAdmin, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select('-senha');
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: usuario
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Atualizar usuário
// @access  Private (próprio usuário ou ADM)
router.put('/:id', [
  verificarToken,
  verificarProprioUsuarioOuAdmin,
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('role')
    .optional()
    .isIn(['ADM', 'COLABORADOR'])
    .withMessage('Role deve ser ADM ou COLABORADOR')
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { nome, email, role, ativo } = req.body;
    const userId = req.params.id;
    
    // Buscar usuário
    const usuario = await User.findById(userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se apenas ADM pode alterar role e status ativo
    if ((role !== undefined || ativo !== undefined) && req.user.role !== 'ADM') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem alterar role ou status ativo'
      });
    }

    // Verificar se o email já existe (se estiver sendo alterado)
    if (email && email !== usuario.email) {
      const emailExistente = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } 
      });
      
      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: 'Email já está em uso por outro usuário'
        });
      }
    }

    // Atualizar campos
    if (nome !== undefined) usuario.nome = nome;
    if (email !== undefined) usuario.email = email;
    if (role !== undefined && req.user.role === 'ADM') usuario.role = role;
    if (ativo !== undefined && req.user.role === 'ADM') usuario.ativo = ativo;

    await usuario.save();

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: usuario.toJSON()
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Desativar usuário (soft delete)
// @access  Private (ADM)
router.delete('/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir que o admin desative a si mesmo
    if (usuario._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode desativar sua própria conta'
      });
    }

    // Desativar usuário (soft delete)
    usuario.ativo = false;
    await usuario.save();

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/users/:id/reativar
// @desc    Reativar usuário
// @access  Private (ADM)
router.post('/:id/reativar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    usuario.ativo = true;
    await usuario.save();

    res.json({
      success: true,
      message: 'Usuário reativado com sucesso',
      data: usuario.toJSON()
    });

  } catch (error) {
    console.error('Erro ao reativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/users/stats/dashboard
// @desc    Estatísticas para dashboard (ADM)
// @access  Private (ADM)
router.get('/stats/dashboard', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const totalUsuarios = await User.countDocuments();
    const usuariosAtivos = await User.countDocuments({ ativo: true });
    const administradores = await User.countDocuments({ role: 'ADM' });
    const colaboradores = await User.countDocuments({ role: 'COLABORADOR' });
    
    // Usuários criados nos últimos 30 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    const novosUsuarios = await User.countDocuments({ 
      dataCriacao: { $gte: dataLimite } 
    });

    res.json({
      success: true,
      data: {
        totalUsuarios,
        usuariosAtivos,
        usuariosInativos: totalUsuarios - usuariosAtivos,
        administradores,
        colaboradores,
        novosUsuarios
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
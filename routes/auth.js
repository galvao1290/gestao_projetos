const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui';

// Função para gerar token JWT
const gerarToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
};

// @route   POST /api/auth/registro
// @desc    Registrar novo usuário
// @access  Public
router.post('/registro', [
  body('nome')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
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

    const { nome, email, senha, role = 'COLABORADOR' } = req.body;

    // Verificar se o usuário já existe
    const usuarioExistente = await User.buscarPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já existe com este email'
      });
    }

    // Criar novo usuário
    const novoUsuario = new User({
      nome,
      email,
      senha,
      role
    });

    await novoUsuario.save();

    // Gerar token
    const token = gerarToken(novoUsuario._id);

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      token,
      user: novoUsuario.toJSON()
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login do usuário
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória')
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

    const { email, senha } = req.body;

    // Buscar usuário por email
    const usuario = await User.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se a conta está ativa
    if (!usuario.ativo) {
      return res.status(400).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o administrador.'
      });
    }

    // Verificar senha
    const senhaValida = await usuario.compararSenha(senha);
    if (!senhaValida) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Atualizar último login
    usuario.ultimoLogin = new Date();
    await usuario.save();

    // Gerar token
    const token = gerarToken(usuario._id);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: usuario.toJSON()
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout do usuário
// @access  Private
router.post('/logout', verificarToken, async (req, res) => {
  try {
    // Em uma implementação mais robusta, você poderia adicionar o token a uma blacklist
    // Por enquanto, apenas retornamos sucesso
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obter dados do usuário logado
// @access  Private
router.get('/me', verificarToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/auth/verificar-token
// @desc    Verificar se o token é válido
// @access  Private
router.post('/verificar-token', verificarToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user
  });
});

module.exports = router;
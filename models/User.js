const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres']
  },
  username: {
    type: String,
    required: [true, 'Nome de usuário é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Nome de usuário deve ter pelo menos 3 caracteres'],
    maxlength: [20, 'Nome de usuário deve ter no máximo 20 caracteres'],
    match: [/^[a-zA-Z0-9_]+$/, 'Nome de usuário deve conter apenas letras, números e underscore']
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [3, 'Senha deve ter pelo menos 3 caracteres']
  },
  role: {
    type: String,
    enum: ['ADM', 'COLABORADOR'],
    default: 'COLABORADOR',
    required: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  ultimoLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.compararSenha = async function(senhaCandidata) {
  return await bcrypt.compare(senhaCandidata, this.senha);
};

// Método para retornar dados do usuário sem a senha
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.senha;
  return userObject;
};

// Método estático para buscar usuário por email
userSchema.statics.buscarPorEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Método estático para buscar usuário por username
userSchema.statics.buscarPorUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);
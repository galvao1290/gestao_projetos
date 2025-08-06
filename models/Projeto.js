const mongoose = require('mongoose');

const projetoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome do projeto é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do projeto não pode exceder 100 caracteres']
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode exceder 500 caracteres']
  },
  criador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Criador do projeto é obrigatório']
  },
  colaboradores: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    papel: {
      type: String,
      enum: ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA', 'DESIGNER', 'TESTER'],
      default: 'DESENVOLVEDOR'
    },
    dataAdicao: {
      type: Date,
      default: Date.now
    }
  }],
  permissoesColuna: [{
    colaborador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissoes: [{
      nomeColuna: {
        type: String,
        required: true
      },
      tipo: {
        type: String,
        enum: ['OCULTA', 'APENAS_LEITURA', 'LEITURA_ESCRITA'],
        default: 'LEITURA_ESCRITA'
      }
    }]
  }],
  dados: {
    colunas: [{
      nome: {
        type: String,
        required: true
      },
      tipo: {
        type: String,
        enum: ['texto', 'numero', 'data', 'booleano'],
        default: 'texto'
      },
      obrigatorio: {
        type: Boolean,
        default: false
      }
    }],
    linhas: [{
      dados: mongoose.Schema.Types.Mixed,
      criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      criadoEm: {
        type: Date,
        default: Date.now
      },
      atualizadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      atualizadoEm: {
        type: Date,
        default: Date.now
      }
    }]
  },
  status: {
    type: String,
    enum: ['PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO'],
    default: 'PLANEJAMENTO'
  },
  prioridade: {
    type: String,
    enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'],
    default: 'MEDIA'
  },
  dataInicio: {
    type: Date
  },
  dataFim: {
    type: Date
  },
  dataPrevisao: {
    type: Date
  },
  progresso: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  arquivos: [{
    nome: {
      type: String,
      required: true
    },
    caminho: {
      type: String,
      required: true
    },
    tamanho: {
      type: Number
    },
    tipo: {
      type: String
    },
    uploadPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadEm: {
      type: Date,
      default: Date.now
    }
  }],
  configuracoes: {
    permiteEdicao: {
      type: Boolean,
      default: true
    },
    permiteAdicaoLinhas: {
      type: Boolean,
      default: true
    },
    permiteRemocaoLinhas: {
      type: Boolean,
      default: true
    },
    notificacoes: {
      type: Boolean,
      default: true
    }
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para melhor performance
projetoSchema.index({ criador: 1 });
projetoSchema.index({ 'colaboradores.usuario': 1 });
projetoSchema.index({ status: 1 });
projetoSchema.index({ nome: 'text', descricao: 'text' });

// Middleware para popular dados relacionados
projetoSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'criador',
    select: 'nome email role'
  }).populate({
    path: 'colaboradores.usuario',
    select: 'nome email role'
  });
  next();
});

// Método para adicionar colaborador
projetoSchema.methods.adicionarColaborador = function(usuarioId, papel = 'DESENVOLVEDOR') {
  const colaboradorExistente = this.colaboradores.find(
    col => (col.usuario._id || col.usuario).toString() === usuarioId.toString()
  );
  
  if (!colaboradorExistente) {
    this.colaboradores.push({
      usuario: usuarioId,
      papel: papel
    });
  }
  
  return this.save();
};

// Método para remover colaborador
projetoSchema.methods.removerColaborador = function(usuarioId) {
  this.colaboradores = this.colaboradores.filter(
    col => (col.usuario._id || col.usuario).toString() !== usuarioId.toString()
  );
  
  return this.save();
};

// Método para verificar se usuário tem acesso ao projeto
projetoSchema.methods.temAcesso = function(usuarioId) {
  // Criador sempre tem acesso
  if ((this.criador._id || this.criador).toString() === usuarioId.toString()) {
    return true;
  }
  
  // Verificar se é colaborador
  return this.colaboradores.some(
    col => (col.usuario._id || col.usuario).toString() === usuarioId.toString()
  );
};

// Método para adicionar linha de dados
projetoSchema.methods.adicionarLinha = function(dados, usuarioId) {
  this.dados.linhas.push({
    dados: dados,
    criadoPor: usuarioId
  });
  
  return this.save();
};

// Método para atualizar linha de dados
projetoSchema.methods.atualizarLinha = function(indice, dados, usuarioId) {
  if (this.dados.linhas[indice]) {
    this.dados.linhas[indice].dados = dados;
    this.dados.linhas[indice].atualizadoPor = usuarioId;
    this.dados.linhas[indice].atualizadoEm = new Date();
  }
  
  return this.save();
};

// Método para remover linha de dados
projetoSchema.methods.removerLinha = function(indice) {
  if (this.dados.linhas[indice]) {
    this.dados.linhas.splice(indice, 1);
  }
  
  return this.save();
};

// Método para calcular estatísticas
projetoSchema.methods.obterEstatisticas = function() {
  return {
    totalLinhas: this.dados?.linhas?.length || 0,
    totalColunas: this.dados?.colunas?.length || 0,
    totalColaboradores: this.colaboradores?.length || 0,
    progresso: this.progresso || 0,
    diasRestantes: this.dataPrevisao ? 
      Math.ceil((this.dataPrevisao - new Date()) / (1000 * 60 * 60 * 24)) : null
  };
};

// Método toJSON para controlar dados retornados
projetoSchema.methods.toJSON = function() {
  const projeto = this.toObject();
  
  // Adicionar estatísticas
  projeto.estatisticas = this.obterEstatisticas();
  
  return projeto;
};

module.exports = mongoose.model('Projeto', projetoSchema);
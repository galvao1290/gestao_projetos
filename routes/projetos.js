const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Projeto = require('../models/Projeto');
const User = require('../models/User');
const { verificarToken, verificarAdmin, verificarColaboradorOuAdmin, verificarProprioUsuarioOuAdmin } = require('../middleware/auth');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/projetos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos CSV são permitidos'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Função para processar CSV
const processarCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const resultados = {
      colunas: [],
      linhas: [],
      erros: []
    };
    
    let primeiraLinha = true;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers) => {
        resultados.colunas = headers.map(header => ({
          nome: header.trim(),
          tipo: 'texto',
          obrigatorio: false
        }));
      })
      .on('data', (data) => {
        try {
          const linhaDados = {};
          Object.keys(data).forEach(key => {
            linhaDados[key.trim()] = data[key];
          });
          
          resultados.linhas.push({
            dados: linhaDados,
            criadoEm: new Date()
          });
        } catch (error) {
          resultados.erros.push(`Erro na linha ${resultados.linhas.length + 1}: ${error.message}`);
        }
      })
      .on('end', () => {
        // Detectar tipos de dados automaticamente
        if (resultados.linhas.length > 0) {
          resultados.colunas.forEach(coluna => {
            const valores = resultados.linhas.map(linha => linha.dados[coluna.nome]).filter(v => v && v.trim());
            
            if (valores.length > 0) {
              // Verificar se é número
              const todosNumeros = valores.every(v => !isNaN(parseFloat(v)) && isFinite(v));
              if (todosNumeros) {
                coluna.tipo = 'numero';
                return;
              }
              
              // Verificar se é data
              const todasDatas = valores.every(v => !isNaN(Date.parse(v)));
              if (todasDatas) {
                coluna.tipo = 'data';
                return;
              }
              
              // Verificar se é booleano
              const todosBooleanos = valores.every(v => 
                ['true', 'false', 'sim', 'não', 'yes', 'no', '1', '0'].includes(v.toLowerCase())
              );
              if (todosBooleanos) {
                coluna.tipo = 'booleano';
                return;
              }
            }
          });
        }
        
        resolve(resultados);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// GET /api/projetos - Listar projetos
router.get('/', 
  verificarToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
    query('search').optional().isLength({ max: 100 }).withMessage('Busca deve ter no máximo 100 caracteres'),
    query('status').optional().isIn(['PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO']).withMessage('Status inválido'),
    query('criador').optional().isMongoId().withMessage('ID do criador inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const search = req.query.search;
      const status = req.query.status;
      const criador = req.query.criador;

      // Construir filtros
      let filtros = { ativo: true };
      
      // Se não for admin, mostrar apenas projetos onde o usuário é criador ou colaborador
      if (req.user.role !== 'ADM') {
        filtros.$or = [
          { criador: req.user._id || req.user.id },
          { 'colaboradores.usuario': req.user._id || req.user.id }
        ];
      }
      
      if (search) {
        filtros.$text = { $search: search };
      }
      
      if (status) {
        filtros.status = status;
      }
      
      if (criador) {
        filtros.criador = criador;
      }

      const total = await Projeto.countDocuments(filtros);
      const projetos = await Projeto.find(filtros)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          projetos,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total,
            limit
          }
        }
      });
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// POST /api/projetos - Criar projeto
router.post('/',
  verificarToken,
  verificarAdmin,
  [
    body('nome')
      .notEmpty()
      .withMessage('Nome do projeto é obrigatório')
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('descricao')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrição deve ter no máximo 500 caracteres'),
    body('dataPrevisao')
      .optional()
      .isISO8601()
      .withMessage('Data de previsão deve ser uma data válida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const { nome, descricao, dataPrevisao } = req.body;

      // Verificar se já existe projeto com o mesmo nome
      const projetoExistente = await Projeto.findOne({ 
        nome: { $regex: new RegExp(`^${nome}$`, 'i') },
        ativo: true 
      });
      
      if (projetoExistente) {
        return res.status(400).json({ 
          success: false, 
          message: 'Já existe um projeto com este nome' 
        });
      }

      const novoProjeto = new Projeto({
        nome,
        descricao,
        criador: req.user._id || req.user.id,
        dataPrevisao: dataPrevisao ? new Date(dataPrevisao) : undefined,
        dados: {
          colunas: [],
          linhas: []
        }
      });

      await novoProjeto.save();

      res.status(201).json({
        success: true,
        message: 'Projeto criado com sucesso',
        data: novoProjeto
      });
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// POST /api/projetos/:id/upload-csv - Upload e processamento de CSV
router.post('/:id/upload-csv',
  verificarToken,
  verificarAdmin,
  upload.single('csv'),
  [
    param('id').isMongoId().withMessage('ID do projeto inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'Arquivo CSV é obrigatório' 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto) {
        // Remover arquivo se projeto não existe
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Verificar se usuário tem permissão
      if (projeto.criador._id.toString() !== (req.user._id || req.user.id).toString() && req.user.role !== 'ADM') {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para modificar este projeto' 
        });
      }

      // Processar CSV
      const resultadoCSV = await processarCSV(req.file.path);
      
      // Atualizar projeto com dados do CSV
      projeto.dados.colunas = resultadoCSV.colunas;
      projeto.dados.linhas = resultadoCSV.linhas.map(linha => ({
        ...linha,
        criadoPor: req.user._id || req.user.id
      }));
      
      // Adicionar arquivo à lista de arquivos do projeto
      projeto.arquivos.push({
        nome: req.file.originalname,
        caminho: req.file.path,
        tamanho: req.file.size,
        tipo: req.file.mimetype,
        uploadPor: req.user._id || req.user.id
      });

      await projeto.save();

      // Remover arquivo temporário após processamento
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'CSV processado com sucesso',
        data: {
          projeto,
          estatisticas: {
            totalLinhas: resultadoCSV.linhas.length,
            totalColunas: resultadoCSV.colunas.length,
            erros: resultadoCSV.erros
          }
        }
      });
    } catch (error) {
      console.error('Erro ao processar CSV:', error);
      
      // Remover arquivo em caso de erro
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar arquivo CSV',
        error: error.message
      });
    }
  }
);

// GET /api/projetos/:id - Obter projeto específico
router.get('/:id',
  verificarToken,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Verificar se usuário tem acesso ao projeto
      if (!projeto.temAcesso(req.user._id || req.user.id) && req.user.role !== 'ADM') {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para acessar este projeto' 
        });
      }

      res.json({
        success: true,
        data: projeto
      });
    } catch (error) {
      console.error('Erro ao obter projeto:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// PUT /api/projetos/:id - Atualizar projeto
router.put('/:id',
  verificarToken,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido'),
    body('nome')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('descricao')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrição deve ter no máximo 500 caracteres'),
    body('status')
      .optional()
      .isIn(['PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO'])
      .withMessage('Status inválido'),
    body('prioridade')
      .optional()
      .isIn(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'])
      .withMessage('Prioridade inválida'),
    body('progresso')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Progresso deve ser entre 0 e 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Verificar permissões
      if (projeto.criador._id.toString() !== (req.user._id || req.user.id).toString() && req.user.role !== 'ADM') {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para modificar este projeto' 
        });
      }

      const camposPermitidos = ['nome', 'descricao', 'status', 'prioridade', 'progresso', 'dataInicio', 'dataFim', 'dataPrevisao', 'tags'];
      const atualizacoes = {};
      
      camposPermitidos.forEach(campo => {
        if (req.body[campo] !== undefined) {
          atualizacoes[campo] = req.body[campo];
        }
      });

      Object.assign(projeto, atualizacoes);
      await projeto.save();

      res.json({
        success: true,
        message: 'Projeto atualizado com sucesso',
        data: projeto
      });
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// DELETE /api/projetos/:id - Excluir projeto (soft delete)
router.delete('/:id',
  verificarToken,
  verificarAdmin,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido')
  ],
  async (req, res) => {
    try {
      console.log('DELETE /api/projetos/:id - Recebida requisição para excluir projeto:', req.params.id);
      console.log('Usuário:', req.user?.nome, 'Role:', req.user?.role);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Erro de validação:', errors.array());
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      console.log('Projeto encontrado:', !!projeto, 'Ativo:', projeto?.ativo);
      
      if (!projeto || !projeto.ativo) {
        console.log('Projeto não encontrado ou inativo');
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      projeto.ativo = false;
      await projeto.save();
      console.log('Projeto marcado como inativo com sucesso');

      res.json({
        success: true,
        message: 'Projeto excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// PUT /api/projetos/:id/dados - Atualizar dados da planilha
router.put('/:id/dados',
  verificarToken,
  verificarColaboradorOuAdmin,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido'),
    body('dados').notEmpty().withMessage('Dados são obrigatórios')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Verificar se usuário tem permissão para acessar o projeto
      const isAdmin = req.user.role === 'ADM';
      const isCriador = projeto.criador._id.toString() === (req.user._id || req.user.id).toString();
      const isColaborador = projeto.colaboradores.some(
        col => (col.usuario._id || col.usuario).toString() === (req.user._id || req.user.id).toString()
      );

      if (!isAdmin && !isCriador && !isColaborador) {
        return res.status(403).json({ 
          success: false, 
          message: 'Sem permissão para acessar este projeto' 
        });
      }

      // Para colaboradores (não ADM e não criador), verificar permissões de coluna
      if (!isAdmin && !isCriador && isColaborador) {
        const { dados } = req.body;
        
        // Buscar permissões do colaborador
        const permissoesColaborador = projeto.permissoesColuna.find(
          perm => perm.colaborador.toString() === (req.user._id || req.user.id).toString()
        );

        // Para colaboradores, mesclar apenas as colunas editáveis com os dados existentes
        if (dados.colunas && dados.linhas) {
          // Buscar dados existentes do projeto
          const dadosExistentes = projeto.dados;
          
          // Criar mapa de permissões do colaborador
          const permissoesMap = {};
          if (permissoesColaborador) {
            permissoesColaborador.permissoes.forEach(perm => {
              permissoesMap[perm.nomeColuna] = perm.tipo;
            });
          }
          
          // Mesclar dados: manter dados existentes e atualizar apenas colunas editáveis
          if (dadosExistentes && dadosExistentes.linhas) {
            dados.linhas = dados.linhas.map((novaLinha, linhaIndex) => {
              const linhaExistente = dadosExistentes.linhas[linhaIndex];
              
              if (Array.isArray(novaLinha) && linhaExistente) {
                const linhaMesclada = [...novaLinha];
                
                // Para cada coluna, verificar se o colaborador pode editá-la
                dados.colunas.forEach((coluna, colunaIndex) => {
                  const nomeColuna = typeof coluna === 'string' ? coluna : coluna.nome || coluna;
                  const permissaoColuna = permissoesMap[nomeColuna] || 'LEITURA_ESCRITA'; // Padrão para colaboradores
                  
                  // Se não pode editar, manter valor existente
                  if (permissaoColuna !== 'LEITURA_ESCRITA') {
                    if (Array.isArray(linhaExistente)) {
                      linhaMesclada[colunaIndex] = linhaExistente[colunaIndex];
                    } else if (linhaExistente.dados && linhaExistente.dados[nomeColuna] !== undefined) {
                      linhaMesclada[colunaIndex] = linhaExistente.dados[nomeColuna];
                    }
                  }
                });
                
                return linhaMesclada;
              }
              
              return novaLinha;
            });
          }
        }
      }

      // Converter dados da planilha para formato do backend
      const { dados } = req.body;
      
      if (dados.colunas && dados.linhas) {
        // Converter colunas
        const colunas = dados.colunas.map(col => ({
          nome: typeof col === 'string' ? col : col.nome || col,
          tipo: 'texto',
          obrigatorio: false
        }));

        // Converter linhas
        const linhas = dados.linhas.map(linha => {
          if (Array.isArray(linha)) {
            const dadosLinha = {};
            dados.colunas.forEach((coluna, index) => {
              const nomeColuna = typeof coluna === 'string' ? coluna : coluna.nome || coluna;
              dadosLinha[nomeColuna] = linha[index] || '';
            });
            return {
              dados: dadosLinha,
              criadoEm: new Date(),
              criadoPor: req.user._id || req.user.id
            };
          }
          return linha;
        });

        projeto.dados.colunas = colunas;
        projeto.dados.linhas = linhas;
      } else {
        projeto.dados = dados;
      }

      await projeto.save();

      res.json({
        success: true,
        message: 'Dados salvos com sucesso',
        data: projeto
      });
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
);

// GET /api/projetos/:id/colaboradores - Listar colaboradores do projeto
router.get('/:id/colaboradores',
  verificarToken,
  verificarAdmin,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Buscar todos os usuários com role COLABORADOR
      const todosColaboradores = await User.find({ role: 'COLABORADOR' })
        .select('nome email role')
        .sort({ nome: 1 });

      // Marcar quais colaboradores já estão no projeto
      const colaboradoresComStatus = todosColaboradores.map(colaborador => {
        const colaboradorNoProjeto = projeto.colaboradores.find(
          col => col.usuario._id.toString() === colaborador._id.toString()
        );
        
        return {
          ...colaborador.toObject(),
          noProjeto: !!colaboradorNoProjeto,
          papel: colaboradorNoProjeto ? colaboradorNoProjeto.papel : null,
          dataAdicao: colaboradorNoProjeto ? colaboradorNoProjeto.dataAdicao : null
        };
      });

      res.json({
        success: true,
        data: {
          colaboradores: colaboradoresComStatus,
          totalColaboradores: todosColaboradores.length,
          colaboradoresNoProjeto: projeto.colaboradores.length
        }
      });
    } catch (error) {
      console.error('Erro ao listar colaboradores:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// POST /api/projetos/:id/colaboradores - Adicionar colaborador ao projeto
router.post('/:id/colaboradores',
  verificarToken,
  verificarAdmin,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido'),
    body('usuarioId').isMongoId().withMessage('ID do usuário inválido'),
    body('papel').optional().isIn(['GERENTE', 'DESENVOLVEDOR', 'ANALISTA', 'DESIGNER', 'TESTER']).withMessage('Papel inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const { usuarioId, papel = 'DESENVOLVEDOR' } = req.body;

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Verificar se o usuário existe e tem role COLABORADOR
      const usuario = await User.findById(usuarioId);
      if (!usuario || usuario.role !== 'COLABORADOR') {
        return res.status(400).json({ 
          success: false, 
          message: 'Usuário não encontrado ou não é um colaborador' 
        });
      }

      // Verificar se o colaborador já está no projeto
      const colaboradorExistente = projeto.colaboradores.find(
        col => (col.usuario._id || col.usuario).toString() === usuarioId.toString()
      );
      
      if (colaboradorExistente) {
        return res.status(400).json({ 
          success: false, 
          message: 'Colaborador já está no projeto' 
        });
      }

      // Adicionar colaborador
      await projeto.adicionarColaborador(usuarioId, papel);
      
      // Recarregar projeto com dados populados
      const projetoAtualizado = await Projeto.findById(req.params.id);

      res.json({
        success: true,
        message: 'Colaborador adicionado com sucesso',
        data: projetoAtualizado
      });
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// DELETE /api/projetos/:id/colaboradores/:usuarioId - Remover colaborador do projeto
router.delete('/:id/colaboradores/:usuarioId',
  verificarToken,
  verificarAdmin,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido'),
    param('usuarioId').isMongoId().withMessage('ID do usuário inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const { usuarioId } = req.params;

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Verificar se o colaborador está no projeto
      const colaboradorExistente = projeto.colaboradores.find(
        col => (col.usuario._id || col.usuario).toString() === usuarioId.toString()
      );
      
      if (!colaboradorExistente) {
        return res.status(400).json({ 
          success: false, 
          message: 'Colaborador não está no projeto' 
        });
      }

      // Remover colaborador
      await projeto.removerColaborador(usuarioId);
      
      // Recarregar projeto com dados populados
      const projetoAtualizado = await Projeto.findById(req.params.id);

      res.json({
        success: true,
        message: 'Colaborador removido com sucesso',
        data: projetoAtualizado
      });
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// GET /api/projetos/stats/dashboard - Estatísticas para dashboard
router.get('/stats/dashboard',
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    try {
      const totalProjetos = await Projeto.countDocuments({ ativo: true });
      const projetosAtivos = await Projeto.countDocuments({ 
        ativo: true, 
        status: { $in: ['PLANEJAMENTO', 'EM_ANDAMENTO'] } 
      });
      const projetosConcluidos = await Projeto.countDocuments({ 
        ativo: true, 
        status: 'CONCLUIDO' 
      });
      const projetosNovos = await Projeto.countDocuments({
        ativo: true,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const estatisticasPorStatus = await Projeto.aggregate([
        { $match: { ativo: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const estatisticasPorPrioridade = await Projeto.aggregate([
        { $match: { ativo: true } },
        { $group: { _id: '$prioridade', count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: {
          totalProjetos,
          projetosAtivos,
          projetosConcluidos,
          projetosNovos,
          estatisticasPorStatus,
          estatisticasPorPrioridade
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// @route   GET /api/projetos/:id/permissoes-coluna/:colaboradorId
// @desc    Obter permissões de coluna de um colaborador específico
// @access  Private (ADM ou próprio colaborador)
router.get('/:id/permissoes-coluna/:colaboradorId', verificarToken, async (req, res) => {
  try {
    const { id, colaboradorId } = req.params;
    
    // Verificar se o usuário é ADM ou o próprio colaborador
    if (req.user.role !== 'ADM' && req.user._id.toString() !== colaboradorId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores ou o próprio colaborador podem ver as permissões.'
      });
    }

    const projeto = await Projeto.findById(id);
    if (!projeto) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se o colaborador está no projeto
    const colaboradorNoProjeto = projeto.colaboradores.find(
      col => (col.usuario._id || col.usuario).toString() === colaboradorId.toString()
    );
    
    if (!colaboradorNoProjeto) {
      return res.status(404).json({
        success: false,
        message: 'Colaborador não encontrado no projeto'
      });
    }

    // Buscar permissões do colaborador
    const permissoesColaborador = projeto.permissoesColuna.find(
      perm => perm.colaborador.toString() === colaboradorId.toString()
    );

    // Se não há permissões definidas, retornar permissões padrão
    if (!permissoesColaborador) {
      const permissoesPadrao = projeto.dados.colunas.map(coluna => ({
        nomeColuna: coluna.nome,
        tipo: 'LEITURA_ESCRITA'
      }));
      
      return res.json({
        success: true,
        data: {
          colaborador: colaboradorId,
          permissoes: permissoesPadrao
        }
      });
    }

    res.json({
      success: true,
      data: {
        colaborador: colaboradorId,
        permissoes: permissoesColaborador.permissoes
      }
    });

  } catch (error) {
    console.error('Erro ao obter permissões de coluna:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/projetos/:id/permissoes-coluna/:colaboradorId
// @desc    Definir/atualizar permissões de coluna de um colaborador
// @access  Private (ADM apenas)
router.put('/:id/permissoes-coluna/:colaboradorId', verificarToken, verificarAdmin, async (req, res) => {
  console.log('PASSO 2 - BACKEND RECEBEU:', req.body);
  try {
    const { id, colaboradorId } = req.params;
    const { permissoes } = req.body;

    if (!permissoes || !Array.isArray(permissoes)) {
      return res.status(400).json({
        success: false,
        message: 'Permissões devem ser fornecidas como um array'
      });
    }

    const projeto = await Projeto.findById(id);
    if (!projeto) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Verificar se o colaborador está no projeto
    const colaboradorNoProjeto = projeto.colaboradores.find(
      col => (col.usuario._id || col.usuario).toString() === colaboradorId.toString()
    );
    
    if (!colaboradorNoProjeto) {
      return res.status(404).json({
        success: false,
        message: 'Colaborador não encontrado no projeto'
      });
    }

    // Validar permissões
    const colunasExistentes = projeto.dados.colunas.map(col => col.nome);
    const tiposValidos = ['OCULTA', 'APENAS_LEITURA', 'LEITURA_ESCRITA'];
    
    for (const permissao of permissoes) {
      if (!permissao.nomeColuna || !permissao.tipo) {
        return res.status(400).json({
          success: false,
          message: 'Cada permissão deve ter nomeColuna e tipo'
        });
      }
      
      if (!colunasExistentes.includes(permissao.nomeColuna)) {
        return res.status(400).json({
          success: false,
          message: `Coluna '${permissao.nomeColuna}' não existe no projeto`
        });
      }
      
      if (!tiposValidos.includes(permissao.tipo)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de permissão '${permissao.tipo}' inválido`
        });
      }
    }

    // Verificar se já existem permissões para este colaborador
    const permissoesExistentes = projeto.permissoesColuna.find(
      perm => perm.colaborador.toString() === colaboradorId.toString()
    );

    let resultado;
    
    if (permissoesExistentes) {
      // Atualizar permissões existentes usando operação atômica
      console.log('DIAGNÓSTICO BACKEND - ATUALIZANDO PERMISSÕES EXISTENTES PARA:', colaboradorId);
      resultado = await Projeto.updateOne(
        { _id: id },
        { $set: { "permissoesColuna.$[elem].permissoes": permissoes } },
        { arrayFilters: [{ "elem.colaborador": colaboradorId }] }
      );
    } else {
      // Criar novas permissões usando operação atômica
      console.log('DIAGNÓSTICO BACKEND - CRIANDO NOVAS PERMISSÕES PARA:', colaboradorId);
      resultado = await Projeto.updateOne(
        { _id: id },
        { $push: { permissoesColuna: { colaborador: colaboradorId, permissoes: permissoes } } }
      );
    }

    console.log('DIAGNÓSTICO BACKEND - RESULTADO DA OPERAÇÃO:', resultado);
    
    if (resultado.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado para atualização'
      });
    }

    res.json({
      success: true,
      message: 'Permissões de coluna atualizadas com sucesso',
      data: {
        colaborador: colaboradorId,
        permissoes: permissoes
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar permissões de coluna:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/projetos/colaborador/meus
// @desc    Obter projetos do colaborador logado
// @access  Private (Colaborador)
router.get('/colaborador/meus', verificarToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Buscar projetos onde o usuário é colaborador E que estejam ativos
    const projetos = await Projeto.find({
      'colaboradores.usuario': userId,
      ativo: true
    })
    .populate('colaboradores.usuario', 'nome email')
    .populate('criador', 'nome email')
    .select('-dados.linhas') // Não incluir as linhas para melhor performance
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: projetos
    });
  } catch (error) {
    console.error('Erro ao buscar projetos do colaborador:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   GET /api/projetos/:id/permissoes-coluna
// @desc    Obter todas as permissões de coluna do projeto
// @access  Private (ADM apenas)
router.get('/:id/permissoes-coluna', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const projeto = await Projeto.findById(id)
      .populate('permissoesColuna.colaborador', 'nome email')
      .populate('colaboradores.usuario', 'nome email');
      
    if (!projeto) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    // Criar um mapa de permissões para todos os colaboradores
    const permissoesTodosColaboradores = projeto.colaboradores.map(colaborador => {
      const permissoesExistentes = projeto.permissoesColuna.find(
        perm => perm.colaborador._id.toString() === colaborador.usuario._id.toString()
      );

      if (permissoesExistentes) {
        return {
          colaborador: colaborador.usuario,
          papel: colaborador.papel,
          permissoes: permissoesExistentes.permissoes
        };
      } else {
        // Permissões padrão se não definidas
        const permissoesPadrao = projeto.dados.colunas.map(coluna => ({
          nomeColuna: coluna.nome,
          tipo: 'LEITURA_ESCRITA'
        }));
        
        return {
          colaborador: colaborador.usuario,
          papel: colaborador.papel,
          permissoes: permissoesPadrao
        };
      }
    });

    res.json({
      success: true,
      data: {
        colunas: projeto.dados.colunas,
        permissoes: permissoesTodosColaboradores
      }
    });

  } catch (error) {
    console.error('Erro ao obter permissões de coluna:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/projetos/:id/comentarios - Adicionar comentário
router.post('/:id/comentarios',
  verificarToken,
  verificarColaboradorOuAdmin,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido'),
    body('texto')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comentário deve ter entre 1 e 1000 caracteres')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Verificar se usuário tem acesso ao projeto
      const isAdmin = req.user.role === 'ADM';
      const isCriador = projeto.criador._id.toString() === (req.user._id || req.user.id).toString();
      const isColaborador = projeto.colaboradores.some(
        col => (col.usuario._id || col.usuario).toString() === (req.user._id || req.user.id).toString()
      );

      if (!isAdmin && !isCriador && !isColaborador) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado' 
        });
      }

      // Adicionar comentário
      const novoComentario = {
        autor: req.user._id || req.user.id,
        texto: req.body.texto,
        criadoEm: new Date()
      };

      projeto.comentarios.push(novoComentario);
      await projeto.save();

      // Recarregar projeto com dados populados
      const projetoAtualizado = await Projeto.findById(req.params.id);
      const comentarioAdicionado = projetoAtualizado.comentarios[projetoAtualizado.comentarios.length - 1];

      res.status(201).json({
        success: true,
        message: 'Comentário adicionado com sucesso',
        data: comentarioAdicionado
      });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// GET /api/projetos/:id/comentarios - Listar comentários
router.get('/:id/comentarios',
  verificarToken,
  verificarColaboradorOuAdmin,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      // Verificar se usuário tem acesso ao projeto
      const isAdmin = req.user.role === 'ADM';
      const isCriador = projeto.criador._id.toString() === (req.user._id || req.user.id).toString();
      const isColaborador = projeto.colaboradores.some(
        col => (col.usuario._id || col.usuario).toString() === (req.user._id || req.user.id).toString()
      );

      if (!isAdmin && !isCriador && !isColaborador) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado' 
        });
      }

      // Filtrar apenas comentários ativos e ordenar por data
      const comentarios = projeto.comentarios
        .filter(comentario => comentario.ativo)
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

      res.json({
        success: true,
        data: comentarios
      });
    } catch (error) {
      console.error('Erro ao listar comentários:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// PUT /api/projetos/:id/comentarios/:comentarioId - Editar comentário
router.put('/:id/comentarios/:comentarioId',
  verificarToken,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido'),
    param('comentarioId').isMongoId().withMessage('ID do comentário inválido'),
    body('texto')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comentário deve ter entre 1 e 1000 caracteres')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      const comentario = projeto.comentarios.id(req.params.comentarioId);
      if (!comentario || !comentario.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Comentário não encontrado' 
        });
      }

      // Verificar se usuário pode editar (autor do comentário ou admin)
      const isAdmin = req.user.role === 'ADM';
      const isAutor = comentario.autor._id.toString() === (req.user._id || req.user.id).toString();

      if (!isAdmin && !isAutor) {
        return res.status(403).json({ 
          success: false, 
          message: 'Apenas o autor do comentário ou administradores podem editá-lo' 
        });
      }

      // Atualizar comentário
      comentario.texto = req.body.texto;
      comentario.editadoEm = new Date();
      await projeto.save();

      // Recarregar projeto com dados populados
      const projetoAtualizado = await Projeto.findById(req.params.id);
      const comentarioAtualizado = projetoAtualizado.comentarios.id(req.params.comentarioId);

      res.json({
        success: true,
        message: 'Comentário atualizado com sucesso',
        data: comentarioAtualizado
      });
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

// DELETE /api/projetos/:id/comentarios/:comentarioId - Excluir comentário
router.delete('/:id/comentarios/:comentarioId',
  verificarToken,
  [
    param('id').isMongoId().withMessage('ID do projeto inválido'),
    param('comentarioId').isMongoId().withMessage('ID do comentário inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const projeto = await Projeto.findById(req.params.id);
      if (!projeto || !projeto.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Projeto não encontrado' 
        });
      }

      const comentario = projeto.comentarios.id(req.params.comentarioId);
      if (!comentario || !comentario.ativo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Comentário não encontrado' 
        });
      }

      // Verificar se usuário pode excluir (autor do comentário ou admin)
      const isAdmin = req.user.role === 'ADM';
      const isAutor = comentario.autor._id.toString() === (req.user._id || req.user.id).toString();

      if (!isAdmin && !isAutor) {
        return res.status(403).json({ 
          success: false, 
          message: 'Apenas o autor do comentário ou administradores podem excluí-lo' 
        });
      }

      // Marcar comentário como inativo (soft delete)
      comentario.ativo = false;
      await projeto.save();

      res.json({
        success: true,
        message: 'Comentário excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
);

module.exports = router;
// Script de inicialização do MongoDB
db = db.getSiblingDB('gestao_projetos');

// Criar usuário para a aplicação
db.createUser({
  user: 'app_user',
  pwd: 'app_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'gestao_projetos'
    }
  ]
});

// Criar coleções com validação
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['nome', 'username', 'senha', 'role'],
      properties: {
        nome: {
          bsonType: 'string',
          description: 'Nome é obrigatório'
        },
        username: {
          bsonType: 'string',
          description: 'Username é obrigatório'
        },
        senha: {
          bsonType: 'string',
          description: 'Senha é obrigatória'
        },
        role: {
          enum: ['ADM', 'COLABORADOR'],
          description: 'Role deve ser ADM ou COLABORADOR'
        },
        ativo: {
          bsonType: 'bool',
          description: 'Status ativo deve ser boolean'
        }
      }
    }
  }
});

db.createCollection('projetos', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['nome', 'descricao', 'responsavel'],
      properties: {
        nome: {
          bsonType: 'string',
          description: 'Nome do projeto é obrigatório'
        },
        descricao: {
          bsonType: 'string',
          description: 'Descrição é obrigatória'
        },
        responsavel: {
          bsonType: 'objectId',
          description: 'Responsável é obrigatório'
        }
      }
    }
  }
});

// Criar índices para performance
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true, sparse: true });
db.projetos.createIndex({ "nome": 1 });
db.projetos.createIndex({ "responsavel": 1 });
db.projetos.createIndex({ "status": 1 });

print('Banco de dados inicializado com sucesso!');
print('Usuário app_user criado com permissões de leitura/escrita');
print('Coleções users e projetos criadas com validação');
print('Índices criados para otimização de consultas');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestao_projetos';

// Dados do administrador
const adminData = {
  nome: 'Administrador',
  username: 'admin',
  email: 'admin@empresa.com',
  senha: 'admin123',
  role: 'ADM',
  ativo: true
};

async function criarAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado ao MongoDB');

    // Verificar se já existe um admin
    const adminExistente = await User.findOne({ username: adminData.username });
    if (adminExistente) {
      console.log('⚠️  Usuário admin já existe!');
      console.log('📋 Dados do admin existente:');
      console.log(`   Nome: ${adminExistente.nome}`);
      console.log(`   Username: ${adminExistente.username}`);
      console.log(`   Email: ${adminExistente.email}`);
      console.log(`   Role: ${adminExistente.role}`);
      console.log(`   Ativo: ${adminExistente.ativo}`);
      console.log(`   Data de criação: ${adminExistente.dataCriacao}`);
      
      // Perguntar se deseja atualizar a senha
      console.log('\n🔄 Para atualizar a senha do admin existente, execute:');
      console.log('   node scripts/atualizar_senha_admin.js');
      
      await mongoose.disconnect();
      return;
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(adminData.senha, salt);

    // Criar novo usuário admin
    const novoAdmin = new User({
      ...adminData,
      senha: senhaHash
    });

    await novoAdmin.save();
    
    console.log('🎉 Usuário administrador criado com sucesso!');
    console.log('📋 Dados do admin criado:');
    console.log(`   Nome: ${novoAdmin.nome}`);
    console.log(`   Username: ${novoAdmin.username}`);
    console.log(`   Email: ${novoAdmin.email}`);
    console.log(`   Role: ${novoAdmin.role}`);
    console.log(`   ID: ${novoAdmin._id}`);
    
    console.log('\n🔐 Credenciais de acesso:');
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Senha: ${adminData.senha}`);
    
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error.message);
    if (error.code === 11000) {
      console.error('   Erro: Usuário com este username ou email já existe.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

// Executar o script
if (require.main === module) {
  criarAdmin();
}

module.exports = criarAdmin;
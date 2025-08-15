const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestao_projetos';

// Nova senha para o admin
const NOVA_SENHA = 'admin123';
const USERNAME_ADMIN = 'admin';

async function atualizarSenhaAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado ao MongoDB');

    // Buscar o usuário admin
    const admin = await User.findOne({ username: USERNAME_ADMIN });
    if (!admin) {
      console.log('❌ Usuário admin não encontrado!');
      console.log('💡 Execute primeiro: node scripts/criar_admin.js');
      await mongoose.disconnect();
      return;
    }

    // Criar hash da nova senha (usando mesmo salt do modelo User)
    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(NOVA_SENHA, salt);

    // Atualizar a senha
    admin.senha = senhaHash;
    await admin.save();
    
    console.log('🎉 Senha do administrador atualizada com sucesso!');
    console.log('📋 Dados do admin:');
    console.log(`   Nome: ${admin.nome}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    
    console.log('\n🔐 Novas credenciais de acesso:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Senha: ${NOVA_SENHA}`);
    
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar senha do administrador:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado do MongoDB');
  }
}

// Executar o script
if (require.main === module) {
  atualizarSenhaAdmin();
}

module.exports = atualizarSenhaAdmin;
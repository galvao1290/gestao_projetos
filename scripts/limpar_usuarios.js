const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Função para limpar usuários mantendo apenas 'smartseg'
async function limparUsuarios() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestao_projetos');
    console.log('✅ Conectado ao MongoDB');

    // Verificar se o usuário 'smartseg' existe
    const usuarioSmartSeg = await User.findOne({ username: 'smartseg' });
    
    if (!usuarioSmartSeg) {
      console.log('❌ Usuário "smartseg" não encontrado no sistema!');
      console.log('Criando usuário smartseg...');
      
      // Criar usuário smartseg se não existir
      const novoSmartSeg = new User({
        nome: 'Smart Seg Admin',
        username: 'smartseg',
        senha: 'smartseg123', // Será hasheada automaticamente
        role: 'ADM',
        ativo: true
      });
      
      await novoSmartSeg.save();
      console.log('✅ Usuário "smartseg" criado com sucesso!');
    } else {
      console.log('✅ Usuário "smartseg" encontrado no sistema');
    }

    // Contar usuários antes da exclusão
    const totalAntes = await User.countDocuments();
    console.log(`📊 Total de usuários antes da limpeza: ${totalAntes}`);

    // Excluir todos os usuários exceto 'smartseg'
    const resultado = await User.deleteMany({ 
      username: { $ne: 'smartseg' } 
    });

    console.log(`🗑️  Usuários excluídos: ${resultado.deletedCount}`);
    
    // Contar usuários após a exclusão
    const totalDepois = await User.countDocuments();
    console.log(`📊 Total de usuários após a limpeza: ${totalDepois}`);
    
    // Listar usuários restantes
    const usuariosRestantes = await User.find({}, 'nome username role ativo');
    console.log('\n👥 Usuários restantes no sistema:');
    usuariosRestantes.forEach(user => {
      console.log(`   - ${user.nome} (@${user.username}) - ${user.role} - ${user.ativo ? 'Ativo' : 'Inativo'}`);
    });

    console.log('\n✅ Limpeza de usuários concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza de usuários:', error);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
    process.exit(0);
  }
}

// Executar o script
console.log('🚀 Iniciando limpeza de usuários...');
console.log('⚠️  ATENÇÃO: Este script irá excluir TODOS os usuários exceto "smartseg"!');
console.log('⏳ Aguarde...');

limparUsuarios();
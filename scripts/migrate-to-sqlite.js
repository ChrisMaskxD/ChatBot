#!/usr/bin/env node

/**
 * Script de Migração: JSON → SQLite
 * Executa: node scripts/migrate-to-sqlite.js
 */

const path = require('path');
const fs = require('fs');

async function migrate() {
  console.log('🔄 Iniciando migração de dados: JSON → SQLite\n');

  try {
    // Importar o novo database
    const db = require('../services/database-sqlite');
    
    // Inicializar SQLite
    console.log('[1/5] Inicializando banco SQLite...');
    await db.initializeDatabase();
    
    // Ler dados JSON antigos
    console.log('[2/5] Lendo dados JSON...');
    const contactsPath = path.join(__dirname, '..', 'data', 'contacts.json');
    const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');
    
    let contacts = [];
    let messages = [];
    
    if (fs.existsSync(contactsPath)) {
      contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
      console.log(`   ✅ ${contacts.length} contatos encontrados`);
    }
    
    if (fs.existsSync(messagesPath)) {
      messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
      console.log(`   ✅ ${messages.length} mensagens encontradas`);
    }
    
    // Migrar contatos
    console.log('[3/5] Migrando contatos...');
    let migratedContacts = 0;
    for (const contact of contacts) {
      try {
        await db.createContact(
          contact.phone,
          contact.name,
          contact.email || '',
          contact.company || '',
          contact.metadata || {}
        );
        
        // Atualizar status e tags se necessário
        if (contact.status || contact.tags || contact.notes) {
          await db.updateContact(contact.phone, {
            status: contact.status,
            tags: contact.tags || [],
            notes: contact.notes || '',
          });
        }
        
        migratedContacts++;
      } catch (error) {
        console.warn(`   ⚠️ Erro ao migrar contato ${contact.phone}:`, error.message);
      }
    }
    console.log(`   ✅ ${migratedContacts}/${contacts.length} contatos migrados`);
    
    // Migrar mensagens
    console.log('[4/5] Migrando mensagens...');
    let migratedMessages = 0;
    for (const message of messages) {
      try {
        await db.createMessage(
          message.phone,
          message.direction,
          message.content,
          message.type || 'text',
          message.metadata || {}
        );
        migratedMessages++;
      } catch (error) {
        console.warn(`   ⚠️ Erro ao migrar mensagem ${message.id}:`, error.message);
      }
    }
    console.log(`   ✅ ${migratedMessages}/${messages.length} mensagens migradas`);
    
    // Criar backup do banco novo
    console.log('[5/5] Criando backup...');
    await db.createBackup();
    
    console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📊 Resumo:');
    console.log(`   • Contatos: ${migratedContacts}/${contacts.length}`);
    console.log(`   • Mensagens: ${migratedMessages}/${messages.length}`);
    console.log(`   • Banco: ${path.join(__dirname, '..', 'data', 'chatbot.db')}`);
    console.log('\n💡 O banco JSON ainda está em data/contacts.json e data/messages.json');
    console.log('💡 Você pode deletar após verificar que tudo está OK\n');
    
    console.log('Próximos passos:');
    console.log('1. Reinicie o servidor: npm start');
    console.log('2. Acesse o dashboard: http://localhost:3000/crm');
    console.log('3. Verifique se os dados estão corretos');
    console.log('4. Depois, você pode deletar os arquivos JSON\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();

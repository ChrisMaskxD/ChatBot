const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Criar diretório data se não existir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`[Database] Diretório ${DATA_DIR} criado`);
}

const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const TAGS_FILE = path.join(DATA_DIR, 'tags.json');

/**
 * Inicializar arquivos de dados
 */
function initializeData() {
  if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));
    console.log('[Database] contacts.json criado');
  }

  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
    console.log('[Database] messages.json criado');
  }

  if (!fs.existsSync(TAGS_FILE)) {
    fs.writeFileSync(TAGS_FILE, JSON.stringify({}, null, 2));
    console.log('[Database] tags.json criado');
  }
}

/**
 * Ler dados do arquivo com tratamento de erro
 */
function readData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`[Database] Erro ao ler ${filePath}:`, error.message);
    return filePath === CONTACTS_FILE || filePath === MESSAGES_FILE ? [] : {};
  }
}

/**
 * Escrever dados no arquivo com tratamento de erro
 */
function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`[Database] Erro ao escrever em ${filePath}:`, error.message);
    return false;
  }
}

// ========== CONTATOS ==========

/**
 * Obter todos os contatos
 */
function getAllContacts() {
  return readData(CONTACTS_FILE);
}

/**
 * Obter um contato por número
 */
function getContactByPhone(phone) {
  const contacts = readData(CONTACTS_FILE);
  return contacts.find(c => c.phone === phone);
}

/**
 * Criar ou atualizar contato
 */
function saveContact(contactData) {
  const contacts = readData(CONTACTS_FILE);
  const index = contacts.findIndex(c => c.phone === contactData.phone);

  if (index >= 0) {
    // Atualizar contato existente
    contacts[index] = {
      ...contacts[index],
      ...contactData,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Criar novo contato
    contacts.push({
      id: generateId(),
      phone: contactData.phone,
      name: contactData.name || 'Sem Nome',
      email: contactData.email || '',
      company: contactData.company || '',
      tags: contactData.tags || [],
      notes: contactData.notes || '',
      status: contactData.status || 'ativo', // ativo, inativo, bloqueado
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: contactData.metadata || {},
    });
  }

  writeData(CONTACTS_FILE, contacts);
  return contacts.find(c => c.phone === contactData.phone);
}

/**
 * Deletar contato
 */
function deleteContact(phone) {
  const contacts = readData(CONTACTS_FILE);
  const filtered = contacts.filter(c => c.phone !== phone);
  writeData(CONTACTS_FILE, filtered);
  return filtered;
}

/**
 * Buscar contatos por tag
 */
function getContactsByTag(tag) {
  const contacts = readData(CONTACTS_FILE);
  return contacts.filter(c => c.tags && c.tags.includes(tag));
}

// ========== MENSAGENS ==========

/**
 * Obter todas as mensagens de um contato
 */
function getMessagesByPhone(phone) {
  const messages = readData(MESSAGES_FILE);
  return messages.filter(m => m.phone === phone).sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
}

/**
 * Salvar mensagem
 */
function saveMessage(messageData) {
  const messages = readData(MESSAGES_FILE);
  
  const newMessage = {
    id: generateId(),
    phone: messageData.phone,
    direction: messageData.direction, // 'incoming' ou 'outgoing'
    content: messageData.content,
    type: messageData.type || 'text', // text, image, document, etc
    timestamp: new Date().toISOString(),
    status: messageData.status || 'sent', // sent, read, failed
    metadata: messageData.metadata || {},
  };

  messages.push(newMessage);
  writeData(MESSAGES_FILE, messages);
  
  // Atualizar timestamp do contato
  updateContactLastMessage(messageData.phone);

  return newMessage;
}

/**
 * Obter estatísticas de mensagens
 */
function getMessageStats(phone) {
  const messages = getMessagesByPhone(phone);
  
  return {
    total: messages.length,
    incoming: messages.filter(m => m.direction === 'incoming').length,
    outgoing: messages.filter(m => m.direction === 'outgoing').length,
    lastMessage: messages[messages.length - 1] || null,
  };
}

/**
 * Atualizar timestamp da última mensagem
 */
function updateContactLastMessage(phone) {
  const contacts = readData(CONTACTS_FILE);
  const contact = contacts.find(c => c.phone === phone);
  
  if (contact) {
    contact.lastMessageAt = new Date().toISOString();
    writeData(CONTACTS_FILE, contacts);
  }
}

// ========== TAGS ==========

/**
 * Adicionar tag a um contato
 */
function addTagToContact(phone, tag) {
  const contacts = readData(CONTACTS_FILE);
  const contact = contacts.find(c => c.phone === phone);
  
  if (contact) {
    if (!contact.tags) contact.tags = [];
    if (!contact.tags.includes(tag)) {
      contact.tags.push(tag);
      writeData(CONTACTS_FILE, contacts);
    }
  }
  
  return contact;
}

/**
 * Remover tag de um contato
 */
function removeTagFromContact(phone, tag) {
  const contacts = readData(CONTACTS_FILE);
  const contact = contacts.find(c => c.phone === phone);
  
  if (contact && contact.tags) {
    contact.tags = contact.tags.filter(t => t !== tag);
    writeData(CONTACTS_FILE, contacts);
  }
  
  return contact;
}

/**
 * Obter todas as tags registered
 */
function getAllTags() {
  const contacts = readData(CONTACTS_FILE);
  const tagsSet = new Set();
  
  contacts.forEach(contact => {
    if (contact.tags) {
      contact.tags.forEach(tag => tagsSet.add(tag));
    }
  });
  
  return Array.from(tagsSet);
}

// ========== ESTATÍSTICAS ==========

/**
 * Obter estatísticas gerais do CRM
 */
function getStats() {
  const contacts = readData(CONTACTS_FILE);
  const messages = readData(MESSAGES_FILE);

  return {
    totalContacts: contacts.length,
    activeContacts: contacts.filter(c => c.status === 'ativo').length,
    inactiveContacts: contacts.filter(c => c.status === 'inativo').length,
    blockedContacts: contacts.filter(c => c.status === 'bloqueado').length,
    totalMessages: messages.length,
    incomingMessages: messages.filter(m => m.direction === 'incoming').length,
    outgoingMessages: messages.filter(m => m.direction === 'outgoing').length,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Gerar ID único
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  initializeData,
  // Contatos
  getAllContacts,
  getContactByPhone,
  saveContact,
  deleteContact,
  getContactsByTag,
  addTagToContact,
  removeTagFromContact,
  getAllTags,
  // Mensagens
  getMessagesByPhone,
  saveMessage,
  getMessageStats,
  // Estatísticas
  getStats,
};

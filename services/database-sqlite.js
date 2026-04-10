const sqlite3 = require('sqlite3').verbose();
const CryptoJS = require('crypto-js');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('crypto'); // Para IDs únicos

const DB_PATH = path.join(__dirname, '..', 'data', 'chatbot.db');
const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backups');

// Chave de criptografia (usar variável de ambiente em produção)
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'sua-chave-super-secreta-mudar-em-producao';

// Criar diretórios se não existirem
if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
}

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let db;

/**
 * Funções de Criptografia
 */
function encrypt(text) {
  if (!text) return null;
  return CryptoJS.AES.encrypt(String(text), ENCRYPTION_KEY).toString();
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('[Database] Erro ao descriptografar:', error.message);
    return null;
  }
}

/**
 * Inicializar banco de dados com schema
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('[Database] ❌ Erro ao conectar:', err.message);
        reject(err);
        return;
      }

      console.log('[Database] ✅ Conectado ao SQLite');

      // Habilitar foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) reject(err);
      });

      // Criar tabelas
      db.serialize(() => {
        // Tabela de Contatos
        db.run(`
          CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            phone TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            company TEXT,
            status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo', 'bloqueado')),
            notes TEXT,
            tags TEXT DEFAULT '[]',
            metadata TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_message_at DATETIME
          )
        `, (err) => {
          if (err) console.error('[Database] Erro ao criar tabela contacts:', err.message);
        });

        // Tabela de Mensagens
        db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            phone TEXT NOT NULL,
            direction TEXT NOT NULL CHECK(direction IN ('incoming', 'outgoing')),
            content TEXT NOT NULL,
            type TEXT DEFAULT 'text',
            status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'read', 'failed')),
            metadata TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phone) REFERENCES contacts(phone) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) console.error('[Database] Erro ao criar tabela messages:', err.message);
        });

        // Tabela de Tags
        db.run(`
          CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            color TEXT DEFAULT '#25d366',
            description TEXT,
            usage_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('[Database] Erro ao criar tabela tags:', err.message);
        });

        // Tabela de Histórico de Pontos
        db.run(`
          CREATE TABLE IF NOT EXISTS points_history (
            id TEXT PRIMARY KEY,
            phone TEXT NOT NULL,
            points INTEGER NOT NULL,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phone) REFERENCES contacts(phone) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) console.error('[Database] Erro ao criar tabela points_history:', err.message);
        });

        // Tabela de Follow-ups
        db.run(`
          CREATE TABLE IF NOT EXISTS follow_ups (
            id TEXT PRIMARY KEY,
            phone TEXT NOT NULL,
            message TEXT NOT NULL,
            due_date DATETIME NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
            completed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phone) REFERENCES contacts(phone) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) console.error('[Database] Erro ao criar tabela follow_ups:', err.message);
        });

        // Tabela de Feedback
        db.run(`
          CREATE TABLE IF NOT EXISTS feedback (
            id TEXT PRIMARY KEY,
            phone TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'neutral' CHECK(type IN ('positive', 'neutral', 'negative')),
            rating INTEGER CHECK(rating >= 1 AND rating <= 5),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phone) REFERENCES contacts(phone) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) console.error('[Database] Erro ao criar tabela feedback:', err.message);
        });

        // Criar índices para performance
        db.run('CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone)');
        db.run('CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status)');
        db.run('CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone)');
        db.run('CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)');
        db.run('CREATE INDEX IF NOT EXISTS idx_follow_ups_phone ON follow_ups(phone)');
        db.run('CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status)');
        db.run('CREATE INDEX IF NOT EXISTS idx_feedback_phone ON feedback(phone)', () => {
          console.log('[Database] ✅ Schema criado e índices adicionados');
          resolve();
        });
      });
    });
  });
}

/**
 * Executar query com segurança
 */
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('[Database] Erro:', err.message);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('[Database] Erro:', err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('[Database] Erro:', err.message);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * OPERAÇÕES SEGURAS - CONTATOS
 */

async function createContact(phone, name, email = '', company = '', metadata = {}) {
  const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const encryptedEmail = encrypt(email);
    const metadataJson = JSON.stringify(metadata);

    await runAsync(`
      INSERT INTO contacts (id, phone, name, email, company, metadata, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, phone, name, encryptedEmail, company, metadataJson, JSON.stringify([])]);

    console.log(`[Database] ✅ Contato criado: ${phone}`);
    return getContact(phone);
  } catch (error) {
    console.error('[Database] Erro ao criar contato:', error.message);
    throw error;
  }
}

async function getContact(phone) {
  try {
    const row = await getAsync('SELECT * FROM contacts WHERE phone = ?', [phone]);
    
    if (row && row.email) {
      row.email = decrypt(row.email) || '';
    }
    if (row && row.metadata) {
      row.metadata = JSON.parse(row.metadata);
    }
    if (row && row.tags) {
      row.tags = JSON.parse(row.tags);
    }

    return row;
  } catch (error) {
    console.error('[Database] Erro ao obter contato:', error.message);
    throw error;
  }
}

async function getAllContacts(status = null) {
  try {
    let sql = 'SELECT * FROM contacts';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY last_message_at DESC LIMIT 1000';

    const rows = await allAsync(sql, params);
    
    // Descriptografar dados sensíveis
    return rows.map(row => {
      if (row.email) row.email = decrypt(row.email) || '';
      if (row.metadata) row.metadata = JSON.parse(row.metadata);
      if (row.tags) row.tags = JSON.parse(row.tags);
      return row;
    });
  } catch (error) {
    console.error('[Database] Erro ao obter contatos:', error.message);
    throw error;
  }
}

async function updateContact(phone, updates) {
  try {
    const contact = await getContact(phone);
    if (!contact) {
      throw new Error(`Contato ${phone} não encontrado`);
    }

    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(encrypt(updates.email));
    }
    if (updates.company !== undefined) {
      fields.push('company = ?');
      values.push(updates.company);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(phone);

    const sql = `UPDATE contacts SET ${fields.join(', ')} WHERE phone = ?`;
    await runAsync(sql, values);

    console.log(`[Database] ✅ Contato atualizado: ${phone}`);
    return getContact(phone);
  } catch (error) {
    console.error('[Database] Erro ao atualizar contato:', error.message);
    throw error;
  }
}

async function deleteContact(phone) {
  try {
    await runAsync('DELETE FROM contacts WHERE phone = ?', [phone]);
    console.log(`[Database] ✅ Contato deletado: ${phone}`);
  } catch (error) {
    console.error('[Database] Erro ao deletar contato:', error.message);
    throw error;
  }
}

/**
 * OPERAÇÕES SEGURAS - MENSAGENS
 */

async function createMessage(phone, direction, content, type = 'text', metadata = {}) {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const metadataJson = JSON.stringify(metadata);

    await runAsync(`
      INSERT INTO messages (id, phone, direction, content, type, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, phone, direction, content, type, metadataJson]);

    // Atualizar last_message_at do contato
    await runAsync('UPDATE contacts SET last_message_at = CURRENT_TIMESTAMP WHERE phone = ?', [phone]);

    return { id, phone, direction, content, type, metadata };
  } catch (error) {
    console.error('[Database] Erro ao criar mensagem:', error.message);
    throw error;
  }
}

async function getMessages(phone, limit = 50) {
  try {
    const rows = await allAsync(`
      SELECT * FROM messages 
      WHERE phone = ? 
      ORDER BY created_at ASC 
      LIMIT ?
    `, [phone, limit]);

    return rows.map(row => {
      if (row.metadata) row.metadata = JSON.parse(row.metadata);
      return row;
    });
  } catch (error) {
    console.error('[Database] Erro ao obter mensagens:', error.message);
    throw error;
  }
}

async function getMessageStats(phone) {
  try {
    const row = await getAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming,
        SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing
      FROM messages 
      WHERE phone = ?
    `, [phone]);

    return {
      total: row?.total || 0,
      incoming: row?.incoming || 0,
      outgoing: row?.outgoing || 0,
    };
  } catch (error) {
    console.error('[Database] Erro ao obter stats de mensagens:', error.message);
    throw error;
  }
}

/**
 * OPERAÇÕES - PONTOS
 */

async function addPoints(phone, points, reason = '') {
  const id = `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    await runAsync(`
      INSERT INTO points_history (id, phone, points, reason)
      VALUES (?, ?, ?, ?)
    `, [id, phone, points, reason]);

    // Atualizar metadata do contato com total de pontos
    const totalPoints = await getTotalPoints(phone);
    const contact = await getContact(phone);
    const metadata = contact.metadata || {};
    metadata.points = totalPoints;

    await updateContact(phone, { metadata });
    console.log(`[Database] ✅ ${points} pontos adicionados ao ${phone}`);

    return totalPoints;
  } catch (error) {
    console.error('[Database] Erro ao adicionar pontos:', error.message);
    throw error;
  }
}

async function getTotalPoints(phone) {
  try {
    const row = await getAsync(`
      SELECT SUM(points) as total FROM points_history WHERE phone = ?
    `, [phone]);

    return row?.total || 0;
  } catch (error) {
    console.error('[Database] Erro ao obter pontos:', error.message);
    throw error;
  }
}

/**
 * OPERAÇÕES - FOLLOW-UPS
 */

async function createFollowUp(phone, message, dueDate) {
  const id = `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    await runAsync(`
      INSERT INTO follow_ups (id, phone, message, due_date)
      VALUES (?, ?, ?, ?)
    `, [id, phone, message, dueDate]);

    console.log(`[Database] ✅ Follow-up agendado para ${phone}`);
    return { id, phone, message, dueDate, status: 'pending' };
  } catch (error) {
    console.error('[Database] Erro ao criar follow-up:', error.message);
    throw error;
  }
}

async function getPendingFollowUps() {
  try {
    const rows = await allAsync(`
      SELECT f.*, c.name as contact_name
      FROM follow_ups f
      JOIN contacts c ON f.phone = c.phone
      WHERE f.status = 'pending' AND f.due_date <= datetime('now')
      ORDER BY f.due_date ASC
    `);

    return rows;
  } catch (error) {
    console.error('[Database] Erro ao obter follow-ups pendentes:', error.message);
    throw error;
  }
}

async function completeFollowUp(id) {
  try {
    await runAsync(`
      UPDATE follow_ups 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [id]);

    console.log(`[Database] ✅ Follow-up completado: ${id}`);
  } catch (error) {
    console.error('[Database] Erro ao completar follow-up:', error.message);
    throw error;
  }
}

/**
 * OPERAÇÕES - FEEDBACK
 */

async function addFeedback(phone, content, type = 'neutral', rating = 3) {
  const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    await runAsync(`
      INSERT INTO feedback (id, phone, content, type, rating)
      VALUES (?, ?, ?, ?, ?)
    `, [id, phone, content, type, rating]);

    console.log(`[Database] ✅ Feedback registrado do ${phone}`);
    return { id, phone, content, type, rating };
  } catch (error) {
    console.error('[Database] Erro ao adicionar feedback:', error.message);
    throw error;
  }
}

async function getBrandReputation() {
  try {
    const row = await getAsync(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total,
        SUM(CASE WHEN type = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN type = 'neutral' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN type = 'negative' THEN 1 ELSE 0 END) as negative
      FROM feedback
    `);

    return {
      rating: row?.avg_rating ? parseFloat(row.avg_rating.toFixed(2)) : 0,
      total: row?.total || 0,
      byType: {
        positive: row?.positive || 0,
        neutral: row?.neutral || 0,
        negative: row?.negative || 0,
      },
    };
  } catch (error) {
    console.error('[Database] Erro ao obter reputação:', error.message);
    throw error;
  }
}

/**
 * ESTATÍSTICAS GERAIS
 */

async function getStats() {
  try {
    const contacts = await getAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inativo' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN status = 'bloqueado' THEN 1 ELSE 0 END) as blocked
      FROM contacts
    `);

    const messages = await getAsync(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming,
        SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing
      FROM messages
    `);

    return {
      contacts: {
        total: contacts?.total || 0,
        active: contacts?.active || 0,
        inactive: contacts?.inactive || 0,
        blocked: contacts?.blocked || 0,
      },
      messages: {
        total: messages?.total || 0,
        incoming: messages?.incoming || 0,
        outgoing: messages?.outgoing || 0,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Database] Erro ao obter stats:', error.message);
    throw error;
  }
}

/**
 * BACKUP AUTOMÁTICO
 */

async function createBackup() {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}.db`);

    // Executar comando SQLite de backup
    db.exec(`VACUUM INTO '${backupPath}'`, (err) => {
      if (err) {
        console.error('[Database] Erro ao criar backup:', err.message);
        reject(err);
      } else {
        console.log(`[Database] ✅ Backup criado: ${backupPath}`);
        
        // Manter apenas os últimos 10 backups
        cleanOldBackups();
        resolve(backupPath);
      }
    });
  });
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .sort()
      .reverse();

    if (files.length > 10) {
      files.slice(10).forEach(file => {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
      });
      console.log(`[Database] Limpeza: ${files.length - 10} backups antigos deletados`);
    }
  } catch (error) {
    console.error('[Database] Erro ao limpar backups:', error.message);
  }
}

/**
 * Agendar backups automáticos (a cada hora)
 */
function scheduleAutoBackup() {
  setInterval(() => {
    createBackup().catch(err => console.error('[Database] Erro no backup automático:', err));
  }, 60 * 60 * 1000); // A cada hora

  console.log('[Database] ✅ Backup automático agendado (a cada hora)');
}

/**
 * Fechar conexão ao sair
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('[Database] Erro ao fechar:', err.message);
          reject(err);
        } else {
          console.log('[Database] ✅ Conexão fechada');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Processos de saída graciosa
process.on('exit', () => closeDatabase());
process.on('SIGINT', () => {
  closeDatabase().then(() => process.exit(0));
});

module.exports = {
  initializeDatabase,
  createBackup,
  scheduleAutoBackup,
  closeDatabase,
  // Contatos
  createContact,
  getContact,
  getAllContacts,
  updateContact,
  deleteContact,
  // Mensagens
  createMessage,
  getMessages,
  getMessageStats,
  // Pontos
  addPoints,
  getTotalPoints,
  // Follow-ups
  createFollowUp,
  getPendingFollowUps,
  completeFollowUp,
  // Feedback
  addFeedback,
  getBrandReputation,
  // Stats
  getStats,
};

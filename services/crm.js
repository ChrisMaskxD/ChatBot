const db = require('./database');

/**
 * Gerenciar Contatos
 */
class ContactManager {
  /**
   * Registrar novo contato
   */
  static register(phone, name = 'Sem Nome', metadata = {}) {
    const existing = db.getContactByPhone(phone);
    
    if (existing) {
      console.log(`[CRM] Contato ${phone} já existe`);
      return existing;
    }

    const contact = db.saveContact({
      phone,
      name,
      status: 'ativo',
      metadata,
    });

    console.log(`[CRM] ✅ Novo contato registrado: ${phone} (${name})`);
    return contact;
  }

  /**
   * Atualizar informações do contato
   */
  static updateInfo(phone, updates = {}) {
    const contact = db.getContactByPhone(phone);
    
    if (!contact) {
      console.warn(`[CRM] Contato ${phone} não encontrado`);
      return null;
    }

    const updated = db.saveContact({
      phone,
      ...contact,
      ...updates,
    });

    console.log(`[CRM] ✅ Contato atualizado: ${phone}`);
    return updated;
  }

  /**
   * Obter perfil completo do contato
   */
  static getProfile(phone) {
    const contact = db.getContactByPhone(phone);
    
    if (!contact) {
      return null;
    }

    const stats = db.getMessageStats(phone);
    const messages = db.getMessagesByPhone(phone).slice(-10); // Últimas 10

    return {
      ...contact,
      stats,
      recentMessages: messages,
    };
  }

  /**
   * Listar todos os contatos
   */
  static listAll(filter = {}) {
    let contacts = db.getAllContacts();

    // Filtrar por status
    if (filter.status) {
      contacts = contacts.filter(c => c.status === filter.status);
    }

    // Filtrar por tag
    if (filter.tag) {
      contacts = contacts.filter(c => c.tags && c.tags.includes(filter.tag));
    }

    // Ordenar por data
    if (filter.sortBy === 'recent') {
      contacts.sort((a, b) => 
        new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
      );
    }

    return contacts;
  }

  /**
   * Buscar contatos por nome
   */
  static search(query) {
    const contacts = db.getAllContacts();
    const q = query.toLowerCase();
    
    return contacts.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }

  /**
   * Adicionar nota ao contato
   */
  static addNote(phone, note) {
    const contact = db.getContactByPhone(phone);
    
    if (!contact) {
      console.warn(`[CRM] Contato ${phone} não encontrado`);
      return null;
    }

    const timestamp = new Date().toISOString();
    const notes = contact.notes ? `${contact.notes}\n\n[${timestamp}]: ${note}` : `[${timestamp}]: ${note}`;

    return db.saveContact({
      phone,
      ...contact,
      notes,
    });
  }

  /**
   * Bloquear contato
   */
  static block(phone, reason = '') {
    const contact = db.getContactByPhone(phone);
    
    if (!contact) {
      return null;
    }

    const blocked = db.saveContact({
      phone,
      ...contact,
      status: 'bloqueado',
      metadata: {
        ...contact.metadata,
        blockedAt: new Date().toISOString(),
        blockReason: reason,
      },
    });

    console.log(`[CRM] ⛔ Contato bloqueado: ${phone}`);
    return blocked;
  }

  /**
   * Desbloquear contato
   */
  static unblock(phone) {
    const contact = db.getContactByPhone(phone);
    
    if (!contact) {
      return null;
    }

    const unblocked = db.saveContact({
      phone,
      ...contact,
      status: 'ativo',
      metadata: {
        ...contact.metadata,
        blockedAt: null,
        blockReason: null,
      },
    });

    console.log(`[CRM] ✅ Contato desbloqueado: ${phone}`);
    return unblocked;
  }

  /**
   * Marcar contato como inativo
   */
  static markInactive(phone) {
    return db.saveContact({
      phone,
      ...db.getContactByPhone(phone),
      status: 'inativo',
    });
  }

  /**
   * Deletar contato e seu histórico
   */
  static delete(phone) {
    db.deleteContact(phone);
    console.log(`[CRM] 🗑️ Contato deletado: ${phone}`);
  }
}

/**
 * Gerenciar Mensagens e Histórico
 */
class MessageManager {
  /**
   * Registrar mensagem recebida
   */
  static recordIncoming(phone, content, type = 'text', metadata = {}) {
    return db.saveMessage({
      phone,
      direction: 'incoming',
      content,
      type,
      status: 'read',
      metadata,
    });
  }

  /**
   * Registrar mensagem enviada
   */
  static recordOutgoing(phone, content, type = 'text', status = 'sent', metadata = {}) {
    return db.saveMessage({
      phone,
      direction: 'outgoing',
      content,
      type,
      status,
      metadata,
    });
  }

  /**
   * Obter histórico completo
   */
  static getHistory(phone, limit = 50) {
    const messages = db.getMessagesByPhone(phone);
    return messages.slice(-limit);
  }

  /**
   * Obter estatísticas de conversa
   */
  static getConversationStats(phone) {
    return db.getMessageStats(phone);
  }

  /**
   * Exportar histórico em formato legível
   */
  static exportHistory(phone) {
    const contact = db.getContactByPhone(phone);
    const messages = db.getMessagesByPhone(phone);

    let report = `HISTÓRICO DE CONVERSA - ${contact?.name || 'Desconhecido'}\n`;
    report += `Número: ${phone}\n`;
    report += `Período: ${new Date(messages[0]?.timestamp).toLocaleString()} - ${new Date(messages[messages.length - 1]?.timestamp).toLocaleString()}\n`;
    report += `Total de mensagens: ${messages.length}\n\n`;
    report += '─'.repeat(80) + '\n\n';

    messages.forEach(msg => {
      const sender = msg.direction === 'incoming' ? '👤 Cliente' : '🤖 Bot';
      const time = new Date(msg.timestamp).toLocaleString('pt-BR');
      report += `[${time}] ${sender}: ${msg.content}\n`;
    });

    return report;
  }
}

/**
 * Gerenciar Tags
 */
class TagManager {
  /**
   * Adicionar tag
   */
  static add(phone, tag) {
    return db.addTagToContact(phone, tag);
  }

  /**
   * Remover tag
   */
  static remove(phone, tag) {
    return db.removeTagFromContact(phone, tag);
  }

  /**
   * Obter todos os contatos com tag
   */
  static getContacts(tag) {
    return db.getContactsByTag(tag);
  }

  /**
   * Listar todas as tags
   */
  static listAll() {
    return db.getAllTags();
  }

  /**
   * Sugerir tags comuns
   */
  static getSuggested() {
    return [
      'cliente',
      'lead',
      'vip',
      'suporte',
      'vendas',
      'feedback',
      'teste',
      'ativo',
      'inativo',
      'spammer',
    ];
  }
}

/**
 * Estatísticas e Analytics
 */
class Analytics {
  /**
   * Obter dashboard de estatísticas
   */
  static getDashboard() {
    const stats = db.getStats();
    const contacts = db.getAllContacts();
    
    return {
      ...stats,
      topTags: this.getTopTags(),
      topContacts: this.getTopContacts(),
      messagesByDay: this.getMessagesByDay(),
      contactsByStatus: this.getContactsByStatus(),
    };
  }

  /**
   * Obter tags mais usadas
   */
  static getTopTags() {
    const contacts = db.getAllContacts();
    const tagCounts = {};

    contacts.forEach(contact => {
      if (contact.tags) {
        contact.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }

  /**
   * Obter contatos mais ativos
   */
  static getTopContacts(limit = 10) {
    const contacts = db.getAllContacts();
    
    return contacts
      .map(contact => ({
        ...contact,
        messageCount: db.getMessageStats(contact.phone).total,
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, limit);
  }

  /**
   * Mensagens por dia
   */
  static getMessagesByDay() {
    const messages = db.getAllContacts().flatMap(c => 
      db.getMessagesByPhone(c.phone)
    );

    const byDay = {};
    messages.forEach(msg => {
      const day = new Date(msg.timestamp).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return byDay;
  }

  /**
   * Contatos por status
   */
  static getContactsByStatus() {
    const contacts = db.getAllContacts();
    const statuses = {
      ativo: 0,
      inativo: 0,
      bloqueado: 0,
    };

    contacts.forEach(c => {
      if (statuses.hasOwnProperty(c.status)) {
        statuses[c.status]++;
      }
    });

    return statuses;
  }
}

module.exports = {
  ContactManager,
  MessageManager,
  TagManager,
  Analytics,
};

/**
 * Funcionalidades Extras do CRM
 */

/**
 * Sistema de Automation (Follow-ups, etc)
 */
class Automation {
  /**
   * Agendar follow-up para um contato
   */
  static scheduleFollowUp(phone, message, dueDate) {
    const contact = db.getContactByPhone(phone);
    
    if (!contact) {
      console.warn(`[Automation] Contato ${phone} não encontrado`);
      return null;
    }

    const followUp = {
      id: `followup_${Date.now()}`,
      phone,
      message,
      dueDate,
      status: 'pending', // pending, completed, cancelled
      createdAt: new Date().toISOString(),
    };

    // Salvar em metadata do contato
    if (!contact.metadata.followUps) {
      contact.metadata.followUps = [];
    }

    contact.metadata.followUps.push(followUp);
    db.saveContact(contact);

    console.log(`[Automation] ✅ Follow-up agendado para ${phone}: ${dueDate}`);
    return followUp;
  }

  /**
   * Obter follow-ups pendentes
   */
  static getPendingFollowUps() {
    const contacts = db.getAllContacts();
    const pending = [];
    const now = new Date();

    contacts.forEach(contact => {
      if (contact.metadata.followUps) {
        contact.metadata.followUps.forEach(followUp => {
          if (followUp.status === 'pending' && new Date(followUp.dueDate) <= now) {
            pending.push({
              ...followUp,
              contactName: contact.name,
            });
          }
        });
      }
    });

    return pending;
  }

  /**
   * Marcar follow-up como completo
   */
  static completeFollowUp(phone, followUpId) {
    const contact = db.getContactByPhone(phone);
    
    if (!contact || !contact.metadata.followUps) {
      return null;
    }

    const followUp = contact.metadata.followUps.find(f => f.id === followUpId);
    if (followUp) {
      followUp.status = 'completed';
      followUp.completedAt = new Date().toISOString();
      db.saveContact(contact);
    }

    return followUp;
  }
}

/**
 * Segmentação e Análise de Clientes
 */
class Segmentation {
  /**
   * Segmentar contatos por critérios
   */
  static segmentContacts(criteria) {
    const contacts = db.getAllContacts();
    let filtered = contacts;

    // Por valor de negócio
    if (criteria.byValue) {
      filtered = filtered.filter(c => {
        const messageCount = db.getMessageStats(c.phone).total;
        switch (criteria.byValue) {
          case 'high': return messageCount > 50;
          case 'medium': return messageCount > 10 && messageCount <= 50;
          case 'low': return messageCount <= 10;
          default: return true;
        }
      });
    }

    // Por período de inatividade
    if (criteria.inactiveDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.inactiveDays);

      filtered = filtered.filter(c => 
        new Date(c.lastMessageAt) < cutoffDate
      );
    }

    // Por tag específica
    if (criteria.tag) {
      filtered = filtered.filter(c => c.tags && c.tags.includes(criteria.tag));
    }

    // Por status
    if (criteria.status) {
      filtered = filtered.filter(c => c.status === criteria.status);
    }

    return filtered;
  }

  /**
   * Obter clientes VIP (mais ativos e compradores)
   */
  static getVIPContacts() {
    return Segmentation.segmentContacts({ byValue: 'high' });
  }

  /**
   * Obter leads inativos (para re-engajamento)
   */
  static getInactiveLeads(daysInactive = 7) {
    return Segmentation.segmentContacts({ inactiveDays: daysInactive });
  }

  /**
   * Calcular jornada do cliente
   */
  static getCustomerJourney(phone) {
    const messages = db.getMessagesByPhone(phone);
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];

    const days = firstMessage && lastMessage 
      ? Math.floor((new Date(lastMessage.timestamp) - new Date(firstMessage.timestamp)) / (1000 * 60 * 60 * 24))
      : 0;

    let stage = 'novo';
    if (days > 30) stage = 'engajado';
    if (days > 60) stage = 'cliente_ativo';
    if (messages.length > 100) stage = 'cliente_vip';

    return {
      phone,
      stage,
      daysSinceFirstMessage: days,
      messageCount: messages.length,
      daysSinceLastMessage: firstMessage && lastMessage 
        ? Math.floor((new Date() - new Date(lastMessage.timestamp)) / (1000 * 60 * 60 * 24))
        : 0,
    };
  }
}

/**
 * Sistema de Pontos e Recompensas
 */
class RewardSystem {
  /**
   * Adicionar pontos a um contato
   */
  static addPoints(phone, points, reason = '') {
    const contact = db.getContactByPhone(phone);
    
    if (!contact) {
      return null;
    }

    if (!contact.metadata.points) {
      contact.metadata.points = 0;
    }

    contact.metadata.points += points;

    if (!contact.metadata.pointsHistory) {
      contact.metadata.pointsHistory = [];
    }

    contact.metadata.pointsHistory.push({
      date: new Date().toISOString(),
      points,
      reason,
    });

    db.saveContact(contact);
    console.log(`[Rewards] ✅ ${points} pontos adicionados ao ${phone}. Total: ${contact.metadata.points}`);

    return contact.metadata.points;
  }

  /**
   * Obter saldo de pontos
   */
  static getPoints(phone) {
    const contact = db.getContactByPhone(phone);
    return contact?.metadata?.points || 0;
  }

  /**
   * Usar pontos (resgate)
   */
  static usePoints(phone, points, reward = '') {
    const contact = db.getContactByPhone(phone);
    
    if (!contact || !contact.metadata.points || contact.metadata.points < points) {
      console.warn(`[Rewards] ❌ Pontos insuficientes para ${phone}`);
      return null;
    }

    contact.metadata.points -= points;

    if (!contact.metadata.redeemHistory) {
      contact.metadata.redeemHistory = [];
    }

    contact.metadata.redeemHistory.push({
      date: new Date().toISOString(),
      points,
      reward,
    });

    db.saveContact(contact);
    console.log(`[Rewards] ✅ ${points} pontos resgatados por ${phone}`);

    return contact.metadata.points;
  }

  /**
   * Top clientes por pontos
   */
  static getTopByPoints(limit = 10) {
    const contacts = db.getAllContacts();
    
    return contacts
      .filter(c => c.metadata?.points > 0)
      .map(c => ({
        phone: c.phone,
        name: c.name,
        points: c.metadata.points,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }
}

/**
 * Análise de Sentimento e Feedback
 */
class SentimentAnalysis {
  /**
   * Adicionar feedback manual de um contato
   */
  static addFeedback(phone, feedback) {
    const contact = db.getContactByPhone(phone);
    
    if (!contact) {
      return null;
    }

    if (!contact.metadata.feedback) {
      contact.metadata.feedback = [];
    }

    contact.metadata.feedback.push({
      date: new Date().toISOString(),
      content: feedback.content,
      type: feedback.type || 'neutral', // positive, neutral, negative
      rating: feedback.rating || 0, // 1-5
    });

    db.saveContact(contact);
    return contact.metadata.feedback;
  }

  /**
   * Obter contatos com feedback positivo
   */
  static getPositiveFeedback() {
    const contacts = db.getAllContacts();
    
    return contacts
      .filter(c => c.metadata?.feedback)
      .filter(c => c.metadata.feedback.some(f => f.type === 'positive'))
      .map(c => ({
        phone: c.phone,
        name: c.name,
        feedback: c.metadata.feedback.filter(f => f.type === 'positive'),
      }));
  }

  /**
   * Obter contatos com feedback negativo
   */
  static getNegativeFeedback() {
    const contacts = db.getAllContacts();
    
    return contacts
      .filter(c => c.metadata?.feedback)
      .filter(c => c.metadata.feedback.some(f => f.type === 'negative'))
      .map(c => ({
        phone: c.phone,
        name: c.name,
        feedback: c.metadata.feedback.filter(f => f.type === 'negative'),
      }));
  }

  /**
   * Reputação da marca (média de ratings)
   */
  static getBrandReputation() {
    const contacts = db.getAllContacts();
    const allFeedback = [];

    contacts.forEach(c => {
      if (c.metadata?.feedback) {
        allFeedback.push(...c.metadata.feedback);
      }
    });

    if (allFeedback.length === 0) {
      return { rating: 0, totalFeedback: 0 };
    }

    const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;

    return {
      rating: parseFloat(avgRating.toFixed(2)),
      totalFeedback: allFeedback.length,
      byType: {
        positive: allFeedback.filter(f => f.type === 'positive').length,
        neutral: allFeedback.filter(f => f.type === 'neutral').length,
        negative: allFeedback.filter(f => f.type === 'negative').length,
      },
    };
  }
}

/**
 * Exportar todas as funcionalidades extra
 */
Object.assign(module.exports, {
  Automation,
  Segmentation,
  RewardSystem,
  SentimentAnalysis,
});

require('dotenv').config();
const express = require('express');
const path = require('path');
const { sendMessage, sendDocument, markAsRead } = require('./services/whatsapp');
const { gerarResposta } = require('./services/ai');
const { ContactManager, MessageManager, TagManager, Analytics, Automation, Segmentation, RewardSystem, SentimentAnalysis } = require('./services/crm');
const db = require('./services/database-sqlite');
const { 
  sanitizeRequestBody, 
  sanitizeQueryParams,
  validateContact,
  validateMessage,
  validateFollowUp,
  validateFeedback,
  cleanContact,
  cleanMessage,
  cleanFollowUp,
  cleanFeedback,
} = require('./services/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar banco de dados SQLite
async function initServer() {
  try {
    await db.initializeDatabase();
    db.scheduleAutoBackup();
    console.log('[Database] ✅ SQLite inicializado com sucesso');
    console.log('[Database] 🔐 Criptografia ativada');
    console.log('[Database] 💾 Backup automático agendado (a cada hora)');
  } catch (error) {
    console.error('[Database] ❌ Erro ao inicializar:', error.message);
    process.exit(1);
  }
}

initServer();

const appState = {
  messagesReceived: 0,
  messagesSent: 0,
  errors: 0,
  avgTime: 0,
  history: [],
  logs: [],
  config: {
    aiModel: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500,
    customPrompt: '',
  },
};

console.log('[Server] Iniciando servidor com Evolution API');
console.log(`[Server] Instance: ${process.env.EVOLUTION_INSTANCE_NAME}`);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Middleware de Segurança - Sanitização de Entrada
app.use(sanitizeRequestBody); // Sanitiza corpo da requisição (previne XSS)
app.use(sanitizeQueryParams); // Sanitiza parâmetros de query

/**
 * GET /webhook - Agora só retorna 200 (Evolution não precisa de verify token)
 */
app.get('/webhook', (req, res) => {
  res.status(200).send('Webhook Evolution OK');
});

/**
 * POST /webhook - Recebe mensagens da Evolution API
 */
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Formato da Evolution API (messages.upsert)
    if (body.event === 'messages.upsert' && body.data?.messages) {
      for (const msg of body.data.messages) {
        if (msg.key.fromMe) continue; // ignora mensagens enviadas por nós
        await processarMensagemEvolution(msg);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook] Erro:', error.message);
    res.sendStatus(500);
  }
});

/**
 * Processa mensagem vinda da Evolution
 */
async function processarMensagemEvolution(mensagem) {
  try {
    const numeroOrigem = mensagem.key.remoteJid.split('@')[0]; // ex: 5511999999999
    const textoRecebido = mensagem.message?.conversation || 
                         mensagem.message?.extendedTextMessage?.text || '';

    console.log(`[Processamento] Mensagem de ${numeroOrigem}: "${textoRecebido}"`);
    appState.messagesReceived++;

    // ===== REGISTRAR CONTATO E MENSAGEM NO CRM =====
    ContactManager.register(numeroOrigem, `Contato ${numeroOrigem}`);
    MessageManager.recordIncoming(numeroOrigem, textoRecebido, 'text');

    let tipoResposta = '';
    let resposta = '';

    if (textoRecebido.toLowerCase().trim() === 'oi') {
      tipoResposta = 'Cumprimento';
      resposta = await gerarResposta('Responda de forma breve e amigável a um cumprimento de um cliente.');
      await sendMessage(numeroOrigem, resposta);
      MessageManager.recordOutgoing(numeroOrigem, resposta, 'text', 'sent');
    } else if (textoRecebido.toLowerCase().trim() === 'catalogo') {
      tipoResposta = 'Catálogo';
      await sendMessage(numeroOrigem, 'Aqui está nosso catálogo! 📄 Confira os produtos disponíveis.');
      MessageManager.recordOutgoing(numeroOrigem, 'Aqui está nosso catálogo! 📄 Confira os produtos disponíveis.', 'text', 'sent');
      const linkCatalogo = process.env.PDF_CATALOGO_URL || 'https://exemplo.com/catalogo.pdf';
      await sendDocument(numeroOrigem, linkCatalogo, 'Catalogo.pdf');
      MessageManager.recordOutgoing(numeroOrigem, `Documento enviado: Catalogo.pdf`, 'document', 'sent');
      resposta = 'Catálogo enviado';
    } else {
      tipoResposta = 'IA';
      resposta = await gerarResposta(textoRecebido);
      await sendMessage(numeroOrigem, resposta);
      MessageManager.recordOutgoing(numeroOrigem, resposta, 'text', 'sent');
    }

    // Histórico
    appState.history.push({
      phone: numeroOrigem,
      message: textoRecebido,
      response: resposta,
      type: tipoResposta,
      timestamp: new Date().toISOString(),
      status: 'respondida',
    });

    appState.messagesSent++;
    adicionarLog('[SUCCESS]', `Mensagem processada: ${tipoResposta} para ${numeroOrigem}`);
  } catch (error) {
    appState.errors++;
    console.error('[Processamento] Erro:', error.message);
    adicionarLog('[ERROR]', error.message);
  }
}

function adicionarLog(tipo, mensagem) {
  const agora = new Date().toLocaleTimeString('pt-BR');
  appState.logs.push({ type: tipo, message: mensagem, timestamp: new Date().toISOString() });
  if (appState.logs.length > 500) appState.logs = appState.logs.slice(-500);
  console.log(`${agora} ${tipo} ${mensagem}`);
}

// ====================== ROTAS DO DASHBOARD ======================
app.get('/', (req, res) => res.json({ status: 'online', service: 'Evolution AI Bot' }));

app.get('/api/stats', (req, res) => res.json(appState));
app.get('/api/health', (req, res) => res.json({ status: 'online', uptime: process.uptime() }));
app.get('/api/history', (req, res) => res.json(appState.history.slice(-50)));
app.get('/api/logs', (req, res) => res.json(appState.logs.slice(-100)));
app.get('/api/config', (req, res) => res.json(appState.config));

app.post('/api/config', (req, res) => {
  appState.config = { ...appState.config, ...req.body };
  adicionarLog('[SUCCESS]', 'Configurações atualizadas');
  res.json({ success: true });
});

// Envio manual via dashboard
app.post('/api/send-message', async (req, res) => {
  const { phone, text } = req.body;
  try {
    await sendMessage(phone, text);
    res.json({ message: 'Mensagem enviada!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/send-document', async (req, res) => {
  const { phone, docUrl, docName } = req.body;
  try {
    await sendDocument(phone, docUrl, docName);
    res.json({ message: 'Documento enviado!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ====================== ROTAS CRM ======================

/**
 * CONTATOS
 */

// Listar todos os contatos
app.get('/api/crm/contacts', (req, res) => {
  const { status, tag, search, sort } = req.query;
  
  let contacts;
  if (search) {
    contacts = ContactManager.search(search);
  } else {
    contacts = ContactManager.listAll({ status, tag, sortBy: sort });
  }
  
  res.json({
    total: contacts.length,
    data: contacts,
  });
});

// Obter perfil detalhado de um contato
app.get('/api/crm/contacts/:phone', (req, res) => {
  const profile = ContactManager.getProfile(req.params.phone);
  
  if (!profile) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }
  
  res.json(profile);
});

// Registrar novo contato
app.post('/api/crm/contacts', (req, res) => {
  try {
    const { phone, name, email, company, metadata } = req.body;
    
    // Validar dados
    const validation = validateContact({ phone, name, email, company, metadata });
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Dados de contato inválidos', 
        details: validation.errors 
      });
    }
    
    // Limpar e sanitizar dados
    const cleaned = cleanContact({ phone, name, email, company, metadata });
    
    // Registrar contato
    const contact = ContactManager.register(cleaned.phone, cleaned.name, { 
      email: cleaned.email, 
      company: cleaned.company, 
      ...cleaned.metadata 
    });
    
    res.status(201).json({ success: true, contact });
  } catch (error) {
    console.error('[API] Erro ao criar contato:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar contato
app.put('/api/crm/contacts/:phone', (req, res) => {
  const contact = ContactManager.updateInfo(req.params.phone, req.body);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }
  
  res.json(contact);
});

// Adicionar nota ao contato
app.post('/api/crm/contacts/:phone/notes', (req, res) => {
  const { note } = req.body;
  
  if (!note) {
    return res.status(400).json({ error: 'Nota é obrigatória' });
  }
  
  const contact = ContactManager.addNote(req.params.phone, note);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }
  
  res.json(contact);
});

// Bloquear contato
app.post('/api/crm/contacts/:phone/block', (req, res) => {
  const { reason } = req.body;
  const contact = ContactManager.block(req.params.phone, reason);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }
  
  res.json({ message: 'Contato bloqueado', contact });
});

// Desbloquear contato
app.post('/api/crm/contacts/:phone/unblock', (req, res) => {
  const contact = ContactManager.unblock(req.params.phone);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }
  
  res.json({ message: 'Contato desbloqueado', contact });
});

// Deletar contato
app.delete('/api/crm/contacts/:phone', (req, res) => {
  ContactManager.delete(req.params.phone);
  res.json({ message: 'Contato deletado com sucesso' });
});

/**
 * MENSAGENS E HISTÓRICO
 */

// Obter histórico de um contato
app.get('/api/crm/messages/:phone', async (req, res) => {
  try {
    const { limit } = req.query;
    const history = MessageManager.getHistory(req.params.phone, parseInt(limit) || 50);
    
    if (history.length === 0) {
      const contact = await db.getContact(req.params.phone);
      if (!contact) {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }
    }
    
    res.json({
      phone: req.params.phone,
      total: history.length,
      messages: history,
    });
  } catch (error) {
    console.error('[API] Erro ao obter mensagens:', error.message);
    res.status(500).json({ error: 'Erro ao obter mensagens' });
  }
});

// Exportar histórico como texto
app.get('/api/crm/messages/:phone/export', (req, res) => {
  const report = MessageManager.exportHistory(req.params.phone);
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="historico_${req.params.phone}.txt"`);
  res.send(report);
});

// Obter estatísticas de conversa
app.get('/api/crm/messages/:phone/stats', (req, res) => {
  const stats = MessageManager.getConversationStats(req.params.phone);
  res.json(stats);
});

/**
 * TAGS
 */

// Listar todas as tags
app.get('/api/crm/tags', (req, res) => {
  const tags = TagManager.listAll();
  const suggested = TagManager.getSuggested();
  
  res.json({
    active: tags,
    suggested,
  });
});

// Obter contatos com uma tag
app.get('/api/crm/tags/:tag/contacts', (req, res) => {
  const contacts = TagManager.getContacts(req.params.tag);
  res.json({
    tag: req.params.tag,
    total: contacts.length,
    data: contacts,
  });
});

// Adicionar tag a contato
app.post('/api/crm/contacts/:phone/tags', (req, res) => {
  const { tag } = req.body;
  
  if (!tag) {
    return res.status(400).json({ error: 'Tag é obrigatória' });
  }
  
  const contact = TagManager.add(req.params.phone, tag);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }
  
  res.json(contact);
});

// Remover tag de contato
app.delete('/api/crm/contacts/:phone/tags/:tag', (req, res) => {
  const contact = TagManager.remove(req.params.phone, req.params.tag);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }
  
  res.json(contact);
});

/**
 * DASHBOARD E ANALYTICS
 */

// Dashboard completo
app.get('/api/crm/dashboard', (req, res) => {
  const dashboard = Analytics.getDashboard();
  res.json(dashboard);
});

// Estatísticas gerais
app.get('/api/crm/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('[API] Erro ao obter stats:', error.message);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// Lista de contatos por status
app.get('/api/crm/contacts-by-status', (req, res) => {
  res.json(Analytics.getContactsByStatus());
});

// Top contatos (mais ativos)
app.get('/api/crm/top-contacts', (req, res) => {
  const { limit } = req.query;
  res.json(Analytics.getTopContacts(parseInt(limit) || 10));
});

// Top tags
app.get('/api/crm/top-tags', (req, res) => {
  res.json(Analytics.getTopTags());
});

// ====================== ROTAS WEB (INTERFACE) ======================

/**
 * Interface Principal - CRM Dashboard
 */
app.get('/crm', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'crm.html'));
});

/**
 * Página Inicial - Status do Bot
 */
app.get('/', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      status: '✅ Online',
      service: 'WhatsApp AI Bot com CRM',
      uptime: process.uptime(),
      stats,
      endpoints: {
        dashboard: '/crm',
        api: '/api/crm',
        webhook: '/webhook',
      },
    });
  } catch (error) {
    console.error('[API] Erro ao obter stats da página inicial:', error.message);
    res.json({
      status: '✅ Online',
      service: 'WhatsApp AI Bot com CRM',
      uptime: process.uptime(),
      endpoints: {
        dashboard: '/crm',
        api: '/api/crm',
        webhook: '/webhook',
      },
    });
  }
});

// ====================== ROTAS DE FUNCIONALIDADES EXTRAS ======================

/**
 * AUTOMATIONS (Follow-ups)
 */

// Agendar follow-up
app.post('/api/crm/automation/follow-up', (req, res) => {
  try {
    const { phone, message, dueDate } = req.body;

    // Validar dados
    const validation = validateFollowUp({ phone, message, dueDate });
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Dados de follow-up inválidos', 
        details: validation.errors 
      });
    }

    // Limpar e sanitizar dados
    const cleaned = cleanFollowUp({ phone, message, dueDate });

    const followUp = Automation.scheduleFollowUp(cleaned.phone, cleaned.message, cleaned.dueDate);

    if (!followUp) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.status(201).json({ success: true, followUp });
  } catch (error) {
    console.error('[API] Erro ao agendar follow-up:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Obter follow-ups pendentes
app.get('/api/crm/automation/pending-follow-ups', (req, res) => {
  const pending = Automation.getPendingFollowUps();
  res.json({
    total: pending.length,
    data: pending,
  });
});

// Completar follow-up
app.post('/api/crm/automation/follow-up/:phone/:id/complete', (req, res) => {
  const completed = Automation.completeFollowUp(req.params.phone, req.params.id);

  if (!completed) {
    return res.status(404).json({ error: 'Follow-up não encontrado' });
  }

  res.json({ message: 'Follow-up marcado como completo', completed });
});

/**
 * SEGMENTATION (Análise de Clientes)
 */

// Segmentar contatos
app.get('/api/crm/segmentation/segment', (req, res) => {
  const { byValue, inactiveDays, tag, status } = req.query;

  const criteria = {
    byValue,
    inactiveDays: inactiveDays ? parseInt(inactiveDays) : null,
    tag,
    status,
  };

  const segmented = Segmentation.segmentContacts(criteria);

  res.json({
    criteria,
    total: segmented.length,
    data: segmented,
  });
});

// VIP Contacts
app.get('/api/crm/segmentation/vip', (req, res) => {
  const vips = Segmentation.getVIPContacts();
  res.json({
    total: vips.length,
    data: vips,
  });
});

// Leads Inativos
app.get('/api/crm/segmentation/inactive-leads', (req, res) => {
  const { days } = req.query;
  const inactive = Segmentation.getInactiveLeads(parseInt(days) || 7);
  res.json({
    daysInactive: parseInt(days) || 7,
    total: inactive.length,
    data: inactive,
  });
});

// Customer Journey
app.get('/api/crm/segmentation/journey/:phone', (req, res) => {
  const journey = Segmentation.getCustomerJourney(req.params.phone);

  if (!journey.daysSinceFirstMessage) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }

  res.json(journey);
});

/**
 * REWARDS (Pontos)
 */

// Adicionar pontos
app.post('/api/crm/rewards/add-points', (req, res) => {
  const { phone, points, reason } = req.body;

  if (!phone || !points) {
    return res.status(400).json({ error: 'Campos obrigatórios: phone, points' });
  }

  const totalPoints = RewardSystem.addPoints(phone, points, reason);

  if (totalPoints === null) {
    return res.status(404).json({ error: 'Contato não encontrado' });
  }

  res.json({
    phone,
    pointsAdded: points,
    totalPoints,
    message: '✅ Pontos adicionados com sucesso',
  });
});

// Usar/Resgatar pontos
app.post('/api/crm/rewards/use-points', (req, res) => {
  const { phone, points, reward } = req.body;

  if (!phone || !points) {
    return res.status(400).json({ error: 'Campos obrigatórios: phone, points' });
  }

  const remainingPoints = RewardSystem.usePoints(phone, points, reward);

  if (remainingPoints === null) {
    return res.status(400).json({ error: 'Pontos insuficientes ou contato não encontrado' });
  }

  res.json({
    phone,
    pointsUsed: points,
    remainingPoints,
    reward,
    message: '✅ Pontos resgatados com sucesso',
  });
});

// Obter saldo de pontos
app.get('/api/crm/rewards/points/:phone', (req, res) => {
  const points = RewardSystem.getPoints(req.params.phone);
  res.json({
    phone: req.params.phone,
    points,
  });
});

// Top contatos por pontos
app.get('/api/crm/rewards/top', (req, res) => {
  const { limit } = req.query;
  const top = RewardSystem.getTopByPoints(parseInt(limit) || 10);
  res.json({
    total: top.length,
    data: top,
  });
});

/**
 * SENTIMENT (Análise de Feedback)
 */

// Adicionar feedback
app.post('/api/crm/sentiment/feedback', (req, res) => {
  try {
    const { phone, content, type, rating } = req.body;

    // Validar dados
    const validation = validateFeedback({ phone, content, type, rating });
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Dados de feedback inválidos', 
        details: validation.errors 
      });
    }

    // Limpar e sanitizar dados
    const cleaned = cleanFeedback({ phone, content, type, rating });

    const feedback = SentimentAnalysis.addFeedback(cleaned.phone, { 
      content: cleaned.content, 
      type: cleaned.type, 
      rating: cleaned.rating 
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.status(201).json({
      success: true,
      phone: cleaned.phone,
      feedback: feedback[feedback.length - 1],
      message: '✅ Feedback registrado com sucesso',
    });
  } catch (error) {
    console.error('[API] Erro ao adicionar feedback:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Positivos
app.get('/api/crm/sentiment/positive', (req, res) => {
  const positive = SentimentAnalysis.getPositiveFeedback();
  res.json({
    total: positive.length,
    data: positive,
  });
});

// Negativos
app.get('/api/crm/sentiment/negative', (req, res) => {
  const negative = SentimentAnalysis.getNegativeFeedback();
  res.json({
    total: negative.length,
    data: negative,
  });
});

// Reputação da marca
app.get('/api/crm/sentiment/brand-reputation', (req, res) => {
  const reputation = SentimentAnalysis.getBrandReputation();
  res.json(reputation);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Webhook Evolution configurado em: http://localhost:${PORT}/webhook`);
  console.log(`📊 CRM Dashboard: http://localhost:${PORT}/crm`);
  console.log(`📱 API Endpoints: http://localhost:${PORT}/api/crm`);
});
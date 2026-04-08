require('dotenv').config();
const express = require('express');
const path = require('path');
const { sendMessage, sendDocument, markAsRead } = require('./services/whatsapp');
const { gerarResposta } = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store para histórico e estatísticas
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

// Logs
console.log('[Server] Iniciando servidor de automação WhatsApp com IA');
console.log(`[Server] Phone Number ID: ${process.env.PHONE_NUMBER_ID}`);

/**
 * GET /webhook - Validação do webhook do WhatsApp
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[Webhook] Recebido pedido de verificação`);

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log(`[Webhook] Webhook verificado com sucesso`);
    res.status(200).send(challenge);
  } else {
    console.error(`[Webhook] Falha na verificação: token inválido`);
    res.sendStatus(403);
  }
});

/**
 * POST /webhook - Recebe mensagens do WhatsApp
 */
app.post('/webhook', async (req, res) => {
  try {
    const dados = req.body;

    // Validar se é uma entrada válida
    if (dados.object !== 'whatsapp_business_account') {
      res.sendStatus(404);
      return;
    }

    const entry = dados.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    // Se não houver mensagens, retornar
    if (!messages || messages.length === 0) {
      res.sendStatus(200);
      return;
    }

    // Processar cada mensagem
    for (const mensagem of messages) {
      await processarMensagem(mensagem, value);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook] Erro ao processar webhook:', error.message);
    res.sendStatus(500);
  }
});

/**
 * Adiciona um log ao histórico
 */
function adicionarLog(tipo, mensagem) {
  const agora = new Date().toLocaleTimeString('pt-BR');
  appState.logs.push({
    type: tipo,
    message: mensagem,
    timestamp: new Date().toISOString(),
  });

  console.log(`${agora} ${tipo} ${mensagem}`);

  // Manter máximo de 500 logs
  if (appState.logs.length > 500) {
    appState.logs = appState.logs.slice(-500);
  }
}

/**
 * Processa uma mensagem recebida do WhatsApp
 * @param {object} mensagem - Objeto da mensagem
 * @param {object} value - Contexto da mensagem
 */
async function processarMensagem(mensagem, value) {
  try {
    const numeroOrigem = mensagem.from;
    const messageId = mensagem.id;
    const textoRecebido = mensagem.text?.body || '';

    console.log(`[Processamento] Mensagem de ${numeroOrigem}: "${textoRecebido}"`);
    appState.messagesReceived++;

    // Marcar como lida
    try {
      await markAsRead(messageId);
    } catch (error) {
      console.warn('[Processamento] Não foi possível marcar mensagem como lida');
    }

    let tipoResposta = '';
    let resposta = '';

    // Status da loja
    if (textoRecebido.toLowerCase().trim() === 'oi') {
      console.log(`[Processamento] Detectado: cumprimento "oi"`);
      tipoResposta = 'Cumprimento';
      resposta = await gerarResposta(
        'Responda de forma breve e amigável a um cumprimento de um cliente.'
      );
      await sendMessage(numeroOrigem, resposta);
    }
    // Enviar catálogo (PDF)
    else if (textoRecebido.toLowerCase().trim() === 'catalogo') {
      console.log(`[Processamento] Detectado: pedido de catálogo`);
      tipoResposta = 'Catálogo';

      // Enviar resposta informativa
      await sendMessage(
        numeroOrigem,
        'Aqui está nosso catálogo! 📄 Confira os produtos disponíveis.'
      );

      // Enviar PDF - Substitua o link pelo seu PDF hospedado
      const linkCatalogo =
        'https://exemplo.com/catalogo.pdf';
      try {
        await sendDocument(numeroOrigem, linkCatalogo, 'Catalogo.pdf');
        resposta = 'Catálogo enviado';
      } catch (error) {
        console.error('[Processamento] Erro ao enviar catálogo');
        await sendMessage(
          numeroOrigem,
          'Desculpe, não consegui enviar o catálogo agora. Tente novamente mais tarde.'
        );
        resposta = 'Erro ao enviar catálogo';
      }
    }
    // Qualquer outra mensagem - responder com IA
    else {
      console.log(`[Processamento] Usando IA para responder`);
      tipoResposta = 'IA';
      resposta = await gerarResposta(textoRecebido);
      await sendMessage(numeroOrigem, resposta);
    }

    // Adicionar ao histórico
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
    console.error('[Processamento] Erro ao processar mensagem:', error.message);
    adicionarLog('[ERROR]', `Erro ao processar: ${error.message}`);
  }
}

/**
 * GET / - Health check
 */
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'WhatsApp AI Automation',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * ====== ENDPOINTS DA API PARA O DASHBOARD ======
 */

/**
 * GET /api/stats - Retorna estatísticas
 */
app.get('/api/stats', (req, res) => {
  res.json({
    messagesReceived: appState.messagesReceived,
    messagesSent: appState.messagesSent,
    errors: appState.errors,
    avgTime: appState.avgTime,
  });
});

/**
 * GET /api/health - Status do servidor
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

/**
 * GET /api/history - Retorna histórico de mensagens
 */
app.get('/api/history', (req, res) => {
  res.json(appState.history.slice(-50));
});

/**
 * GET /api/logs - Retorna últimos logs
 */
app.get('/api/logs', (req, res) => {
  res.json(appState.logs.slice(-100));
});

/**
 * GET /api/config - Retorna configurações
 */
app.get('/api/config', (req, res) => {
  res.json(appState.config);
});

/**
 * POST /api/config - Salvar configurações
 */
app.post('/api/config', (req, res) => {
  try {
    appState.config = { ...appState.config, ...req.body };
    adicionarLog('[SUCCESS]', 'Configurações atualizadas');
    res.json({ success: true, message: 'Configurações salvas' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/send-message - Enviar mensagem manual
 */
app.post('/api/send-message', async (req, res) => {
  try {
    const { phone, type, text } = req.body;

    if (!phone || !text) {
      return res.status(400).json({ error: 'Phone e text são obrigatórios' });
    }

    let resposta = text;

    if (type === 'ai') {
      resposta = await gerarResposta(text);
    }

    await sendMessage(phone, resposta);

    appState.messagesSent++;
    appState.history.push({
      phone,
      message: resposta,
      type: type === 'ai' ? 'IA' : 'Manual',
      timestamp: new Date().toISOString(),
      status: 'enviada',
    });

    adicionarLog('[SUCCESS]', `Mensagem enviada para ${phone}`);
    res.json({ success: true, message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    appState.errors++;
    adicionarLog('[ERROR]', `Erro ao enviar mensagem: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/send-document - Enviar documento
 */
app.post('/api/send-document', async (req, res) => {
  try {
    const { phone, docUrl, docName } = req.body;

    if (!phone || !docUrl) {
      return res.status(400).json({ error: 'Phone e docUrl são obrigatórios' });
    }

    await sendDocument(phone, docUrl, docName || 'documento.pdf');

    appState.messagesSent++;
    appState.history.push({
      phone,
      message: `📄 Documento: ${docName}`,
      type: 'Documento',
      timestamp: new Date().toISOString(),
      status: 'enviada',
    });

    adicionarLog('[SUCCESS]', `Documento enviado para ${phone}`);
    res.json({ success: true, message: 'Documento enviado com sucesso' });
  } catch (error) {
    appState.errors++;
    adicionarLog('[ERROR]', `Erro ao enviar documento: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Iniciar servidor
 */
app.listen(PORT, () => {
  console.log(`[Server] ✅ Servidor rodando em porta ${PORT}`);
  console.log(`[Server] Dashboard: http://localhost:${PORT}`);
  console.log(`[Server] Webhook URL: http://seu-dominio.com/webhook`);
  console.log(`[Server] Endpoints disponíveis:`);
  console.log(`[Server]   GET  / - Health check`);
  console.log(`[Server]   GET  /webhook - Validação do webhook`);
  console.log(`[Server]   POST /webhook - Receber mensagens`);
  console.log(`[Server]   GET  /api/stats - Estatísticas`);
  console.log(`[Server]   GET  /api/history - Histórico`);
  console.log(`[Server]   GET  /api/logs - Logs`);
  console.log(`[Server]   POST /api/send-message - Enviar mensagem`);
  console.log(`[Server]   POST /api/send-document - Enviar documento`);
  adicionarLog('[INFO]', 'Servidor iniciado com sucesso');
});

// Tratar erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Error] Promessa rejeitada não tratada:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Error] Exceção não capturada:', error.message);
});

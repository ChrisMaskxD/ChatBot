require('dotenv').config();
const express = require('express');
const path = require('path');
const { sendMessage, sendDocument, markAsRead } = require('./services/whatsapp');
const { gerarResposta, limparHistorico } = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const PDF_CATALOGO_URL = process.env.PDF_CATALOGO_URL || '';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Estado da aplicação
const appState = {
  messagesReceived: 0,
  messagesSent: 0,
  errors: 0,
  avgTime: 0,
  history: [],
  logs: [],
  config: {
    aiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500,
    customPrompt: '',
  },
};

console.log('[Server] Iniciando servidor WhatsApp AI Bot');
console.log(`[Server] Phone Number ID: ${process.env.PHONE_NUMBER_ID}`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function adicionarLog(tipo, mensagem) {
  const agora = new Date().toLocaleTimeString('pt-BR');
  appState.logs.push({ type: tipo, message: mensagem, timestamp: new Date().toISOString() });
  console.log(`${agora} ${tipo} ${mensagem}`);
  if (appState.logs.length > 500) appState.logs = appState.logs.slice(-500);
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('[Webhook] Verificado com sucesso');
    res.status(200).send(challenge);
  } else {
    console.error('[Webhook] Falha na verificação: token inválido');
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const dados = req.body;
    if (dados.object !== 'whatsapp_business_account') return res.sendStatus(404);

    const messages = dados.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) return res.sendStatus(200);

    for (const mensagem of messages) {
      await processarMensagem(mensagem);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Webhook] Erro:', error.message);
    res.sendStatus(500);
  }
});

// ─── Processamento de mensagens ───────────────────────────────────────────────

async function processarMensagem(mensagem) {
  const inicio = Date.now();
  const numeroOrigem = mensagem.from;
  const messageId = mensagem.id;

  try {
    appState.messagesReceived++;

    // Marcar como lida
    try { await markAsRead(messageId); } catch {}

    // Ignorar mensagens que não são de texto
    if (mensagem.type !== 'text') {
      await sendMessage(numeroOrigem, 'Olá! No momento, só consigo responder mensagens de texto. 😊');
      adicionarLog('[INFO]', `Mensagem não-texto ignorada de ${numeroOrigem} (tipo: ${mensagem.type})`);
      return;
    }

    const textoRecebido = mensagem.text.body.trim();
    console.log(`[Processamento] De ${numeroOrigem}: "${textoRecebido}"`);

    let tipoResposta = '';
    let resposta = '';

    // Comando: limpar histórico
    if (textoRecebido.toLowerCase() === 'limpar' || textoRecebido.toLowerCase() === '/limpar') {
      limparHistorico(numeroOrigem);
      resposta = 'Histórico da conversa limpo! Podemos começar do zero. 😊';
      tipoResposta = 'Comando';
      await sendMessage(numeroOrigem, resposta);
    }
    // Cumprimento
    else if (textoRecebido.toLowerCase() === 'oi' || textoRecebido.toLowerCase() === 'olá') {
      tipoResposta = 'Cumprimento';
      resposta = await gerarResposta(numeroOrigem, textoRecebido, appState.config);
      await sendMessage(numeroOrigem, resposta);
    }
    // Catálogo
    else if (textoRecebido.toLowerCase() === 'catalogo' || textoRecebido.toLowerCase() === 'catálogo') {
      tipoResposta = 'Catálogo';
      await sendMessage(numeroOrigem, 'Aqui está nosso catálogo! 📄 Confira os produtos disponíveis.');

      if (!PDF_CATALOGO_URL) {
        await sendMessage(numeroOrigem, 'O catálogo ainda não está disponível. Entre em contato conosco!');
        resposta = 'Catálogo sem URL configurada';
      } else {
        try {
          await sendDocument(numeroOrigem, PDF_CATALOGO_URL, 'Catalogo.pdf');
          resposta = 'Catálogo enviado';
        } catch {
          await sendMessage(numeroOrigem, 'Desculpe, não consegui enviar o catálogo agora. Tente novamente mais tarde.');
          resposta = 'Erro ao enviar catálogo';
        }
      }
    }
    // Qualquer outra mensagem → IA com contexto de conversa
    else {
      tipoResposta = 'IA';
      resposta = await gerarResposta(numeroOrigem, textoRecebido, appState.config);
      await sendMessage(numeroOrigem, resposta);
    }

    // Atualizar stats
    const tempo = Date.now() - inicio;
    appState.messagesSent++;
    appState.avgTime = Math.round((appState.avgTime + tempo) / 2);
    appState.history.push({
      phone: numeroOrigem,
      message: textoRecebido,
      response: resposta,
      type: tipoResposta,
      timestamp: new Date().toISOString(),
      status: 'respondida',
    });
    if (appState.history.length > 500) appState.history = appState.history.slice(-500);

    adicionarLog('[SUCCESS]', `${tipoResposta} para ${numeroOrigem} (${tempo}ms)`);
  } catch (error) {
    appState.errors++;
    console.error('[Processamento] Erro:', error.message);
    adicionarLog('[ERROR]', `Erro ao processar mensagem de ${numeroOrigem}: ${error.message}`);
  }
}

// ─── API do Dashboard ─────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'online', service: 'WhatsApp AI Bot', version: '1.1.0', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  res.json({
    messagesReceived: appState.messagesReceived,
    messagesSent: appState.messagesSent,
    errors: appState.errors,
    avgTime: appState.avgTime,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', uptime: process.uptime(), memory: process.memoryUsage() });
});

app.get('/api/history', (req, res) => {
  res.json(appState.history.slice(-50));
});

app.get('/api/logs', (req, res) => {
  res.json(appState.logs.slice(-100));
});

app.get('/api/config', (req, res) => {
  res.json(appState.config);
});

// Salvar configurações — agora elas são realmente usadas pela IA
app.post('/api/config', (req, res) => {
  try {
    const { aiModel, temperature, maxTokens, customPrompt } = req.body;
    if (aiModel) appState.config.aiModel = aiModel;
    if (temperature !== undefined) appState.config.temperature = parseFloat(temperature);
    if (maxTokens !== undefined) appState.config.maxTokens = parseInt(maxTokens);
    if (customPrompt !== undefined) appState.config.customPrompt = customPrompt;
    adicionarLog('[SUCCESS]', 'Configurações atualizadas via dashboard');
    res.json({ success: true, message: 'Configurações salvas', config: appState.config });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { phone, type, text } = req.body;
    if (!phone || !text) return res.status(400).json({ error: 'phone e text são obrigatórios' });

    let resposta = text;
    if (type === 'ai') {
      resposta = await gerarResposta(phone, text, appState.config);
    }

    await sendMessage(phone, resposta);
    appState.messagesSent++;
    appState.history.push({
      phone, message: resposta,
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

app.post('/api/send-document', async (req, res) => {
  try {
    const { phone, docUrl, docName } = req.body;
    if (!phone || !docUrl) return res.status(400).json({ error: 'phone e docUrl são obrigatórios' });

    await sendDocument(phone, docUrl, docName || 'documento.pdf');
    appState.messagesSent++;
    appState.history.push({
      phone, message: `📄 Documento: ${docName}`,
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

// Novo endpoint: limpar histórico de um usuário pelo dashboard
app.delete('/api/history/:phone', (req, res) => {
  const phone = req.params.phone;
  limparHistorico(phone);
  adicionarLog('[INFO]', `Histórico limpo para ${phone}`);
  res.json({ success: true, message: `Histórico de ${phone} limpo` });
});

// ─── Iniciar ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[Server] ✅ Rodando na porta ${PORT}`);
  console.log(`[Server] Dashboard: http://localhost:${PORT}`);
  adicionarLog('[INFO]', 'Servidor iniciado com sucesso');
});

process.on('unhandledRejection', (reason) => {
  console.error('[Error] Promessa rejeitada não tratada:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Error] Exceção não capturada:', error.message);
});

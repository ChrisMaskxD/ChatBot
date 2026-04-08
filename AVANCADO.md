# ⚙️ CONFIGURAÇÕES AVANÇADAS

Personalizações e extensões para casos de uso mais complexos.

## 🎯 Customizações de IA

### 1. Sistema de Prompts Personalizado

Crie um arquivo `config/prompts.js`:

```javascript
const prompts = {
  atendimento: {
    system: `Você é um atendente de atendimento ao cliente profissional e amigável.
      - Sempre responda em português
      - Seja conciso e útil
      - Se não souber a resposta, ofereça contato com um gerente
      - Use emojis ocasionalmente para melhor comunicação`,
  },
  vendas: {
    system: `Você é um vendedor profissional.
      - Destaque os benefícios dos produtos
      - Seja persuasivo mas honesto
      - Sempre ofereça ajuda adicional`,
  },
  suporte: {
    system: `Você é um especialista em suporte técnico.
      - Explique soluções de forma clara
      - Use linguagem técnica apropriada
      - Ofereça passos simples para resolver problemas`,
  },
};

module.exports = prompts;
```

### 2. Multi-Departamento

```javascript
// services/ai.js - versão melhorada
async function gerarResposta(mensagem, departamento = 'atendimento') {
  const prompts = require('../config/prompts');
  const systemPrompt = prompts[departamento]?.system || prompts.atendimento.system;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: mensagem },
    ],
  });

  return completion.choices[0].message.content;
}
```

### 3. Context Persistente

```javascript
// services/context.js - Manter conversa do usuário
const Map = require('collections/map');

class ContextManager {
  constructor() {
    this.contextos = new Map();
  }

  adicionar(numeroUsuario, mensagem, resposta) {
    if (!this.contextos.has(numeroUsuario)) {
      this.contextos.set(numeroUsuario, []);
    }
    this.contextos.get(numeroUsuario).push({
      timestamp: new Date(),
      mensagem,
      resposta,
    });
  }

  obter(numeroUsuario) {
    return this.contextos.get(numeroUsuario) || [];
  }

  limpar(numeroUsuario) {
    this.contextos.delete(numeroUsuario);
  }
}

module.exports = new ContextManager();
```

## 📊 Banco de Dados

### 1. Com MongoDB

```bash
npm install mongoose
```

```javascript
// models/Conversa.js
const mongoose = require('mongoose');

const conversaSchema = new mongoose.Schema({
  numeroUsuario: String,
  mensagens: [{
    texto: String,
    resposta: String,
    timestamp: Date,
  }],
  criado: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Conversa', conversaSchema);
```

### 2. Com SQLite

```bash
npm install sqlite3
```

```javascript
// services/database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bot.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS mensagens (
      id INTEGER PRIMARY KEY,
      numero TEXT,
      mensagem TEXT,
      resposta TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

function salvarMensagem(numero, mensagem, resposta) {
  db.run(
    'INSERT INTO mensagens (numero, mensagem, resposta) VALUES (?, ?, ?)',
    [numero, mensagem, resposta]
  );
}

module.exports = { salvarMensagem };
```

## 📤 Processamento de Arquivos

### 1. Gerar PDF Dinamicamente

```bash
npm install pdfkit
```

```javascript
// services/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');

function gerarCatalogo(dados) {
  const doc = new PDFDocument();
  const stream = fs.createWriteStream('./temp/catalogo.pdf');

  doc.pipe(stream);

  doc.fontSize(25).text('Catálogo de Produtos', 100, 100);
  doc.fontSize(12);

  dados.forEach((produto, i) => {
    doc.text(`${produto.nome} - R$ ${produto.preco}`, 100, 150 + i * 30);
  });

  doc.end();
  return './temp/catalogo.pdf';
}

module.exports = { gerarCatalogo };
```

### 2. Processar Imagens

```bash
npm install jimp
```

```javascript
// services/imgProcessor.js
const Jimp = require('jimp');

async function processarImagem(caminhoOrigem) {
  const imagem = await Jimp.read(caminhoOrigem);
  await imagem
    .resize(1080, 1080)
    .quality(80)
    .write('./temp/processada.jpg');
  
  return './temp/processada.jpg';
}

module.exports = { processarImagem };
```

## 🔌 Webhooks de Status

```javascript
// Rastrear status de entrega
app.post('/webhook', (req, res) => {
  const status = req.body.entry[0].changes[0].value.statuses;
  
  if (status && status[0].status === 'delivered') {
    console.log('✅ Mensagem entregue:', status[0].id);
  } else if (status && status[0].status === 'read') {
    console.log('👁️  Mensagem lida:', status[0].id);
  }

  res.sendStatus(200);
});
```

## 🔄 Fluxo de Conversação

```javascript
// services/flows.js
const flows = {
  vendas: {
    passo1: 'Qual produto você está interessado?',
    passo2: 'Qual é o seu orçamento?',
    passo3: 'Posso enviar um orçamento?',
  },
  suporte: {
    passo1: 'Qual é o seu problema?',
    passo2: 'Você já tentou...',
    passo3: 'Precisa de escalonamento?',
  },
};

class FlowManager {
  constructor() {
    this.userFlow = new Map();
  }

  iniciar(numeroUsuario, tipo) {
    this.userFlow.set(numeroUsuario, {
      tipo,
      passo: 1,
    });
  }

  proximoPasso(numeroUsuario) {
    const flow = this.userFlow.get(numeroUsuario);
    flow.passo++;
  }

  getMensagem(numeroUsuario) {
    const flow = this.userFlow.get(numeroUsuario);
    const tipo = flow.tipo;
    const passo = `passo${flow.passo}`;
    return flows[tipo][passo];
  }
}

module.exports = new FlowManager();
```

## 📊 Analytics e Logs

```bash
npm install winston
```

```javascript
// config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

module.exports = logger;
```

## 🔐 Validação de Segurança

```javascript
// services/security.js
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Validar assinatura
function validarAssinatura(mensagem, assinatura) {
  const hash = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(mensagem)
    .digest('hex');
  
  return hash === assinatura;
}

// Rate limiting por usuário
const limiterPorUsuario = new Map();

function verificarRateLimit(numeroUsuario) {
  const agora = Date.now();
  const limite = limiterPorUsuario.get(numeroUsuario) || [];
  
  // Remover requisições antigas (mais de 1 minuto)
  const recentes = limite.filter(t => agora - t < 60000);
  
  if (recentes.length > 10) {
    return false; // Bloqueado
  }
  
  recentes.push(agora);
  limiterPorUsuario.set(numeroUsuario, recentes);
  return true;
}

module.exports = { validarAssinatura, verificarRateLimit };
```

## 🤖 Integração com Rasa (NLU avançado)

```bash
npm install rasa-sdk
```

```javascript
// services/nlu.js
async function entenderIntencao(mensagem) {
  const response = await axios.post('http://localhost:5005/model/parse', {
    text: mensagem,
  });

  return {
    intencao: response.data.intent.name,
    confianca: response.data.intent.confidence,
    entidades: response.data.entities,
  };
}

module.exports = { entenderIntencao };
```

## 📞 Transferência para Agente Humano

```javascript
// server.js - adicionar na processarMensagem
async function processarMensagem(mensagem, value) {
  const numeroOrigem = mensagem.from;
  const textoRecebido = mensagem.text?.body || '';

  // Se "falar com agente"
  if (textoRecebido.toLowerCase().includes('agente')) {
    await sendMessage(
      numeroOrigem,
      'Conectando você com um agente... Por favor aguarde.'
    );
    // Notificar equipe via webhook/API
    await notificarEquipe(numeroOrigem);
    return;
  }

  // ... resto do código
}

async function notificarEquipe(numeroUsuario) {
  // Enviar para seu sistema de tickets/CRM
  await axios.post(process.env.TICKET_API, {
    usuario: numeroUsuario,
    tipo: 'transferencia_agente',
    timestamp: new Date(),
  });
}
```

## 🎁 Promoções Automáticas

```javascript
// services/promocoes.js
const promocoes = [
  {
    palavra: 'desconto',
    resposta: '🎉 Temos 20% de desconto para você! Use o código: DESCONTO20',
  },
  {
    palavra: 'cupom',
    resposta: 'Cupom disponível: WELCOME10 para 10% de desconto',
  },
];

function verificarPromocao(mensagem) {
  for (const promo of promocoes) {
    if (mensagem.toLowerCase().includes(promo.palavra)) {
      return promo.resposta;
    }
  }
  return null;
}

module.exports = { verificarPromocao };
```

## 🌐 Multi-idioma

```javascript
// config/i18n.js
const i18n = {
  pt: {
    oiResponde: 'Olá! Como posso ajudar?',
    catalogoResposta: 'Aqui está nosso catálogo',
  },
  en: {
    oiResponde: 'Hello! How can I help?',
    catalogoResposta: 'Here is our catalog',
  },
  es: {
    oiResponde: '¡Hola! ¿Cómo puedo ayudarte?',
    catalogoResposta: 'Aquí está nuestro catálogo',
  },
};

function traduzir(chave, idioma = 'pt') {
  return i18n[idioma]?.[chave] || i18n.pt[chave];
}

module.exports = { traduzir };
```

## 📈 Metrics e Dashboards

```javascript
// services/metrics.js
class MetricsCollector {
  constructor() {
    this.stats = {
      totalMensagensRecebidas: 0,
      totalMensagensEnviadas: 0,
      erros: 0,
      tempoMedioResposta: 0,
    };
  }

  registrarMensagem() {
    this.stats.totalMensagensRecebidas++;
  }

  registrarEnvio() {
    this.stats.totalMensagensEnviadas++;
  }

  registrarErro() {
    this.stats.erros++;
  }

  obterStats() {
    return this.stats;
  }
}

module.exports = new MetricsCollector();
```

Use em dashboard com Grafana/Prometheus para visualizar em tempo real.

---

**Essas configurações levam seu bot para o próximo nível! 🚀**

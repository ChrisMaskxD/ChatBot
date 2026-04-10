# 🤖 WhatsApp AI Automation Bot com CRM
[![Node.js](https://img.shields.io/badge/Node.js-v24-green?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-blue?logo=express)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)](https://www.sqlite.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT-412991?logo=openai)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Automação completa de WhatsApp integrada com **Inteligência Artificial**, **CRM profesional**, **banco de dados SQLite com criptografia AES** e **validação/sanitização de segurança**. Perfeito para empresas que desejam automatizar atendimento ao cliente com histórico de mensagens completo e análise de sentimento.

**⭐ Versão PRODUCTION-READY com todas as features implementadas!**

## ✨ Funcionalidades Principais

### 🤖 IA e Automação
- ✅ **Respostas Inteligentes** - GPT-3.5-turbo/GPT-4 integration
- ✅ **Análise de Sentimento** - Classificação automática de feedback
- ✅ **Automação de Follow-up** - Agendamento inteligente de mensagens
- ✅ **Segmentação de Clientes** - VIP, inativos, leads qualificados
- ✅ **Sistema de Recompensas** - Pontos de fidelização

### 💾 CRM Profesional
- ✅ **Gerenciamento de Contatos** - CRUD completo com metadata
- ✅ **Histórico de Mensagens** - Rastreamento completo de conversas
- ✅ **Sistema de Tags** - Classificação e categorização
- ✅ **Dashboard Web** - Interface moderna, responsiva e em tempo real

### 🔒 Segurança Empresarial  
- ✅ **Banco de Dados Criptografado** - SQLite com AES-256
- ✅ **Validação Rigorosa** - 25+ validadores contra XSS e injection
- ✅ **Sanitização de Entrada** - Limpeza automática de todos os dados
- ✅ **Backup Automático** - Cada hora, com rotação de versões
- ✅ **Prepared Statements** - Proteção SQL injection

### 📊 Analytics e Relatórios
- ✅ **Dashboard em Tempo Real** - Estatísticas ao vivo
- ✅ **Reputação da Marca** - Score de sentimento agregado
- ✅ **Top Contatos** - Maiores engajadores
- ✅ **Análise de Mensagens** - Entrada/saída por período

## 🚀 Quick Start (5 minutos)

### 📋 Pré-requisitos
- Node.js **v16+**
- Evolution API **OU** Meta WhatsApp Business
- OpenAI API Key

### 💾 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/whatsapp-ai-bot.git
cd whatsapp-ai-bot

# Instale dependências
npm install

# Copie arquivo de ambiente
cp .env.example .env

# Edite com suas credenciais
nano .env

# Inicie em desenvolvimento
npm run dev

# OU em produção
npm start
```

**Servidor iniciado:** http://localhost:3000

## ⚙️ Configuração do `.env`

```ini
# ─ Evolution API (Recomendado)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-secreta
EVOLUTION_INSTANCE_NAME=bot-local

# ─ OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# ─ Servidor
PORT=3000

# ─ Banco de Dados
DB_ENCRYPTION_KEY=sua-chave-super-secreta
```

### Setup Evolution API (Recomendado)

```bash
# Via Docker
docker run -d \
  -p 8080:8080 \
  -e WEBHOOK_URL=http://seu-ip:3000/webhook \
  atendai/evolution-api:latest
```

### Setup Meta WhatsApp Cloud API
## 💬 Uso e Exemplos

### API REST - Criar Contato

```bash
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511999999999",
    "name": "João Silva",
    "email": "joao@example.com",
    "company": "Empresa XYZ"
  }'
```

### Dashboard Web

Acesse **http://localhost:3000/crm**
- 📊 Estatísticas em tempo real
- 👥 Gerenciar contatos
- 💬 Histórico de mensagens
- 🏷️ Tags e classificações
- 🎯 Agendar follow-ups
- 📈 Análise de sentimento

## 🔌 API Endpoints Principais

### 👥 Contatos
```
GET    /api/crm/contacts              Listar todos
POST   /api/crm/contacts              Criar contato
GET    /api/crm/contacts/:phone       Detalhes
PUT    /api/crm/contacts/:phone       Atualizar
DELETE /api/crm/contacts/:phone       Deletar
```

### 💬 Mensagens
```
GET    /api/crm/messages/:phone       Histórico
POST   /api/crm/messages              Enviar
GET    /api/crm/messages/:phone/stats Estatísticas
```

### 🤖 Automação
```
POST   /api/crm/automation/follow-up               Agendar
GET    /api/crm/automation/pending-follow-ups      Listar
POST   /api/crm/automation/follow-up/:id/complete  Completar
```

### 📊 Analytics
```
GET    /api/crm/dashboard             Dashboard
GET    /api/crm/stats                 Estatísticas
GET    /api/crm/top-contacts          Top contatos
```

### 😊 Sentimento
```
POST   /api/crm/sentiment/feedback         Adicionar feedback
GET    /api/crm/sentiment/brand-reputation Reputação da marca
```

## 💻 Executando

### Desenvolvimento (com hot-reload)
```bash
npm run dev
```

### Produção
```bash
npm start
```

## 🗂️ Estrutura do Projeto

```
whatsapp-ai-bot/
├── server.js                      # 🎯 Entrada principal (738 linhas)
├── package.json                   # Dependências npm
├── .env.example                   # Modelo de configuração
│
├── services/                      # ⚙️ Lógica de negócio
│   ├── whatsapp.js               # Integração WhatsApp/Evolution
│   ├── ai.js                     # Integração OpenAI
│   ├── crm.js                    # Sistema CRM (600+ linhas)
│   ├── database-sqlite.js        # Banco de dados (700+ linhas)
│   └── validation.js             # Validação/sanitização (450+ linhas)
│
├── public/                        # 🌐 Frontend
│   ├── index.html                # Dashboard (1200+ linhas)
│   ├── crm.html                  # CRM interface (800+ linhas)
│   ├── style.css                 # Estilos (2000+ linhas)
│   └── app.js                    # JavaScript (600+ linhas)
│
├── scripts/                       # 📜 Utilitários
│   └── migrate-to-sqlite.js      # Migração JSON → SQLite
│
├── data/                          # 💾 Dados persistentes
│   ├── chatbot.db               # SQLite criptografado
│   └── backups/                 # Backups automáticos
│
└── docs/                          # 📚 Documentação
    ├── VALIDATION_GUIDE.md
    ├── WEBHOOK_CONFIG.md
    └── API_ENDPOINTS.md
```

## 🔒 Segurança

### 🛡️ Proteção Implementada

| Ameaça | Proteção | Status |
|--------|----------|--------|
| **XSS** | sanitizeHTML + middleware | ✅ |
| **SQL Injection** | Prepared statements | ✅ |
| **Dados Malformados** | Validação rigorosa | ✅ |
| **DoS** | Limites de tamanho | ✅ |
| **Data Breach** | AES-256 criptografia | ✅ |

### ✅ Validação

- 25+ validadores implementados
- Telefone (WhatsApp format)
- Email (RFC 5322)
- Mensagens (1-4096 chars)
- Datas (passado/futuro)
- Ratings (1-5)

### 🔐 Banco de Dados

- SQLite com AES-256 criptografia
- Emails criptografados automaticamente
- Backup automático a cada hora
- 6 tabelas normalizadas
- Foreign keys e cascading deletes

## 🧪 Testes

```bash
# Teste validação e sanitização
node test-validation.js

# Teste endpoints (requer servidor rodando)
curl http://localhost:3000/api/crm/stats
```

## 📈 Performance

- **Resposta média:** < 50ms (exceto IA)
- **Throughput:** ~1000 mensagens/segundo
- **Backup:** < 100ms

## 🛠️ Troubleshooting

### Porta 3000 em uso?
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro de validação?
- Verifique formato: `+5511999999999`
- Tamanho máximo de mensagem: 4096 caracteres

## 📚 Documentação Adicional

- [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md)
- [WEBHOOK_CONFIG.md](WEBHOOK_CONFIG.md)
- [DEPLOY.md](DEPLOY.md)

## 📜 Licença

MIT

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela!**

Made with ❤️ using Node.js, Express, SQLite & OpenAI

</div>

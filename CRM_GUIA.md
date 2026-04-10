# 📊 Sistema CRM Integrado - Guia Completo

Seu chatbot agora tem um **CRM profissional** integrado que:
- ✅ Guarda histórico completo de mensagens  
- ✅ Registra automaticamente todos os contatos
- ✅ Classifica contatos com tags
- ✅ Organiza notas e informações por cliente
- ✅ Gera estatísticas e analytics
- ✅ Exporta dados em relatórios

---

## 🚀 Como Funcionam os Dados

Todos os dados são salvos em **JSON files** na pasta `data/`:

```
data/
├── contacts.json      # Base de contatos
├── messages.json      # Histórico de mensagens
└── tags.json          # Sistema de tags
```

Quando Seu servidor iniciar:
```bash
npm start
```

Você verá:
```
[Database] contacts.json criado
[Database] messages.json criado
[Database] tags.json criado
```

---

## 📲 O que Acontece Automaticamente

### Quando um cliente envia mensagem:

1. **Contato é registrado** (se novo)
```json
{
  "id": "123456789_abc123",
  "phone": "5512991504190",
  "name": "Contato 5512991504190",
  "status": "ativo",
  "tags": [],
  "lastMessageAt": "2026-04-10T14:30:00.000Z",
  "createdAt": "2026-04-10T14:30:00.000Z"
}
```

2. **Mensagem é salva**
```json
{
  "id": "456789_xyz789",
  "phone": "5512991504190",
  "direction": "incoming",
  "content": "Olá, gostaria de informações",
  "type": "text",
  "timestamp": "2026-04-10T14:30:00.000Z",
  "status": "read"
}
```

3. **Resposta do bot também é salva**
```json
{
  "id": "789123_abc456",
  "phone": "5512991504190",
  "direction": "outgoing",
  "content": "Olá! Como posso ajudá-lo?",
  "type": "text",
  "timestamp": "2026-04-10T14:30:05.000Z",
  "status": "sent"
}
```

---

## 🔌 Endpoints da API CRM

### 📋 **CONTATOS** - Gerenciar clientes

#### Listar todos os contatos
```bash
GET /api/crm/contacts
GET /api/crm/contacts?status=ativo
GET /api/crm/contacts?tag=vip
GET /api/crm/contacts?search=João
GET /api/crm/contacts?sort=recent
```

**Resposta:**
```json
{
  "total": 25,
  "data": [
    {
      "id": "123456789_abc123",
      "phone": "5512991504190",
      "name": "João Silva",
      "email": "joao@email.com",
      "status": "ativo",
      "tags": ["cliente", "vip"],
      "lastMessageAt": "2026-04-10T14:30:00.000Z",
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ]
}
```

#### Obter perfil completo de um contato
```bash
GET /api/crm/contacts/5512991504190
```

**Resposta:**
```json
{
  "id": "123456789_abc123",
  "phone": "5512991504190",
  "name": "João Silva",
  "email": "joao@email.com",
  "status": "ativo",
  "tags": ["cliente", "vip"],
  "stats": {
    "total": 42,
    "incoming": 20,
    "outgoing": 22,
    "lastMessage": {
      "id": "789123_abc456",
      "content": "Obrigado!",
      "timestamp": "2026-04-10T14:30:00.000Z"
    }
  },
  "recentMessages": [
    // Últimas 10 mensagens
  ]
}
```

#### Registrar novo contato manualmente
```bash
POST /api/crm/contacts
Content-Type: application/json

{
  "phone": "5521999999999",
  "name": "Maria Santos",
  "email": "maria@email.com",
  "company": "Empresa XYZ",
  "metadata": {
    "origem": "facebook",
    "referenciado_por": "João"
  }
}
```

#### Atualizar informações do contato
```bash
PUT /api/crm/contacts/5512991504190
Content-Type: application/json

{
  "name": "João Silva Atualizado",
  "email": "novo-email@email.com",
  "company": "Nova Empresa"
}
```

#### Adicionar nota ao contato
```bash
POST /api/crm/contacts/5512991504190/notes
Content-Type: application/json

{
  "note": "Cliente interessado em planos premium. Agendar follow-up na segunda."
}
```

**Resposta** (nota é adicionada ao campo `notes`):
```json
{
  "phone": "5512991504190",
  "notes": "[2026-04-10 14:30]: Cliente interessado em planos premium. Agendar follow-up na segunda."
}
```

#### Bloquear contato (spam/indesejado)
```bash
POST /api/crm/contacts/5512991504190/block
Content-Type: application/json

{
  "reason": "Usuário enviando spam"
}
```

#### Desbloquear contato
```bash
POST /api/crm/contacts/5512991504190/unblock
```

#### Deletar contato
```bash
DELETE /api/crm/contacts/5512991504190
```

---

### 💬 **MENSAGENS** - Histórico de conversas

#### Obter histórico de um contato
```bash
GET /api/crm/messages/5512991504190
GET /api/crm/messages/5512991504190?limit=100
```

**Resposta:**
```json
{
  "phone": "5512991504190",
  "total": 42,
  "messages": [
    {
      "id": "456789_xyz789",
      "phone": "5512991504190",
      "direction": "incoming",
      "content": "Olá!",
      "type": "text",
      "timestamp": "2026-04-10T14:30:00.000Z",
      "status": "read"
    },
    {
      "id": "789123_abc456",
      "phone": "5512991504190",
      "direction": "outgoing",
      "content": "Olá! Como posso ajudá-lo?",
      "type": "text",
      "timestamp": "2026-04-10T14:30:05.000Z",
      "status": "sent"
    }
  ]
}
```

#### Exportar histórico como arquivo TXT
```bash
GET /api/crm/messages/5512991504190/export
```

Retorna um arquivo `.txt` com o histórico formatado:
```
HISTÓRICO DE CONVERSA - João Silva
Número: 5512991504190
Período: 2026-04-01 10:00 - 2026-04-10 14:30
Total de mensagens: 42

──────────────────────────────────────────────────────────────────────────────

[2026-04-01 10:00] 👤 Cliente: Olá!
[2026-04-01 10:00] 🤖 Bot: Olá! Como posso ajudá-lo?
[2026-04-01 10:01] 👤 Cliente: Gostaria de conhecer os planos
[2026-04-01 10:05] 🤖 Bot: Claro! Temos 3 planos: Basic, Pro e Premium...
```

#### Obter estatísticas de conversa
```bash
GET /api/crm/messages/5512991504190/stats
```

**Resposta:**
```json
{
  "total": 42,
  "incoming": 20,
  "outgoing": 22,
  "lastMessage": {
    "id": "789123_abc456",
    "content": "Obrigado!",
    "timestamp": "2026-04-10T14:30:00.000Z"
  }
}
```

---

### 🏷️ **TAGS** - Classificar contatos

#### Listar todas as tags
```bash
GET /api/crm/tags
```

**Resposta:**
```json
{
  "active": ["cliente", "vip", "lead", "suporte"],
  "suggested": [
    "cliente",
    "lead",
    "vip",
    "suporte",
    "vendas",
    "feedback",
    "teste",
    "ativo",
    "inativo",
    "spammer"
  ]
}
```

#### Obter contatos com uma tag específica
```bash
GET /api/crm/tags/vip/contacts
```

**Resposta:**
```json
{
  "tag": "vip",
  "total": 5,
  "data": [
    // Lista de contatos com tag "vip"
  ]
}
```

#### Adicionar tag a um contato
```bash
POST /api/crm/contacts/5512991504190/tags
Content-Type: application/json

{
  "tag": "vip"
}
```

#### Remover tag de um contato
```bash
DELETE /api/crm/contacts/5512991504190/tags/vip
```

---

### 📊 **ANALYTICS** - Relatórios e estatísticas

#### Dashboard completo
```bash
GET /api/crm/dashboard
```

**Resposta:**
```json
{
  "totalContacts": 127,
  "activeContacts": 105,
  "inactiveContacts": 15,
  "blockedContacts": 7,
  "totalMessages": 3241,
  "incomingMessages": 1620,
  "outgoingMessages": 1621,
  "lastUpdated": "2026-04-10T14:30:00.000Z",
  "topTags": [
    { "tag": "cliente", "count": 95 },
    { "tag": "vip", "count": 15 },
    { "tag": "lead", "count": 22 }
  ],
  "topContacts": [
    {
      "phone": "5511999999999",
      "name": "João Silva",
      "messageCount": 157
    },
    {
      "phone": "5521999999999",
      "name": "Maria Santos",
      "messageCount": 142
    }
  ],
  "contactsByStatus": {
    "ativo": 105,
    "inativo": 15,
    "bloqueado": 7
  }
}
```

#### Estatísticas gerais
```bash
GET /api/crm/stats
```

#### Contatos por status
```bash
GET /api/crm/contacts-by-status
```

**Resposta:**
```json
{
  "ativo": 105,
  "inativo": 15,
  "bloqueado": 7
}
```

#### Top contatos (mais ativos)
```bash
GET /api/crm/top-contacts
GET /api/crm/top-contacts?limit=20
```

#### Top tags
```bash
GET /api/crm/top-tags
```

---

## 🧪 Exemplos com cURL

### Buscar contato por telefone
```bash
curl -X GET "http://localhost:3000/api/crm/contacts/5512991504190"
```

### Adicionar tag ao contato
```bash
curl -X POST "http://localhost:3000/api/crm/contacts/5512991504190/tags" \
  -H "Content-Type: application/json" \
  -d '{"tag": "vip"}'
```

### Adicionar nota
```bash
curl -X POST "http://localhost:3000/api/crm/contacts/5512991504190/notes" \
  -H "Content-Type: application/json" \
  -d '{"note": "Cliente interessado em upgrade"}'
```

### Obter histórico de mensagens
```bash
curl -X GET "http://localhost:3000/api/crm/messages/5512991504190?limit=50"
```

### Exportar histórico
```bash
curl -X GET "http://localhost:3000/api/crm/messages/5512991504190/export" \
  -o historico_5512991504190.txt
```

### Dashboard
```bash
curl -X GET "http://localhost:3000/api/crm/dashboard"
```

---

## 📁 Estrutura de Dados

### contacts.json
```json
[
  {
    "id": "1705238400000_abc123",
    "phone": "5512991504190",
    "name": "João Silva",
    "email": "joao@email.com",
    "company": "Empresa XYZ",
    "tags": ["cliente", "vip"],
    "notes": "[2026-04-01 10:00]: Cliente muito satisfeito\n[2026-04-05 14:30]: Solicitou upgrade para plano premium",
    "status": "ativo",
    "lastMessageAt": "2026-04-10T14:30:00.000Z",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-10T14:30:00.000Z",
    "metadata": {
      "origem": "referencia",
      "referenciado_por": "Maria"
    }
  }
]
```

### messages.json
```json
[
  {
    "id": "1705238400000_xyz789",
    "phone": "5512991504190",
    "direction": "incoming",
    "content": "Olá! Gostaria de informações sobre os planos",
    "type": "text",
    "timestamp": "2026-04-01T10:00:00.000Z",
    "status": "read",
    "metadata": {}
  },
  {
    "id": "1705238405000_abc456",
    "phone": "5512991504190",
    "direction": "outgoing",
    "content": "Olá João! Temos 3 planos disponíveis...",
    "type": "text",
    "timestamp": "2026-04-01T10:00:05.000Z",
    "status": "sent",
    "metadata": {}
  }
]
```

---

## ✨ Funcionalidades Principais

### ✅ Contat Manager
- Registrar novos contatos automaticamente
- Buscar contatos por nome/email/telefone
- Atualizar informações de contato
- Adicionar/remover notas
- Bloquear/desbloquear usuários
- Deletar contatos

### ✅ Message Manager
- Registrar mensagens recebidas
- Registrar mensagens enviadas
- Obter histórico completo
- Exportar histórico em formato TXT
- Estatísticas de conversa

### ✅ Tag Manager
- Criar tags personalizadas
- Associar tags a contatos
- Buscar contatos por tag
- Listar tags sugeridas
- Tags mais usadas

### ✅ Analytics
- Dashboard com estatísticas gerais
- Top contatos (mais ativos)
- Distribuição por status
- Tags mais usadas
- Mensagens por dia

---

## 🎯 Casos de Uso

### 1. Atender Melhor Seus Clientes
```bash
# Ver perfil completo do cliente
GET /api/crm/contacts/5512991504190

# Ler histórico de conversa anterior
GET /api/crm/messages/5512991504190

# Adicionar nota para próximo atendimento
POST /api/crm/contacts/5512991504190/notes
```

### 2. Classificar Clientes por Tipo
```bash
# Adicionar tags VIP, Lead, Support
POST /api/crm/contacts/{phone}/tags {"tag": "vip"}

# Buscar todos os VIPs
GET /api/crm/tags/vip/contacts
```

### 3. Gerar Relatórios
```bash
# Dashboard completo
GET /api/crm/dashboard

# Top clientes mais ativos
GET /api/crm/top-contacts

# Exportar conversa para análise
GET /api/crm/messages/{phone}/export
```

### 4. Detectar Spam
```bash
# Bloquear usuário spam
POST /api/crm/contacts/{phone}/block {"reason": "Enviando spam"}

# Ver contatos bloqueados
GET /api/crm/contacts?status=bloqueado
```

---

## 🔧 Próximas Melhorias

Você pode adicionar:
- [ ] Integração com banco de dados real (MongoDB, PostgreSQL)
- [ ] Backup automático dos dados
- [ ] Integração com Google Sheets
- [ ] Envio de relatórios por email
- [ ] Funil de vendas (Lead → Prospect → Cliente)
- [ ] Sistema de lembretes e follow-ups
- [ ] Previsões com IA

---

Seu CRM está pronto! 🚀


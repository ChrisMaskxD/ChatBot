# 🧪 GUIA DE TESTES

Instruções para testar o bot localmente e em produção.

## 🏠 Testes Locais

### 1. Preparar Ambiente

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar com suas credenciais
nano .env
```

### 2. Usar Ferramenta de Túnel

Para testar webhook localmente, use ferramentas que criam um URL público:

#### ngrok (Recomendado)

```bash
# Instalar
choco install ngrok  # Windows
brew install ngrok   # macOS
# ou download em https://ngrok.com

# Executar
ngrok http 3000

# Você receberá:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

#### Localtunnel

```bash
npm install -g localtunnel

# Executar
lt --port 3000

# Você receberá:
# Your URL is: https://brave-wasp-42.loca.lt
```

### 3. Configurar Webhook Temporário

1. Vá ao Meta App Dashboard
2. Selecione WhatsApp > Configuration
3. Em Webhook URL: `https://seu-url-ngrok.ngrok.io/webhook`
4. Em Verify Token: o mesmo de `.env` (WEBHOOK_VERIFY_TOKEN)
5. Clique em "Verify and Save"

### 4. Iniciar Servidor Local

```bash
npm run dev
```

Você deve ver:
```
[Server] ✅ Servidor rodando em porta 3000
```

## 📱 Testes com WhatsApp

### Teste 1: Cumprimento

1. Adicione seu número ao Business Manager
2. Envie a palavra **"oi"** para o número do bot
3. Espere resposta automática

**Esperado:** Bot responde com mensagem amigável

### Teste 2: Catálogo

1. Envie a palavra **"catalogo"** para o número do bot
2. Aguarde resposta

**Esperado:** 
- Mensagem: "Aqui está nosso catálogo! 📄 Confira os produtos disponíveis."
- PDF anexado (ou mensagem de erro se URL inválida)

### Teste 3: IA Geral

1. Envie qualquer outra mensagem, ex: **"Qual é o seu horário?"**
2. Aguarde resposta

**Esperado:** Bot responde com IA personalizada

## 🧫 Testes com cURL

### Simular Webhook de Validação

```bash
curl -X GET http://localhost:3000/webhook \
  -d "hub.mode=subscribe" \
  -d "hub.verify_token=seu_verify_token" \
  -d "hub.challenge=test_challenge"
```

### Simular Recebimento de Mensagem

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "id": "msg123",
            "text": {
              "body": "oi"
            }
          }],
          "contacts": [{
            "profile": {
              "name": "teste"
            },
            "wa_id": "5511999999999"
          }]
        }
      }]
    }]
  }'
```

## 🧪 Testes com Postman

### 1. Importar Coleção

Crie uma nova requisição no Postman:

**GET /webhook**
```
URL: http://localhost:3000/webhook
Params:
  - hub.mode: subscribe
  - hub.verify_token: seu_verify_token
  - hub.challenge: test_challenge
```

**POST /webhook**
```
URL: http://localhost:3000/webhook
Headers:
  - Content-Type: application/json
Body (JSON):
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5511999999999",
          "id": "msg123",
          "text": {
            "body": "Qual é seu horário de funcionamento?"
          }
        }],
        "contacts": [{
          "profile": {
            "name": "Cliente Teste"
          },
          "wa_id": "5511999999999"
        }]
      }
    }]
  }]
}
```

## ✅ Checklist de Testes

### Funcionalidades Principais
- [ ] Endpoint GET / retorna health check
- [ ] Webhook GET valida corretamente
- [ ] Webhook POST processa mensagens
- [ ] Comando "oi" dispara resposta IA
- [ ] Comando "catalogo" envia PDF
- [ ] Outras mensagens disparam IA

### Testes de Erro
- [ ] Token inválido retorna erro 403
- [ ] Webhook inválido retorna erro 404
- [ ] Erro na OpenAI mostra mensagem amigável
- [ ] Erro no WhatsApp loga corretamente

### Testes de Segurança
- [ ] Variáveis de ambiente não aparecem em logs
- [ ] Tokens não são logados
- [ ] Webhook valida token corretamente

### Testes de Performance
- [ ] Responta em menos de 3 segundos
- [ ] Múltiplas mensagens simultâneas funcionam
- [ ] Servidor não trava com muitas requisições

## 📊 Teste de Carga

Use Apache Bench ou similar:

```bash
# Instalar ab (Apache Bench)
# Windows: choco install apache-bench
# macOS: brew install httpd

# Teste de 1000 requisições com concorrência 10
ab -n 1000 -c 10 http://localhost:3000/

# Teste de webhook (JSON)
ab -n 100 -c 5 -T "application/json" \
  -p data.json \
  http://localhost:3000/webhook
```

## 🔍 Debug

### Habilitar Logs Detalhados

Edite `server.js` e adicione:

```javascript
// No início
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Variáveis carregadas:', {
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
  HAS_TOKEN: !!process.env.WHATSAPP_TOKEN,
  HAS_API_KEY: !!process.env.OPENAI_API_KEY,
});

// Em pontos críticos
console.log('Dados recebidos:', JSON.stringify(dados, null, 2));
```

### Usar Node Inspector

```bash
# Iniciar com inspector
node --inspect server.js

# Abrir em Chrome: chrome://inspect
```

## 🐛 Problemas Comuns

### Webhook não valida

**Problema:** "Falha na verificação: token inválido"

**Solução:**
```bash
# Verifique se WEBHOOK_VERIFY_TOKEN está correto
echo "Token em .env:"
grep WEBHOOK_VERIFY_TOKEN .env

# Deve ser igual ao configurado no Meta App Dashboard
```

### OpenAI retorna erro 401

**Problema:** "Erro ao gerar resposta"

**Solução:**
```bash
# Testar key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sua_chave_aqui"

# Deve retornar lista de modelos
```

### WhatsApp não recebe mensagens

**Problema:** Número não recebe resposta

**Solução:**
```bash
# 1. Verificar se número está no Business Manager
# 2. Conferir PHONE_NUMBER_ID
# 3. Verificar logs: npm run dev
# 4. Testar com cURL
```

## 📝 Exemplo de Teste Completo

```javascript
// test.js - Executar com: node test.js
const axios = require('axios');

async function testarAPI() {
  const baseURL = 'http://localhost:3000';

  console.log('1️⃣  Testando health check...');
  try {
    const res = await axios.get(`${baseURL}/`);
    console.log('✅ OK:', res.data);
  } catch (err) {
    console.error('❌ ERRO:', err.message);
  }

  console.log('\n2️⃣  Testando webhook validation...');
  try {
    const res = await axios.get(`${baseURL}/webhook`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': process.env.WEBHOOK_VERIFY_TOKEN,
        'hub.challenge': 'test_challenge',
      },
    });
    console.log('✅ OK: Webhook validado');
  } catch (err) {
    console.error('❌ ERRO:', err.message);
  }

  console.log('\n3️⃣  Testando recebimento de mensagem...');
  try {
    const res = await axios.post(`${baseURL}/webhook`, {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '5511999999999',
              id: 'msg123',
              text: { body: 'oi' },
            }],
            contacts: [{
              profile: { name: 'Teste' },
              wa_id: '5511999999999',
            }],
          },
        }],
      }],
    });
    console.log('✅ OK: Mensagem processada');
  } catch (err) {
    console.error('❌ ERRO:', err.message);
  }
}

testarAPI();
```

Execute com ngrok rodando e servidor local:

```bash
npm run dev
node test.js
```

---

**Todos os testes passando? Pronto para produção! ✨**

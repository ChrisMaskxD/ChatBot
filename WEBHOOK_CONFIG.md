# Como Configurar Webhook no Meta App para WhatsApp

## 📋 O que é um Webhook?

Um webhook é um "gancho" que permite que o Meta WhatsApp API envie mensagens **automaticamente** para seu servidor quando alguém mandar uma mensagem no WhatsApp para seu número de negócio.

**Fluxo:**
```
Cliente envia mensagem → WhatsApp envia para seu Webhook → Seu servidor processa
```

---

## ✅ PRÉ-REQUISITO: Seu servidor precisa ser acessível na internet

### Opção 1: Servidor em Produção (Recomendado)
- Seu servidor já está online (ex: AWS, Heroku, DigitalOcean)
- URL: `https://seu-dominio.com`

### Opção 2: Testar Localmente com ngrok (Desenvolvimento)
- Use ngrok para expor seu localhost na internet
- URL temporária: `https://xxxxxxxx.ngrok.io`

#### Instalar ngrok:
```bash
# Windows (via chocolatey)
choco install ngrok

# Ou baixar em: https://ngrok.com/download
```

#### Iniciar ngrok:
```powershell
# Terminal PowerShell (deixe aberto)
ngrok http 3000

# Você verá algo como:
# Forwarding: https://abc123xyz.ngrok.io -> http://localhost:3000
```

Copie a URL HTTPS gerada (ex: `https://abc123xyz.ngrok.io`)

---

## 🔧 PASSO-A-PASSO: Configurar Webhook no Meta Dashboard

### Passo 1: Acesse o Painel do Meta
1. Vá para: https://developers.facebook.com/apps
2. Selecione sua **App de WhatsApp Chatbot**
3. No menu esquerdo, vá para: **WhatsApp** → **Configuração**

### Passo 2: Encontre a Seção de Webhook
1. Procure por **Configuração de Webhook** ou **Webhook Configuration**
2. Clique em **Editar Webhook** ou **Configure Webhook**

### Passo 3: Adicione sua URL
Na seção **Callback URL**:
- Se em **produção**: `https://seu-dominio.com/webhook`
- Se **testando localmente**: `https://abc123xyz.ngrok.io/webhook`

### Passo 4: Configure o Verify Token
Na seção **Verify Token**:
- Insira o mesmo token do seu `.env`: `test_verify_token_demo`
- **Importante:** Use exatamente o mesmo valor!

### Passo 5: Inscrever em Webhooks
Na seção **Subscribe to Webhook Events**, selecione:
- ✅ **messages**
- ✅ **message_template_status_update**
- ✅ **message_template_quality_update**

### Passo 6: Clique em "Salvar" e "Confirmar"
- Meta tentará validar seu webhook (GET request para confirmar)
- Você deve ver ✅ **Webhook verificado com sucesso**

---

## ✅ VALIDANDO A CONFIGURAÇÃO

### Teste Manual 1: Verificação do Webhook
Meta fará um GET request para:
```
GET https://seu-dominio.com/webhook?hub.mode=subscribe&hub.verify_token=test_verify_token_demo&hub.challenge=abc123
```

Seu servidor deve responder com o `challenge`.

**Seu código já faz isso:**
```javascript
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);  // ✅ Responde com o challenge
  }
});
```

### Teste Manual 2: Envie uma Mensagem Real
1. Abra WhatsApp em seu celular
2. Mande mensagem para seu número de negócio
3. Verifique se chega no `POST /webhook` do seu servidor

**Verifique os logs:**
```bash
npm start
# Você deve ver:
# [Webhook] Recebido pedido de verificação
# [Webhook] Webhook verificado com sucesso
```

---

## 🧪 TESTAR COM CURL (Terminal)

Se quiser testar manualmente sem enviar real mensagem:

```powershell
# Teste 1: Validação GET (como Meta faria)
$token = "test_verify_token_demo"
$url = "https://seu-dominio.com/webhook?hub.mode=subscribe&hub.verify_token=$token&hub.challenge=test123"

Invoke-WebRequest -Uri $url -UseBasicParsing | Select-Object -ExpandProperty Content

# Deve retornar: test123

# Teste 2: Simular POST com mensagem
$body = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            changes = @(
                @{
                    value = @{
                        messages = @(
                            @{
                                from = "5512991504190"
                                id = "msg123"
                                type = "text"
                                text = @{
                                    body = "Olá!"
                                }
                            }
                        )
                    }
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "https://seu-dominio.com/webhook" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

---

## 📝 ARQUIVO .env - Verificação Final

```env
# ✅ Token de acesso (gerado no Meta Dashboard)
WHATSAPP_TOKEN=EAAhpm4BMrOQBRIhvjxGZCUCZA2gZCa82jlgN0CA2GnCZCTBYkX...

# ✅ ID do número de negócio (no painel Meta)
PHONE_NUMBER_ID=1084256431433158

# ✅ DEVE SER O MESMO do Webhook no Dashboard Meta
WEBHOOK_VERIFY_TOKEN=test_verify_token_demo

# ✅ Sua chave OpenAI
OPENAI_API_KEY=sk-proj-...

# ✅ Porta do servidor
PORT=3000
```

---

## 🚀 INICIAR O SERVIDOR

```bash
# Instale dependências (geralmente já feito)
npm install

# Inicie o servidor
npm start

# Você deve ver:
# [Server] Iniciando servidor de automação WhatsApp com IA
# [Server] Phone Number ID: 1084256431433158
# listening on port 3000
```

---

## 📍 SE ESTIVER TESTANDO LOCALMENTE COM NGROK

### Mantendo ngrok rodando:
```powershell
# Terminal 1: ngrok
ngrok http 3000

# Terminal 2: Seu servidor Node
npm start
```

### Usar URL do ngrok no Meta Dashboard:
- Callback URL: `https://abc123xyz.ngrok.io/webhook`
- Verify Token: `test_verify_token_demo`

Cada vez que reiniciar ngrok, você terá uma **nova URL**. Atualize no Dashboard!

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] Servidor rodando em `npm start`
- [ ] URL acessível na internet (ngrok ou servidor real)
- [ ] Callback URL adicionada no Meta Dashboard
- [ ] Verify Token é **exatamente** igual ao `.env`
- [ ] Webhook events `messages` está inscrito
- [ ] Token OAuth `.env` é válido (não expirado)
- [ ] Phone Number ID está verificado no Meta
- [ ] Enviou mensagem de teste e viu no console

---

## 🐛 TROUBLESHOOTING

### ❌ "Webhook não consegue se verificar"
**Causa:** Verify Token não bate
```bash
# Verifique se são IDÊNTICOS:
# .env: WEBHOOK_VERIFY_TOKEN=test_verify_token_demo
# Meta Dashboard: test_verify_token_demo
```

### ❌ "Webhook não recebe mensagens"
**Causas possíveis:**
1. Webhook não foi verificado com sucesso
2. Número de telefone não está verificado
3. URL está errada ou offline
4. Não inscrito em `messages` events

**Solução:**
```bash
# Verifique logs do servidor
npm start

# Teste manualmente se URL é acessível
curl https://seu-url.com/webhook
```

### ❌ "Erro 401 ao responder"
**Causa:** Token OAuth expirado
```bash
# Gere novo token e atualize .env
```

### ❌ "ngrok diz 400 Bad Request"
**Causa:** Pode ser CORS ou headers errados
```bash
# Verifique se servidor está aceitando POST:
# app.use(express.json());  ← deve estar no server.js
```

---

## 📚 Referências Oficiais

- [Configurar Webhook (Meta Docs)](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/set-up-webhooks)
- [Webhook Events (Meta Docs)](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples)
- [ngrok Documentation](https://ngrok.com/docs)


# Corrigindo Erro OAuth do WhatsApp - Token Inválido

## Erro Recebido
```
Invalid OAuth access token - Cannot parse access token
code: 190
```

## Causas Comuns

1. ✗ Token expirado ou inválido
2. ✗ Business Phone Number ID incorreto
3. ✗ Falta Business Account ID
4. ✗ Permissões insuficientes no token

---

## ✅ Passo 1: Obter Credenciais Reais do WhatsApp Cloud API

### 1.1 Acesse o Meta Business Suite
- Vá para: https://business.facebook.com/
- Faça login com sua conta Facebook/Meta

### 1.2 Crie uma App
- Vá para: https://developers.facebook.com/apps
- Clique em "Criar app"
- Tipo: **Business**
- Nome: "WhatsApp Chatbot"

### 1.3 Configure WhatsApp
- Escolha o tipo: "WhatsApp"
- Clique em "Configurar"

### 1.4 Obtenha Business Phone Number ID
- No painel esquerdo, vá para **WhatsApp** > **Primeiros passos**
- Você verá o **Phone Number ID** (normalmente começa com números simples)
- Copie este valor

### 1.5 Gere um Token de Acesso Permanente
**Opção A: Via Meta App Dashboard**
- Vá para **Configurações** > **Tokens de Aplicativo**
- Clique em **Gerar Token**
- Escopo necessário: `whatsapp_business_messaging`
- Este será um token **temporário** (bom por 1 hora)

**Opção B: Token Permanente (Recomendado)**
- Após criar a app, vá a **Configurações** > **Roletoken de Usuário**
- Ou use a API do Graph para gerar um token com escopo `whatsapp_business_messaging`

---

## ✅ Passo 2: Comprovar que o Business Phone Number está Verificado

### 2.1 Verifique o Status
- No painel, vá para **Números de Telefone**
- Procure por seu Business Phone Number
- Deve estar com status **"Verificado"** (verde)

### 2.2 Se Não Estiver Verificado
1. Clique no número
2. Siga as instruções para verificar via SMS
3. Aguarde confirmação (pode levar minutos)

---

## ✅ Passo 3: Testar o Token Antes de Usar

Abra um terminal e execute:

```bash
curl -X POST "https://graph.instagram.com/v18.0/{PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {SEU_TOKEN}" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"recipient_type\": \"individual\",
    \"to\": \"5511999999999\",
    \"type\": \"text\",
    \"text\": {
      \"body\": \"Teste\"
    }
  }"
```

**Substitua:**
- `{PHONE_NUMBER_ID}` - Seu ID do número
- `{SEU_TOKEN}` - Seu token OAuth
- `5511999999999` - Número para teste (seu próprio)

---

## ✅ Passo 4: Atualizar Variáveis de Ambiente

Uma vez que o token funcione, atualize o `.env`:

```env
# Token com formato: AppID|Token (ou apenas o Token)
WHATSAPP_TOKEN=seu_token_aqui_sem_pipe

# Business Phone Number ID (sem hífens)
PHONE_NUMBER_ID=1234567890

# Business Account ID (obtém da API)
WHATSAPP_BUSINESS_ACCOUNT_ID=1234567890

# Webhook Verify Token (pode ser qualquer string)
WEBHOOK_VERIFY_TOKEN=seu_token_verificacao

OPENAI_API_KEY=sk-proj-...
PORT=3000
```

---

## ✅ Passo 5: Corrigir o Código (whatsapp.js)

### Problema Atual
O arquivo `services/whatsapp.js` está usando a URL correta, mas certifique-se:

```javascript
// ✅ CORRETO
const WHATSAPP_API_URL = 'https://graph.instagram.com/v18.0';

// ✅ NÃO USE
// const WHATSAPP_API_URL = 'https://graph.whatsapp.com/v20.0';
```

### Verificar Headers do Token
```javascript
// ✅ CORRETO - Formato do Bearer Token
headers: {
  Authorization: `Bearer ${WHATSAPP_TOKEN}`,  // AQUI!
  'Content-Type': 'application/json',
}
```

---

## 🔧 Checklist de Debug

- [ ] Token começa com `EAA` (token simples) ou `ABCDxyz...` (app-scoped)?
- [ ] Token foi gerado na última hora? (tokens temporários expiram)
- [ ] Phone Number ID tem apenas números?
- [ ] Phone Number está verificado (status verde)?
- [ ] Versão da API é a mesma (v18.0)?
- [ ] Está usando HTTPS, não HTTP?
- [ ] O número de teste tem o código do país (+55 para Brasil)?

---

## 📍 Obter IDs via API

Se precisar obter seu Business Account ID:

```bash
curl "https://graph.instagram.com/me/owned_businesses?fields=id,name&access_token={SEU_TOKEN}"
```

---

## ❌ Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|--------|
| `Invalid OAuth access token` | Token expirado ou malformado | Gere novo token |
| `Phone number not found` | ID incorreto | Verifique no painel Meta |
| `Insufficient permissions` | Token sem escopos | Adicione escopo `whatsapp_business_messaging` |
| `Rate limit exceeded` | Muitas requisições | Implemente delay entre mensagens |

---

## 📚 Referências

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [Token de Acesso Meta](https://developers.facebook.com/docs/facebook-login/access-tokens/)


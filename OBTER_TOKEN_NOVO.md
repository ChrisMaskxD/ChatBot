# Como Obter Um Novo Token OAuth Válido para WhatsApp

## ❌ Problema Atual
```
Request failed with status code 401
Invalid OAuth access token - Cannot parse access token
```

**Causa:** Token expirado ou inválido

---

## ✅ MÉTODO 1: Token Permanente via Meta App Dashboard (RECOMENDADO)

### Passo 1: Acesse o Dashboard
1. Vá para: https://developers.facebook.com/apps
2. Faça login com **sua conta Meta/Facebook**
3. Selecione sua **App do WhatsApp Chatbot**

### Passo 2: Gerar Token do Sistema
1. No menu esquerdo, vá para: **Configurações** → **Básico**
2. Copie o **App ID** (você precisará depois)
3. Vá para: **Configurações** → **Tokens de Aplicativo**
4. Clique em **Gerar Token**
5. Selecione escopo `whatsapp_business_messaging`
6. **Copie o token gerado**

### ✅ Este token é permanente (não expira em 1 hora!)

---

## ✅ MÉTODO 2: Token via Meta Business Suite (MAIS FÁCIL)

### Passo 1: Acesse o Business Suite
1. Vá para: https://business.facebook.com/
2. Faça login
3. No menu inferior, clique em **Configurações**

### Passo 2: Encontre Aplicativos
1. Clique em **Aplicativos** → **Seus aplicativos**
2. Procure sua app de WhatsApp
3. Clique em **Visão Geral**

### Passo 3: Gere Token
1. Na seção **Tokens de Usuário**, clique em **Gerar novo token**
2. Confirme sua senha
3. Copie o token apresentado

---

## ✅ MÉTODO 3: Obter Token via Graph API URL (MAIS RÁPIDO)

Se você já tem um token válido temporário, pode usar:

```
https://graph.instagram.com/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}
```

**Onde obter:**
- `{APP_ID}`: https://developers.facebook.com/apps → Seu App → Configurações → Básico → App ID
- `{APP_SECRET}`: Mesmo local, mas **não compartilhe este com ninguém**
- `{SHORT_LIVED_TOKEN}`: Um token válido de 1 hora

---

## 🔒 VALIDAR NOVO TOKEN ANTES DE USAR

Antes de adicionar ao `.env`, teste:

```powershell
$token = "seu_token_novo_aqui"
$phoneId = "1084256431433158"

# Teste 1: Verificar se token é válido
Write-Host "Testando token..."
$response = Invoke-WebRequest -Uri "https://graph.instagram.com/me?access_token=$token" `
  -UseBasicParsing -ErrorAction SilentlyContinue

if ($response.StatusCode -eq 200) {
    Write-Host "✅ Token é VÁLIDO!"
    $response.Content | ConvertFrom-Json | Format-Table
} else {
    Write-Host "❌ Token INVÁLIDO"
    exit 1
}

# Teste 2: Verificar permissões
Write-Host "`nTestando permissões..."
$perms = Invoke-WebRequest -Uri "https://graph.instagram.com/me/permissions?access_token=$token" `
  -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

if ($perms.data.permission -contains "whatsapp_business_messaging") {
    Write-Host "✅ Permissão whatsapp_business_messaging: PRESENTE"
} else {
    Write-Host "⚠️ Permissão pode estar faltando"
}

# Teste 3: Testar envio real
Write-Host "`nTestando envio de mensagem..."
$body = @{
    messaging_product = "whatsapp"
    recipient_type = "individual"
    to = "5512991504190"  # Seu número de teste
    type = "text"
    text = @{
        body = "Teste de API"
    }
} | ConvertTo-Json

$testResponse = Invoke-WebRequest -Uri "https://graph.instagram.com/v18.0/$phoneId/messages" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body `
  -UseBasicParsing -ErrorAction SilentlyContinue

if ($testResponse.StatusCode -eq 200) {
    Write-Host "✅ Mensagem ENVIADA COM SUCESSO!"
    $testResponse.Content | ConvertFrom-Json | Format-Table
} else {
    Write-Host "❌ Erro ao enviar:"
    Write-Host ($testResponse.Content | ConvertFrom-Json | Format-Table)
}
```

---

## 🔄 ATUALIZAR .ENV COM NOVO TOKEN

Uma vez confirmado que o token funciona:

### Edite o `.env`:
```env
WHATSAPP_TOKEN=seu_novo_token_aqui
PHONE_NUMBER_ID=1084256431433158
WEBHOOK_VERIFY_TOKEN=test_verify_token_demo
OPENAI_API_KEY=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
PORT=3000
```

### Reinicie o servidor:
```bash
npm start
```

---

## 📋 CHECKLIST ANTES DE TESTAR

- [ ] Token começa com `EAA` ou `EAAC`?
- [ ] Token foi gerado nos últimos 60 minutos?
- [ ] Phone Number ID está verificado no Meta?
- [ ] Número de teste tem o formato correto (+55)?
- [ ] App tem permissão `whatsapp_business_messaging`?
- [ ] Servidor está rodando (npm start)?

---

## 🚨 SE AINDA RECEBER ERRO 401

Verifique:

### 1. Token expirou novamente?
```powershell
$token = "seu_token"
Invoke-WebRequest -Uri "https://graph.instagram.com/me?access_token=$token" -UseBasicParsing
```

Se retornar erro → Gere novo token

### 2. Credenciais com caracteres especiais?
- Remova espaços em branco
- Não use aspas dentro do token
- Verify: Copy/Paste sem alterações

### 3. Phone ID incorreto?
```powershell
# Obter todos os números configurados
$token = "seu_token"
Invoke-WebRequest -Uri "https://graph.instagram.com/me/phone_numbers?access_token=$token" `
  -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

Copie o `id` correto do resultado

### 4. Número de teste não verificado?
- Vá para: https://business.facebook.com/
- Busque por **Números de Telefone**
- Verifique se o status é **"Verificado"** (verde)
- Se não, complete o processo de verificação

---

## 📚 Referências Oficiais

- [Meta Developers Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Tokens de Acesso](https://developers.facebook.com/docs/facebook-login/access-tokens/)
- [WhatsApp API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)


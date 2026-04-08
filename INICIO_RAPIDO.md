# ⚡ INÍCIO RÁPIDO

Comece a usar seu bot WhatsApp com IA em 5 minutos!

## 🚀 Passos Essenciais

### 1️⃣ Instalar Dependências (1 min)

```bash
cd c:\Users\Evand\OneDrive\Documentos\chatbot
npm install
```

### 2️⃣ Configurar Credenciais (2 min)

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env (substitua os valores)
```

**Obter credenciais:**

- **WHATSAPP_TOKEN**: Meta App Dashboard > WhatsApp > API Setup
- **PHONE_NUMBER_ID**: Meta App Dashboard > WhatsApp > Phone Numbers
- **WEBHOOK_VERIFY_TOKEN**: Gere um token aleatório seguro
- **OPENAI_API_KEY**: [platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)

### 3️⃣ Testar Localmente (1 min)

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Usar ngrok para criar URL pública
ngrok http 3000
```

Você verá algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### 4️⃣ Configurar Webhook (1 min)

1. Vá ao Meta App Dashboard
2. WhatsApp > Configuration
3. Webhook URL: `https://abc123.ngrok.io/webhook`
4. Verify Token: O valor de `WEBHOOK_VERIFY_TOKEN` do seu `.env`
5. Clique em "Verify and Save"

### 5️⃣ Testar! (0 min)

Envie uma mensagem do seu WhatsApp para o número do bot e aguarde resposta! ✨

## 📁 Estrutura do Projeto

```
chatbot/
├── server.js              # Servidor principal - AQUI COMEÇA!
├── services/
│   ├── whatsapp.js       # API WhatsApp
│   └── ai.js             # OpenAI
├── package.json          # Dependências
└── .env                  # Suas credenciais (não commit!)
```

## 🎯 Como Funciona

```
Usuário envia mensagem WhatsApp
         ↓
Bot recebe no /webhook
         ↓
Verifica tipo da mensagem:
  • "oi" → Responde com IA amigável
  • "catalogo" → Envia PDF
  • Outra → Responde com IA
         ↓
Envia resposta automaticamente
```

## 📝 Exemplos de Uso

### Enviar Mensagem Manual

```javascript
// Adicione no server.js se quiser testar
const { sendMessage } = require('./services/whatsapp');

// Adicione na rota GET /
app.get('/teste', async (req, res) => {
  await sendMessage('5511999999999', 'Teste de mensagem!');
  res.send('Enviado!');
});

// Acesse: http://localhost:3000/teste
```

### Usar IA Diferente

Edite `services/ai.js` e customize o `system` content:

```javascript
// Mude isso:
role: 'system',
content: 'Você é um assistente virtual amigável...',

// Para isso:
role: 'system',
content: 'Você é um vendedor de eletrônicos profissional...',
```

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Webhook não valida" | Verifique `WEBHOOK_VERIFY_TOKEN` |
| "OpenAI API error" | Confira `OPENAI_API_KEY` e créditos |
| "Mensagem não enviada" | Verifique `PHONE_NUMBER_ID` e número do usuário |
| "ngrok desconectou" | Execute `ngrok http 3000` novamente |

## 📚 Próximos Passos

1. **Ler README.md** - Documentação completa
2. **Explorar EXEMPLOS.js** - Mais casos de uso
3. **Ver AVANCADO.md** - Recursos extras (banco de dados, etc)
4. **Estudar TESTES.md** - Como testar tudo
5. **Seguir DEPLOY.md** - Colocar em produção

## 🎓 Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `server.js` | Servidor principal |
| `services/whatsapp.js` | Enviar mensagens/PDFs |
| `services/ai.js` | Respostas com OpenAI |
| `README.md` | Documentação completa |
| `TESTES.md` | Como testar |
| `DEPLOY.md` | Colocar em produção |
| `AVANCADO.md` | Recursos extras |

## 🎉 Está Pronto!

Seu bot está 100% funcional e pronto para:
- ✅ Receber mensagens WhatsApp
- ✅ Responder com IA (OpenAI)
- ✅ Enviar PDFs
- ✅ Processar diferentes tipos de mensagens

## 💡 Dicas

- Use `npm run dev` para desenvolvimento (reinicia automaticamente)
- Mantenha o ngrok rodando enquanto testa
- Verifique os logs no console para debugar
- Teste com mensagens diferentes para ver como a IA responde

## 🚀 Para Produção

Quando tiver pronto:
1. Leia **DEPLOY.md** completamente
2. Escolha seu host (Heroku, Railway, AWS, etc)
3. Configure variáveis de ambiente
4. Faça deploy
5. Configure webhook com URL de produção

---

**Sucesso! Seu bot WhatsApp inteligente está rodando 🎊**

Dúvidas? Volte para `README.md` ou `TESTES.md`

# WhatsApp AI Automation Bot

Automação completa de WhatsApp com respostas inteligentes via OpenAI e envio de PDFs.

## 🚀 Requisitos

- Node.js v16+
- npm ou yarn
- Conta Meta (WhatsApp Business)
- API Key do OpenAI
- Servidor com IP público para webhook

## 📋 Pré-requisitos de Configuração

### 1. WhatsApp Business API

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um projeto
3. Configure a aplicação do WhatsApp
4. Obtenha:
   - `WHATSAPP_TOKEN` (Permanent Access Token)
   - `PHONE_NUMBER_ID` (ID do número de telefone)
   - `WEBHOOK_VERIFY_TOKEN` (Token personalizado para validação)

### 2. OpenAI API

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma chave de API
3. Obtenha a `OPENAI_API_KEY`

## 📦 Instalação

```bash
# Clone ou copie os arquivos
cd chatbot

# Instale as dependências
npm install

# Copie o arquivo de variáveis de ambiente
cp .env.example .env

# Edite o arquivo .env com suas credenciais
nano .env
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas credenciais:

```env
# WhatsApp API
WHATSAPP_TOKEN=seu_token_aqui
PHONE_NUMBER_ID=seu_phone_number_id_aqui
WEBHOOK_VERIFY_TOKEN=seu_verify_token_aqui
PORT=3000

# OpenAI API
OPENAI_API_KEY=sua_api_key_aqui
```

## 🎯 Configurar o Webhook

1. No Meta App Dashboard:
   - Vá para WhatsApp > Configuration
   - Em "Webhook URL", adicione: `https://seu-dominio.com/webhook`
   - Em "Verify Token", adicione o valor de `WEBHOOK_VERIFY_TOKEN`
   - Selecione os eventos: `messages`, `message_status`

2. Teste o webhook clicando em "Test" (deve retornar 200)

## 💻 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor iniciará em `http://localhost:3000`

## 🧪 Testando

1. Salve seu número de WhatsApp no Business Manager
2. Envie uma mensagem para o número configurado
3. Aguarde a resposta automática

### Exemplos de Interação

- **"oi"** → Bot responde com um cumprimento automático
- **"catalogo"** → Bot envia o PDF do catálogo
- **Qualquer outra mensagem** → Bot responde com IA

## 📁 Estrutura do Projeto

```
chatbot/
├── server.js              # Servidor principal
├── services/
│   ├── whatsapp.js       # Funções da API WhatsApp
│   └── ai.js             # Integração com OpenAI
├── package.json          # Dependências
├── .env.example          # Variáveis de ambiente exemplo
├── .gitignore            # Arquivos ignorados pelo Git
└── README.md             # Este arquivo
```

## 🔧 Endpoints

### GET `/`
Health check do servidor

**Resposta:**
```json
{
  "status": "online",
  "service": "WhatsApp AI Automation",
  "version": "1.0.0",
  "timestamp": "2024-04-08T10:30:00.000Z"
}
```

### GET `/webhook`
Validação do webhook pelo WhatsApp

### POST `/webhook`
Recebe mensagens do WhatsApp

## 📤 Enviar PDF

Para enviar um PDF, hospede o arquivo em um servidor público e use a URL:

```javascript
await sendDocument(
  '55119999999', 
  'https://seu-servidor.com/arquivo.pdf',
  'Nome_Arquivo.pdf'
);
```

## 🚨 Troubleshooting

### Webhook não valida
- Verifique se `WEBHOOK_VERIFY_TOKEN` está correto
- Certifique-se de que o servidor está acessível publicamente

### Mensagens não enviadas
- Verifique `WHATSAPP_TOKEN` e `PHONE_NUMBER_ID`
- Confirme se o número está registrado no Business Manager
- Verifique os logs do console

### Respostas de IA não funcionam
- Valide a `OPENAI_API_KEY`
- Verifique se sua conta OpenAI tem créditos
- Confira os logs de erro no console

## 🔐 Segurança

- Nunca commite o arquivo `.env` (já está em `.gitignore`)
- Use tokens permanentes apenas em ambientes seguros
- Valide sempre as mensagens recebidas
- Configure rate limiting em produção

## 📝 Logs

O servidor gera logs detalhados no console com prefixos:
- `[Server]` - Informações do servidor
- `[Webhook]` - Validação de webhook
- `[Processamento]` - Processamento de mensagens
- `[WhatsApp]` - Chamadas da API WhatsApp
- `[AI]` - Processamento de IA
- `[Error]` - Erros

## 🚀 Deploy

### Heroku
```bash
git push heroku main
```

### Railway
```bash
railway up
```

### AWS/Google Cloud
Configure variáveis de ambiente e deploy a partir do Git

## 📞 Suporte

Para informações sobre a API do WhatsApp:
- [Documentação Oficial WhatsApp](https://developers.facebook.com/docs/whatsapp)

Para informações sobre OpenAI:
- [Documentação OpenAI](https://platform.openai.com/docs)

## 📄 Licença

MIT

---

**Desenvolvido para automação inteligente de WhatsApp com IA** ✨

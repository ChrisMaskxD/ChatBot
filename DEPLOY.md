# 🚀 GUIA DE DEPLOY

Instruções completas para colocar o bot em produção.

## 📍 Pré-requisitos

- Servidor com IP público (Heroku, Railway, AWS, Google Cloud, DigitalOcean, etc.)
- Domínio ou IP estático
- Git configurado
- Node.js v16+ instalado no servidor

## 🔑 Configurações Necessárias

### 1. Variáveis de Ambiente em Produção

Crie um arquivo `.env` seguro no servidor com:

```env
WHATSAPP_TOKEN=seu_token_permanente_aqui
PHONE_NUMBER_ID=seu_phone_number_id
WEBHOOK_VERIFY_TOKEN=gere_um_token_aleatorio_seguro
OPENAI_API_KEY=sua_chave_openai_aqui
PORT=3000
NODE_ENV=production
```

### 2. SSL/HTTPS

O WhatsApp requer HTTPS. Opções:

**A) Usar Nginx como Proxy Reverso**
```nginx
server {
    listen 443 ssl;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**B) Usar Heroku (HTTPS incluído)**
```bash
heroku create seu-app-name
heroku config:set WHATSAPP_TOKEN=...
heroku config:set PHONE_NUMBER_ID=...
git push heroku main
```

**C) Usar Railway**
```bash
railway link
railway up
```

## 🐳 Deploy com Docker

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  bot:
    build: .
    ports:
      - "3000:3000"
    environment:
      WHATSAPP_TOKEN: ${WHATSAPP_TOKEN}
      PHONE_NUMBER_ID: ${PHONE_NUMBER_ID}
      WEBHOOK_VERIFY_TOKEN: ${WEBHOOK_VERIFY_TOKEN}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      NODE_ENV: production
    restart: always
```

**Executar:**
```bash
docker-compose up -d
```

## 📦 Deploy com PM2

PM2 mantém o servidor rodando automaticamente.

### Instalação
```bash
npm install -g pm2
```

### Arquivo ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'whatsapp-bot',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### Comandos

```bash
# Iniciar
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs whatsapp-bot

# Reiniciar
pm2 restart whatsapp-bot

# Parar
pm2 stop whatsapp-bot

# Deletar
pm2 delete whatsapp-bot

# Iniciar na reinicialização do servidor
pm2 startup
pm2 save
```

## ☁️ Deploy em Cloud Providers

### Heroku

```bash
# Login
heroku login

# Criar app
heroku create seu-app-name

# Adicionar variáveis
heroku config:set WHATSAPP_TOKEN=seu_token
heroku config:set PHONE_NUMBER_ID=seu_id
heroku config:set WEBHOOK_VERIFY_TOKEN=seu_token
heroku config:set OPENAI_API_KEY=sua_chave

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

### Railway

```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Iniciar projeto
railway init

# Adicionar variáveis
railway variables

# Deploy
railway up
```

### AWS EC2

```bash
# 1. SSH no servidor
ssh -i sua-chave.pem ubuntu@seu-ip

# 2. Instalar dependências
sudo apt-get update
sudo apt-get install -y nodejs npm git

# 3. Clonar repositório
git clone seu-repositorio
cd seu-repositorio

# 4. Instalar dependências da app
npm install --production

# 5. Configurar variáveis de ambiente
nano .env

# 6. Instalar PM2
npm install -g pm2

# 7. Iniciar com PM2
pm2 start server.js --name "whatsapp-bot"
pm2 startup
pm2 save

# 8. Configurar Nginx
sudo apt-get install -y nginx
# ... (ver configuração acima)

# 9. SSL com Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d seu-dominio.com
```

### Google Cloud Run

```bash
# Criar Dockerfile (já incluído)

# Build e deploy
gcloud run deploy whatsapp-bot \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars WHATSAPP_TOKEN=seu_token,PHONE_NUMBER_ID=seu_id,WEBHOOK_VERIFY_TOKEN=seu_token,OPENAI_API_KEY=sua_chave
```

## 🔐 Segurança em Produção

### 1. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 req por window
});

app.use('/webhook', limiter);
```

### 2. Validar Assinatura do Webhook

```javascript
const crypto = require('crypto');

function validateWebhookSignature(req) {
  const signature = req.get('X-Hub-Signature-256');
  const body = JSON.stringify(req.body);
  
  const hash = crypto
    .createHmac('sha256', process.env.WHATSAPP_TOKEN)
    .update(body)
    .digest('hex');

  return `sha256=${hash}` === signature;
}
```

### 3. Variáveis de Ambiente Seguradas

- Nunca commite `.env`
- Use secrets do seu cloud provider
- Rotacione tokens periodicamente
- Use tokens com tempo de expiração quando possível

### 4. Logs e Monitoramento

```javascript
// Usar serviço como Logtail, Datadog, etc.
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### 5. Backup e Recovery

- Fazer backup do código regularmente
- Manter histórico de logs
- Ter plano de recuperação de desastres

## 📊 Monitoramento

### Health Check

```bash
curl https://seu-dominio.com/
```

Deve retornar:
```json
{
  "status": "online",
  "service": "WhatsApp AI Automation",
  "version": "1.0.0",
  "timestamp": "2024-04-08T10:30:00.000Z"
}
```

### Uptime Monitoring

Use serviços como:
- UptimeRobot
- Pingdom
- New Relic
- Datadog

## 🐛 Solução de Problemas em Produção

### Verificar Logs

```bash
# PM2
pm2 logs whatsapp-bot

# Heroku
heroku logs --tail

# Docker
docker logs container_id

# Nginx
tail -f /var/log/nginx/error.log
```

### Reiniciar Serviço

```bash
# PM2
pm2 restart whatsapp-bot

# Docker
docker restart container_id

# Systemd
sudo systemctl restart whatsapp-bot
```

### Verificar Portas

```bash
# Ver o que está usando porta 3000
lsof -i :3000

# Matar processo
kill -9 PID
```

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS funcionando
- [ ] Webhook validado no Meta App Dashboard  
- [ ] Número de WhatsApp testado
- [ ] PM2/Docker em execução
- [ ] Logs configurados
- [ ] Monitoramento ativo
- [ ] Backup agendado
- [ ] Rate limiting ativo
- [ ] Validação de segurança implementada

---

**Pronto para produção! 🎉**

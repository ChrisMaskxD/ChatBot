# 📦 ESTRUTURA COMPLETA DO PROJETO

Visualização detalhada de todos os arquivos e sua organização.

## 🗂️ Árvore de Diretórios

```
chatbot/
│
├── 📄 server.js                    # ⭐ ARQUIVO PRINCIPAL
│   └── Gerencia webhooks e fluxo de processamento
│
├── 📁 services/
│   ├── whatsapp.js                 # API WhatsApp Cloud
│   │   ├── sendMessage()           # Enviar texto
│   │   ├── sendDocument()          # Enviar PDF
│   │   └── markAsRead()            # Marcar como lido
│   │
│   └── ai.js                       # Integração OpenAI
│       └── gerarResposta()         # Gerar resposta com IA
│
├── 📚 DOCUMENTAÇÃO/
│   ├── 📖 README.md                # Guia completo
│   ├── ⚡ INICIO_RAPIDO.md         # Começar em 5 min
│   ├── 🧪 TESTES.md               # Como testar
│   ├── 🚀 DEPLOY.md               # Deploy em produção
│   ├── ⚙️  AVANCADO.md            # Recursos extras
│   └── 💡 EXEMPLOS.js             # Exemplos de código
│
├── ⚙️  CONFIGURAÇÃO/
│   ├── package.json                # Dependências (npm)
│   ├── .env.example                # Variáveis de ambiente (modelo)
│   ├── .gitignore                  # Arquivos ignorados pelo Git
│   └── .env                        # ⚠️ NÃO COMMITAR (local)
│
└── 📋 ESTRUTURA_PROJETO.md         # Este arquivo
```

## 🔍 Descrição dos Arquivos

### server.js (210 linhas)
**O coração do seu bot!**

- Configura Express e middleware
- Gerencia webhooks GET e POST
- Processa mensagens recebidas
- Orquestra chamadas para serviços
- Implementa lógica de roteamento

**Principais funções:**
```javascript
app.get('/')                    // Health check
app.get('/webhook')            // Validação webhook WhatsApp
app.post('/webhook')           // Receber mensagens
processarMensagem()            // Lógica principal
```

### services/whatsapp.js (110 linhas)
**Integração com WhatsApp Cloud API da Meta**

- Envia mensagens de texto
- Envia documentos PDF
- Marca mensagens como lidas
- Tratamento de erros robusto

**Funções exportadas:**
```javascript
sendMessage(numero, texto)
sendDocument(numero, link, nome)
markAsRead(messageId)
```

### services/ai.js (40 linhas)
**Integração com OpenAI GPT**

- Gera respostas inteligentes
- Customizável com prompts
- Tratamento de erros
- Configurável (modelo, temperatura, tokens)

**Funções exportadas:**
```javascript
gerarResposta(mensagem)        // Única função
```

### package.json
**Gerenciador de dependências**

```json
Dependências:
  ✓ express ^4.18.2            // Framework web
  ✓ axios ^1.4.0               // HTTP client
  ✓ dotenv ^16.3.1             // Variáveis de ambiente
  ✓ openai ^4.3.0              // SDK OpenAI

Dev:
  ✓ nodemon ^3.0.1             // Dev server com auto-reload
```

### .env.example
**Template seguro das variáveis**

```
WHATSAPP_TOKEN=xxx
PHONE_NUMBER_ID=xxx
WEBHOOK_VERIFY_TOKEN=xxx
OPENAI_API_KEY=xxx
PORT=3000
```

**⚠️ Nunca commite .env com valores reais!**

### .gitignore
**Arquivos não rastreados pelo Git**

```
node_modules/          # Dependências (npm install cria)
.env                   # Credenciais locais
.env.local            # Ambiente local
*.log                 # Logs
.DS_Store             # macOS
.vscode/              # Configurações VSCode
```

### DOCUMENTAÇÃO

#### README.md (250+ linhas)
> Documentação completa do projeto
- Requisitos
- Instalação passo a passo
- Configuração da API WhatsApp
- Endpoints disponíveis
- Troubleshooting
- Deploy

#### INICIO_RAPIDO.md (100+ linhas)
> Para começar em 5 minutos
- 5 passos essenciais
- Como testar localmente
- Estrutura rápida
- Solução de problemas comuns

#### TESTES.md (300+ linhas)
> Guia completo de testes
- Testes locais com ngrok
- Testes com WhatsApp real
- Exemplos com cURL
- Postman collection
- Teste de carga
- Debugging

#### DEPLOY.md (350+ linhas)
> Colocar em produção
- Deploy em Heroku
- Deploy com Docker
- PM2 para auto-restart
- Railway, AWS, Google Cloud
- SSL/HTTPS com Nginx
- Segurança
- Monitoramento

#### AVANCADO.md (400+ linhas)
> Recursos e extensões
- Sistema de prompts customizados
- Multi-departamento
- Banco de dados (MongoDB, SQLite)
- Geração de PDFs dinâmicos
- Analytics
- Multi-idioma
- Transferência para agentes humanos
- E muito mais...

#### EXEMPLOS.js (200+ linhas)
> Exemplos de código prontos
- Enviar mensagem
- Enviar PDF
- Usar IA
- Fluxos completos
- Catálogos com dados
- Personalizações

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│    USUÁRIO ENVIA MENSAGEM NO WHATSAPP          │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  WHATSAPP API → Webhook POST /webhook           │
│  (server.js recebe)                             │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Validação e Parsing da Mensagem               │
│  (extrai: numero, texto, id)                    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  processarMensagem() Decide:                    │
│  ├─ "oi" → IA Generica                         │
│  ├─ "catalogo" → Enviar PDF                    │
│  └─ Outra → IA Generica                        │
└─────────────────────────────────────────────────┘
                       ↓
        ┌──────────────┴──────────────┐
        ↓                             ↓
┌────────────────┐          ┌─────────────────┐
│ Chamar OpenAI  │          │ Enviar Documento│
│ (services/ai)  │          │ (services/...)  │
└────────────────┘          └─────────────────┘
        ↓                             ↓
┌─────────────────────────────────────────────────┐
│  gerarResposta() / sendDocument()              │
│  Processa com APIs externas                    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  sendMessage() envia resposta via WhatsApp     │
│  (services/whatsapp.js)                        │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│    USUÁRIO RECEBE RESPOSTA NO WHATSAPP         │
└─────────────────────────────────────────────────┘
```

## 🎯 Dependências e Suas Funções

| Pacote | Versão | Função |
|--------|--------|--------|
| express | 4.18.2 | Framework HTTP/REST |
| axios | 1.4.0 | Cliente HTTP para APIs |
| dotenv | 16.3.1 | Carregar .env em variáveis |
| openai | 4.3.0 | SDK oficial OpenAI |
| nodemon | 3.0.1 | Auto-reload ao desenvolver |

## 📊 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| Linhas de código | ~600+ |
| Documentação | ~1500+ linhas |
| Arquivos principais | 5 |
| Serviços | 2 |
| Endpoints | 3 |
| Funcionalidades | 5+ |

## 🚀 Seu Fluxo de Trabalho Recomendado

```
1. COMEÇAR
   ↓ [Ler INICIO_RAPIDO.md]
   
2. ENTENDER
   ↓ [Ler README.md]
   
3. TESTAR
   ↓ [Seguir TESTES.md]
   
4. DESENVOLVER
   ↓ [Customizar conforme necessário]
   ↓ [Consultar EXEMPLOS.js e AVANCADO.md]
   
5. PRODUÇÃO
   ↓ [Seguir DEPLOY.md]
   ↓ [Monitorar e manter]
```

## 🔐 Checklist de Segurança

- [ ] `.env` não commitado (verificar .gitignore)
- [ ] Tokens podem ser rotacionados facilmente
- [ ] WEBHOOK_VERIFY_TOKEN é forte e aleatório
- [ ] Não há credenciais em logs
- [ ] Mensagens sensíveis não são armazenadas
- [ ] Rate limiting está implementado (DEPLOY.md)
- [ ] HTTPS/SSL configurado em produção

## 🎓 Aprendizado Progressivo

### Nível 1: Iniciante
- Seguir INICIO_RAPIDO.md
- Fazer funcionar localmente
- Entender fluxo básico

### Nível 2: Intermediário
- Ler README.md completo
- Explorar EXEMPLOS.js
- Testar com TESTES.md
- Customizar respostas

### Nível 3: Avançado
- Implementar AVANCADO.md
- Adicionar banco de dados
- Multi-departamento
- Analytics
- Deploy em produção (DEPLOY.md)

## 📞 Suporte e Recursos

- **Documentação Oficial WhatsApp**: https://developers.facebook.com/docs/whatsapp
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Express.js**: https://expressjs.com
- **Axios**: https://axios-http.com

## 🎉 Resumo

Você tem um bot WhatsApp completo com:

✅ Backend Node.js com Express
✅ Webhook para receber mensagens
✅ Respostas automáticas com IA (OpenAI)
✅ Envio de PDFs
✅ Lógica condicional (oi, catálogo, outras)
✅ Documentação completa
✅ Guias de teste e deploy
✅ Código limpo e bem organizado
✅ Pronto para produção

**Parabéns! Seu projeto está estruturado profissionalmente! 🚀**

---

Última atualização: 8 de abril de 2026

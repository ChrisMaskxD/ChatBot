# 👋 BEM-VINDO AO SEU BOT WHATSAPP COM IA!

## 🎯 O QUE FOI CRIADO

Um projeto Node.js completo e profissional para automação de WhatsApp com inteligência artificial e envio de PDFs. **Tudo está pronto para começar!**

## 📍 ONDE COMEÇAR?

### ⚡ Se você quer começar AGORA (5 minutos)
👉 **Leia:** [INICIO_RAPIDO.md](INICIO_RAPIDO.md)

### 📖 Se você quer entender TUDO
👉 **Leia:** [README.md](README.md)

### 🧪 Se você quer TESTAR
👉 **Leia:** [TESTES.md](TESTES.md)

### 💾 Se você quer VER EXEMPLOS
👉 **Leia:** [EXEMPLOS.js](EXEMPLOS.js)

### 🚀 Se você quer DEPLOY em produção
👉 **Leia:** [DEPLOY.md](DEPLOY.md)

### ⚙️ Se você quer CUSTOMIZAR e EXPANDIR
👉 **Leia:** [AVANCADO.md](AVANCADO.md)

### 🗂️ Se você quer ENTENDER A ESTRUTURA
👉 **Leia:** [ESTRUTURA_PROJETO.md](ESTRUTURA_PROJETO.md)

---

## 📁 Arquivos Principais

```
✅ server.js              → Servidor Node.js (inicie daqui)
✅ services/whatsapp.js   → Integração com WhatsApp
✅ services/ai.js         → Integração com OpenAI
✅ package.json           → Dependências npm
✅ .env.example           → Template das variáveis
```

## 🚀 Primeiros Passos

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure suas credenciais
```bash
cp .env.example .env
# Abra .env e preencha com suas credenciais
```

### 3. Inicie o servidor
```bash
npm run dev
```

### 4. Configure o webhook (veja INICIO_RAPIDO.md)

### 5. Teste enviando uma mensagem!

---

## 🎯 Funcionalidades Implementadas

✅ **Webhook WhatsApp** - Recebe mensagens em tempo real
✅ **Respostas com IA** - OpenAI integrado
✅ **Envio de Texto** - Mensagens automáticas
✅ **Envio de PDF** - Catálogos e documentos
✅ **Lógica Condicional** - "oi", "catalogo", ou IA
✅ **Logs Detalhados** - Debug completo no console
✅ **Código Profissional** - Pronto para produção

---

## 📊 Estatísticas do Projeto

| Item | Valor |
|------|-------|
| **Arquivos de Código** | 5 |
| **Linhas de Código** | 600+ |
| **Documentação** | 1500+ linhas |
| **Exemplos** | 7+ |
| **Funcionalidades** | 5+ |

---

## 🤔 ESCOLHA SUA JORNADA

### 🏃 Rápido (5 min)
1. `npm install`
2. Editar `.env`
3. `npm run dev`
4. Ver INICIO_RAPIDO.md

### 🚶 Normal (20 min)
1. Fazer tudo acima
2. Ler README.md
3. Seguir TESTES.md
4. Testar com WhatsApp real

### 🧑‍💻 Completo (1-2 horas)
1. Fazer tudo acima
2. Explorar EXEMPLOS.js
3. Ler AVANCADO.md
4. Customizar conforme necessário
5. Estudar DEPLOY.md

### 🚀 Produção
1. Fazer tudo acima
2. Seguir DEPLOY.md integralmente
3. Configurar monitoramento
4. Deploy e testar em produção

---

## ⚠️ IMPORTANTE

- **Credenciais**: Preencha o arquivo `.env` com suas chaves
- **WhatsApp**: Você precisa ter um Business Account com API habilitada
- **OpenAI**: Você precisa ter uma chave de API com créditos
- **Webhook**: Use ngrok ou similar para testar localmente
- **.env**: Nunca commite este arquivo com valores reais!

---

## 💡 DICAS

- Use `npm run dev` para desenvolvimento com auto-reload
- Mantenha os logs do console abertos para debugar
- Teste tudo localmente antes de deploy
- Leia os comentários no código para entender o que cada parte faz
- Customize os prompts do OpenAI conforme sua necessidade

---

## 🆘 PROBLEMAS?

### Webhook não valida?
→ Verifique se `WEBHOOK_VERIFY_TOKEN` está correto em `.env` e no Meta App Dashboard

### OpenAI não funciona?
→ Confira se `OPENAI_API_KEY` está correto e se a conta tem créditos

### WhatsApp não recebe mensagens?
→ Verifique `PHONE_NUMBER_ID` e se o número está registrado

### Precisa de mais ajuda?
→ Veja a seção de troubleshooting em `README.md` ou `TESTES.md`

---

## 📚 DOCUMENTAÇÃO COMPLETA

| Arquivo | Quando Ler |
|---------|-----------|
| **INICIO_RAPIDO.md** | Para começar AGORA |
| **README.md** | Para entender tudo |
| **TESTES.md** | Antes de testar |
| **DEPLOY.md** | Antes de colocar em produção |
| **AVANCADO.md** | Para customizações |
| **EXEMPLOS.js** | Para ver código |
| **ESTRUTURA_PROJETO.md** | Para entender organização |

---

## 🎉 PRÓXIMO PASSO?

**👉 [Abra INICIO_RAPIDO.md agora!](INICIO_RAPIDO.md)**

Ele vai te guiar em 5 passos simples para ter seu bot funcionando!

---

**Seu bot WhatsApp inteligente está pronto para decolar! 🚀**

Desenvolvido com ❤️ para automação profissional.

# 🖥️ DASHBOARD WEB - GUIA DE USO

Interface web completa para gerenciar o bot WhatsApp de forma intuitiva.

## 🎯 Funcionalidades

### 1. Dashboard (📊)
- **Estatísticas em tempo real**
  - Mensagens recebidas
  - Mensagens enviadas
  - Tempo médio de resposta
  - Total de erros

- **Status do Servidor**
  - Servidor: Rodando/Erro
  - Webhook: Validado/Erro
  - OpenAI: Conectado/Erro
  - WhatsApp: Conectado/Erro

- **Gráficos** (para futuras integrações)
  - Atividade do dia
  - Tipos de mensagem

### 2. Enviar Mensagem (✉️)
Envie mensagens manualmente para qualquer número de WhatsApp.

**Tipos de Mensagem:**
- **Texto Simples**: Mensagem comum que você digita
- **Resposta com IA**: A IA gera uma resposta com base no texto
- **Documento (PDF)**: Envia um PDF hospedado online

**Como usar:**
1. Selecione "Enviar Mensagem" no menu
2. Preencha o número (formato: 55119999999)
3. Escolha o tipo de mensagem
4. Preencha o conteúdo
5. Clique em "Enviar Mensagem"

### 3. Histórico (📋)
Veja todas as mensagens recebidas e enviadas.

**Funcionalidades:**
- Buscar por número
- Filtrar por tipo (recebidas/enviadas)
- Ver timestamp de cada mensagem
- Status de entrega

### 4. Logs (🔍)
Visualize todos os eventos do servidor em tempo real.

**Cores dos logs:**
- 🔵 **[INFO]** - Informações gerais
- 🟡 **[WARN]** - Avisos
- 🔴 **[ERROR]** - Erros
- 🟢 **[SUCCESS]** - Operações bem-sucedidas

**Ações:**
- Limpar logs
- Auto scroll (segue automaticamente)
- Scroll manual

### 5. Configurações (⚙️)

#### Configurações da IA
- **Modelo**: Escolha entre GPT-3.5 Turbo ou GPT-4
- **Temperatura** (0-2): Controla criatividade da IA
  - 0 = Mais determinístico
  - 0.7 = Balanceado (padrão)
  - 2 = Mais criativo
- **Tokens Máximos**: Limite de resposta (50-2000)
- **Prompt Personalizado**: Customize como a IA deve se comportar

#### Informações do Servidor
- Versão do bot
- Versão do Node.js
- Uptime do servidor
- Uso de memória

## 🚀 COMO ACESSAR

### Local
```bash
npm run dev
```

Acesse: **http://localhost:3000**

### Produção
```bash
npm start
```

Acesse: **https://seu-dominio.com**

## 📱 RESPONSIVIDADE

O dashboard é totalmente responsivo:
- ✅ Desktop (1920x1080 ou maior)
- ✅ Tablet (768x1024)
- ✅ Mobile (320x480+)

## 🔌 API ENDPOINTS

Todos os endpoints são protecionados e seguem RESTful:

### Estatísticas
```
GET /api/stats
```

Response:
```json
{
  "messagesReceived": 42,
  "messagesSent": 35,
  "errors": 2,
  "avgTime": 1250
}
```

### Health Check
```
GET /api/health
```

### Histórico
```
GET /api/history
```

### Logs
```
GET /api/logs
```

### Enviar Mensagem
```
POST /api/send-message
Body: {
  "phone": "5511999999999",
  "type": "text|ai|document",
  "text": "sua mensagem"
}
```

### Enviar Documento
```
POST /api/send-document
Body: {
  "phone": "5511999999999",
  "docUrl": "https://...",
  "docName": "arquivo.pdf"
}
```

### Configuração
```
GET /api/config
POST /api/config
Body: {
  "aiModel": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 500,
  "customPrompt": "..."
}
```

## 🎨 TEMAS E CORES

O dashboard usa um esquema de cores moderno:

| Elemento | Cor | Hex |
|----------|-----|-----|
| Primária | Verde | #10a37f |
| Secundária | Azul Escuro | #2a3f5f |
| Sucesso | Verde | #27ae60 |
| Erro | Vermelho | #e74c3c |
| Aviso | Laranja | #f39c12 |
| Info | Azul | #3498db |

## 💡 DICAS DE USO

1. **Atualizar manualmente**: Clique no botão 🔄 no canto superior direito
2. **Auto refresh**: Dashboard atualiza a cada 30 segundos
3. **Buscar rápido**: Use o campo de busca no topo
4. **Exportar dados**: Copie do histórico conforme necessário
5. **Monitorar erros**: Acompanhe a aba de Logs para troubleshooting

## ⌨️ ATALHOS DE TECLADO

| Tecla | Ação |
|-------|------|
| Esc | Fechar modal |
| F5 | Atualizar página |
| Ctrl+F | Buscar na página |

## 🔐 SEGURANÇA

- ✅ Sem armazenamento de dados sensíveis no cliente
- ✅ Padrão CORS para múltiplos domínios
- ✅ Validação de entrada em todos os formulários
- ✅ Proteção contra XSS
- ✅ Tokens não são expostos no frontend

## 📊 ESTRUTURA DE ARQUIVOS

```
public/
├── index.html          # Estrutura HTML
├── style.css           # Estilos (2000+ linhas)
├── app.js             # Lógica JavaScript (600+ linhas)
└── README.md          # Este arquivo
```

## 🐛 TROUBLESHOOTING

### Dashboard não carrega
- Verifique se o servidor está rodando: `npm run dev`
- Verifique a porta 3000: `lsof -i :3000` (Mac/Linux) ou `netstat -ano | findstr :3000` (Windows)
- Limpe o cache do navegador (Ctrl+Shift+Del)

### API retorna erro 500
- Verifique os logs: aba "Logs"
- Verifique variáveis de ambiente: arquivo `.env`
- Reinicie o servidor

### Mensagens não aparecem no histórico
- Recarregue a página
- Clique em "Atualizar" 🔄
- Verifique se há conexão com o servidor

### Configurações não salvam
- Verifique se há erros no console (F12)
- Tente novamente depois de 5 segundos
- Reinicie o servidor e o dashboard

## 📈 PRÓXIMAS MELHORIAS

- [ ] Integração com gráficos (Chart.js)
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] WebSocket para atualizações em tempo real
- [ ] Tema escuro/claro
- [ ] Autenticação com senha
- [ ] Multi-usuário
- [ ] Agendamento de mensagens
- [ ] Templates de respostas
- [ ] Integração com CRM

---

**Dashboard versão 1.0.0**

Desenvolvido com ❤️ para gerenciamento profissional de bots WhatsApp.

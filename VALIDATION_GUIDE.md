# 🔒 Validação e Sanitização

Sistema completo de validação de entrada e sanitização para proteger a aplicação contra ataques comuns como XSS, SQL Injection e dados malformados.

## 📁 Arquivos Criados

### `services/validation.js` (450+ linhas)
Módulo completo com funções de validação e sanitização.

## 🛡️ Funcionalidades

### 1. **Sanitização (Limpeza de Dados)**

#### `sanitizeHTML(input)`
Remove scripts e HTML malicioso usando a biblioteca `xss`.
```javascript
sanitizeHTML('<script>alert("XSS")</script>') // → ''
sanitizeHTML('<img src=x onerror=alert(1)>') // → ''
```

#### `sanitizeString(input)`
Remove espaços extras, normaliza e limita tamanho.
```javascript
sanitizeString('   texto   com   espaços   ') // → 'texto com espaços'
sanitizeString('a'.repeat(2000)) // → 'a'.repeat(1000) (limitado)
```

#### `sanitizePhone(phone)`
Remove caracteres especiais, mantém apenas números e '+'.
```javascript
sanitizePhone('+55 (11) 99999-9999') // → '+5511999999999'
sanitizePhone('5511999999999') // → '5511999999999'
```

#### `sanitizeEmail(email)`
Normaliza email para formato padrão.
```javascript
sanitizeEmail('  USER@EXAMPLE.COM  ') // → 'user@example.com'
```

#### `sanitizeObject(obj)`
Sanitiza recursivamente todo objeto (listas, nested objects, etc).
```javascript
const dirty = {
  name: '  John  ',
  email: '  john@example.com  ',
  scripts: '<script>alert(1)</script>',
  nested: {
    field: '<img src=x onerror=alert(1)>'
  }
};

const clean = sanitizeObject(dirty);
// Retorna objeto completamente limpo
```

---

## ✅ Validação

### Validações Individuais

#### `isValidPhone(phone)`
Valida telefone no formato WhatsApp (10-15 dígitos, com ou sem '+').
```javascript
isValidPhone('+5511999999999') // → true
isValidPhone('11999999999') // → true
isValidPhone('123') // → false
isValidPhone('') // → false
```

#### `isValidEmail(email)`
Valida formato de email.
```javascript
isValidEmail('user@example.com') // → true
isValidEmail('invalid@email') // → false
```

#### `isValidName(name)`
Valida nome (2-100 caracteres, apenas letras).
```javascript
isValidName('João Silva') // → true
isValidName('J') // → false
isValidName('John123') // → false
```

#### `isValidMessage(message)`
Valida mensagem (1-4096 caracteres, limite WhatsApp).
```javascript
isValidMessage('Olá!') // → true
isValidMessage('') // → false
isValidMessage('x'.repeat(5000)) // → false
```

#### `isValidDate(date)`
Valida se é uma data válida.
```javascript
isValidDate('2026-04-10') // → true
isValidDate('invalid') // → false
```

#### `isValidRating(rating)`
Valida rating (1-5).
```javascript
isValidRating(5) // → true
isValidRating(0) // → false
isValidRating(10) // → false
```

### Validações em Lote

#### `validateContact(data)`
Valida todos os campos de um contato.
```javascript
const result = validateContact({
  phone: '+5511999999999',
  name: 'João Silva',
  email: 'joao@example.com',
  company: 'Empresa XYZ'
});

if (result.isValid) {
  console.log('✅ Contato válido');
} else {
  console.log('❌ Erros:', result.errors);
  // ['Telefone inválido', 'Email inválido']
}
```

#### `validateMessage(data)`
Valida campos de mensagem.
```javascript
const result = validateMessage({
  phone: '+5511999999999',
  content: 'Olá!',
  type: 'text',
  direction: 'incoming'
});
```

#### `validateFollowUp(data)`
Valida follow-up (incluindo data futura).
```javascript
const result = validateFollowUp({
  phone: '+5511999999999',
  message: 'Revisar pendências',
  dueDate: '2026-04-15T10:00:00Z'
});
```

#### `validateFeedback(data)`
Valida feedback/avaliação.
```javascript
const result = validateFeedback({
  phone: '+5511999999999',
  content: 'Ótimo atendimento!',
  type: 'positive',
  rating: 5
});
```

---

## 🧹 Limpeza Completa (Validação + Sanitização)

### `cleanContact(data)`
Valida E sanitiza dados de contato em uma chamada.
```javascript
try {
  const clean = cleanContact({
    phone: '+55 (11) 99999-9999',
    name: '  João Silva  ',
    email: '  JOAO@EXAMPLE.COM  ',
    company: 'Empresa <script>alert(1)</script>'
  });
  
  console.log(clean);
  // {
  //   phone: '+5511999999999',
  //   name: 'João Silva',
  //   email: 'joao@example.com',
  //   company: 'Empresa'
  // }
} catch (error) {
  console.error('Contato inválido:', error.message);
  // 'Contato inválido: Telefone inválido'
}
```

### `cleanMessage(data)`
Valida E sanitiza dados de mensagem.
```javascript
const clean = cleanMessage({
  phone: '+5511999999999',
  content: '  Olá!  ',
  type: 'text',
  direction: 'incoming'
});
```

### `cleanFollowUp(data)`
Valida E sanitiza follow-up.
```javascript
const clean = cleanFollowUp({
  phone: '+5511999999999',
  message: 'Revisar',
  dueDate: '2026-04-15T10:00:00Z'
});
```

### `cleanFeedback(data)`
Valida E sanitiza feedback.
```javascript
const clean = cleanFeedback({
  phone: '+5511999999999',
  content: 'Ótimo!',
  type: 'positive',
  rating: 5
});
```

---

## 🔄 Middleware (Automático em Todas as Requisições)

### `sanitizeRequestBody`
Middleware que sanitiza automaticamente o corpo de TODAS as requisições.

**Ativado em:** `server.js` - linha ~51
```javascript
app.use(sanitizeRequestBody);
```

**O que faz:**
- Remove XSS de todos os campos string
- Limita tamanho de strings
- Remove espaços extras

### `sanitizeQueryParams`
Middleware que sanitiza automaticamente query parameters.

**Ativado em:** `server.js` - linha ~52
```javascript
app.use(sanitizeQueryParams);
```

**O que faz:**
- Limpa parâmetros de URL
- Remove XSS de query strings

---

## 📝 Rotas Atualizadas com Validação

### 1. **POST /api/crm/contacts**
```bash
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511999999999",
    "name": "João Silva",
    "email": "joao@example.com",
    "company": "Empresa XYZ"
  }'
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "contact": { ... }
}
```

**Resposta Erro (dados inválidos):**
```json
{
  "error": "Dados de contato inválidos",
  "details": [
    "Telefone inválido",
    "Nome deve ter 2-100 caracteres, apenas letras"
  ]
}
```

### 2. **POST /api/crm/automation/follow-up**
```bash
curl -X POST http://localhost:3000/api/crm/automation/follow-up \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511999999999",
    "message": "Revisar pendências",
    "dueDate": "2026-04-15T10:00:00Z"
  }'
```

### 3. **POST /api/crm/sentiment/feedback**
```bash
curl -X POST http://localhost:3000/api/crm/sentiment/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511999999999",
    "content": "Ótimo atendimento!",
    "type": "positive",
    "rating": 5
  }'
```

---

## 🔒 Proteção Contra Ataques

### 1. **XSS (Cross-Site Scripting)**
```javascript
// ❌ Antes (vulnerável):
const input = '<script>alert("XSS")</script>';
database.save(input);

// ✅ Depois (protegido):
const clean = sanitizeHTML(input); // → ''
database.save(clean);
```

### 2. **SQL Injection**
```javascript
// ✅ Sempre uso prepared statements (via database-sqlite.js)
// Nunca concatenar strings em queries
db.runAsync('INSERT INTO users WHERE name = ?', [userInput]);
// userInput é parâmetro seguro, não pode ser SQL
```

### 3. **Dados Malformados**
```javascript
// ❌ Antes: Aceita qualquer coisa
const phone = req.body.phone; // Pode ser array, objeto, etc
database.save(phone);

// ✅ Depois: Validação rigorosa
const result = validatePhone(req.body.phone);
if (!result.isValid) return res.status(400).json({ error: ... });
```

### 4. **DoS (Denial of Service)**
```javascript
// ✅ Limites implementados:
// - Strings limitadas a 1000 caracteres
// - Mensagens limitadas a 4096 caracteres (WhatsApp)
// - Rate limiting via query params sanitized
```

---

## 📊 Tipos Válidos

### Status de Contato
```javascript
'ativo' | 'inativo' | 'bloqueado'
```

### Tipo de Mensagem
```javascript
'text' | 'image' | 'document' | 'audio' | 'video'
```

### Direção de Mensagem
```javascript
'incoming' | 'outgoing'
```

### Tipo de Feedback
```javascript
'positive' | 'neutral' | 'negative'
```

### Rating
```javascript
1 | 2 | 3 | 4 | 5
```

---

## 🧪 Testes Rápidos

```bash
# ✅ Teste com dados válidos
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5511999999999","name":"João Silva","email":"joao@example.com"}'

# ❌ Teste com XSS (deve ser bloqueado)
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5511999999999","name":"<script>alert(1)</script>","email":"test@example.com"}'

# ❌ Teste com email inválido
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5511999999999","name":"João Silva","email":"invalid"}'

# ❌ Teste com telefone inválido
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Content-Type: application/json" \
  -d '{"phone":"12345","name":"João Silva","email":"test@example.com"}'
```

---

## 📈 Próximos Passos

1. ✅ **Validação básica** - IMPLEMENTADO
2. ✅ **Sanitização XSS** - IMPLEMENTADO
3. ✅ **Middleware automático** - IMPLEMENTADO
4. ⏳ **Rate limiting** - Pode ser adicionado com `express-rate-limit`
5. ⏳ **CORS** - Pode ser adicionado com `cors`
6. ⏳ **Auth** - JWT ou OAuth pode ser integrado

---

## 🔧 Como Usar em Novas Rotas

```javascript
const { cleanContact, validateContact } = require('./services/validation');

// Opção 1: Validar e limpar manualmente
app.post('/api/novo-endpoint', (req, res) => {
  try {
    // Validar
    const validation = validateContact(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validation.errors 
      });
    }
    
    // Sanitizar
    const clean = cleanContact(req.body);
    
    // Usar dados limpos
    res.json({ success: true, data: clean });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Opção 2: Usar cleanContact diretamente (valida + sanitiza)
app.post('/api/novo-endpoint-2', (req, res) => {
  try {
    const clean = cleanContact(req.body); // Lança erro se inválido
    res.json({ success: true, data: clean });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## 📚 Dependências

- `validator` - Validação de email, URL, etc
- `xss` - Sanitização de HTML/XSS
- Node.js built-in `crypto` - Criptografia (via CryptoJS)

```bash
npm list validator xss
# validator@13.x.x
# xss@1.x.x
```

**Instalação:**
```bash
npm install validator xss
```

---

## ✨ Resumo de Segurança

| Ameaça | Proteção | Status |
|--------|----------|--------|
| XSS | `sanitizeHTML()` + middleware | ✅ |
| SQL Injection | Prepared statements | ✅ |
| Dados Malformados | Validação rigorosa | ✅ |
| DoS | Limites de tamanho | ✅ |
| CORS | Não configurado | ⏳ |
| Rate Limiting | Não configurado | ⏳ |
| JWT/Auth | Não configurado | ⏳ |
| HTTPS | Não configurado | ⏳ |

---

**Banco de Dados:** ✅ SQLite com AES encryption  
**Validação:** ✅ Completa  
**Sanitização:** ✅ Automática  
**Próxima:** Deploy em produção com HTTPS

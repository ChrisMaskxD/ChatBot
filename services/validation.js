const validator = require('validator');
const xss = require('xss');

/**
 * FUNÇÕES DE SANITIZAÇÃO
 */

/**
 * Remove XSS (scripts e HTML malicioso)
 */
function sanitizeHTML(input) {
  if (!input) return '';
  return xss(String(input), {
    whiteList: {}, // Sem HTML permitido
    stripIgnoredTag: true,
    stripLeadingAndTrailingWhitespace: true,
  });
}

/**
 * Remove espaços extras e normaliza string
 */
function sanitizeString(input) {
  if (!input) return '';
  return String(input)
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 1000); // Limite de 1000 caracteres
}

/**
 * Sanitiza número de telefone (remove caracteres especiais, mantém apenas números e +)
 */
function sanitizePhone(phone) {
  if (!phone) return '';
  return String(phone)
    .replace(/[^\d+]/g, '')
    .slice(0, 20); // Limite para números internacionais
}

/**
 * Sanitiza email
 */
function sanitizeEmail(email) {
  if (!email) return '';
  return validator.normalizeEmail(String(email));
}

/**
 * Sanitiza objeto recursivamente
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
    const value = obj[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(sanitizeHTML(value));
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value === 'number' && !Number.isFinite(value)) {
      sanitized[key] = 0;
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * FUNÇÕES DE VALIDAÇÃO
 */

/**
 * Valida número de telefone (WhatsApp format)
 */
function isValidPhone(phone) {
  if (!phone) return false;
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  // Mínimo 10 dígitos (formato: +55 11 99999-9999 ou 5511999999999)
  return /^\+?[\d]{10,15}$/.test(cleaned);
}

/**
 * Valida email
 */
function isValidEmail(email) {
  if (!email) return false;
  return validator.isEmail(String(email));
}

/**
 * Valida URL
 */
function isValidURL(url) {
  if (!url) return false;
  try {
    return validator.isURL(String(url), {
      protocols: ['http', 'https'],
      require_protocol: true,
    });
  } catch {
    return false;
  }
}

/**
 * Valida nome (sem números, sem caracteres especiais)
 */
function isValidName(name) {
  if (!name) return false;
  const str = String(name).trim();
  return /^[a-zA-ZÀ-ÿ\s'-]{2,100}$/.test(str);
}

/**
 * Valida mensagem
 */
function isValidMessage(message) {
  if (!message) return false;
  const str = String(message).trim();
  return str.length >= 1 && str.length <= 4096; // Limite WhatsApp
}

/**
 * Valida data
 */
function isValidDate(date) {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Valida timestamp futuro
 */
function isValidFutureDate(date) {
  if (!isValidDate(date)) return false;
  return new Date(date) > new Date();
}

/**
 * Valida número inteiro positivo
 */
function isValidPositiveNumber(num) {
  const n = Number(num);
  return Number.isInteger(n) && n > 0;
}

/**
 * Valida status válido
 */
function isValidStatus(status) {
  const validStatuses = ['ativo', 'inativo', 'bloqueado'];
  return validStatuses.includes(String(status).toLowerCase());
}

/**
 * Valida tipo de mensagem
 */
function isValidMessageType(type) {
  const validTypes = ['text', 'image', 'document', 'audio', 'video'];
  return validTypes.includes(String(type).toLowerCase());
}

/**
 * Valida direção de mensagem
 */
function isValidMessageDirection(direction) {
  const validDirections = ['incoming', 'outgoing'];
  return validDirections.includes(String(direction).toLowerCase());
}

/**
 * Valida rating (1-5)
 */
function isValidRating(rating) {
  const r = Number(rating);
  return Number.isInteger(r) && r >= 1 && r <= 5;
}

/**
 * FUNÇÕES DE VALIDAÇÃO EM LOTE
 */

/**
 * Valida dados de contato
 */
function validateContact(data) {
  const errors = [];
  
  if (!data.phone || !isValidPhone(data.phone)) {
    errors.push('Telefone inválido');
  }
  
  if (!data.name || !isValidName(data.name)) {
    errors.push('Nome deve ter 2-100 caracteres, apenas letras');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Email inválido');
  }
  
  if (data.company && String(data.company).length > 100) {
    errors.push('Empresa não pode ter mais de 100 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida dados de mensagem
 */
function validateMessage(data) {
  const errors = [];
  
  if (!data.phone || !isValidPhone(data.phone)) {
    errors.push('Telefone inválido');
  }
  
  if (!data.content || !isValidMessage(data.content)) {
    errors.push('Mensagem deve ter entre 1 e 4096 caracteres');
  }
  
  if (data.type && !isValidMessageType(data.type)) {
    errors.push('Tipo de mensagem inválido');
  }
  
  if (data.direction && !isValidMessageDirection(data.direction)) {
    errors.push('Direção de mensagem inválida');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida dados de follow-up
 */
function validateFollowUp(data) {
  const errors = [];
  
  if (!data.phone || !isValidPhone(data.phone)) {
    errors.push('Telefone inválido');
  }
  
  if (!data.message || !isValidMessage(data.message)) {
    errors.push('Mensagem deve ter entre 1 e 4096 caracteres');
  }
  
  if (!data.dueDate || !isValidFutureDate(data.dueDate)) {
    errors.push('Data deve ser válida e no futuro');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida dados de feedback
 */
function validateFeedback(data) {
  const errors = [];
  
  if (!data.phone || !isValidPhone(data.phone)) {
    errors.push('Telefone inválido');
  }
  
  if (!data.content || !isValidMessage(data.content)) {
    errors.push('Conteúdo deve ter entre 1 e 4096 caracteres');
  }
  
  if (data.rating && !isValidRating(data.rating)) {
    errors.push('Rating deve ser entre 1 e 5');
  }
  
  const validTypes = ['positive', 'neutral', 'negative'];
  if (data.type && !validTypes.includes(String(data.type).toLowerCase())) {
    errors.push('Tipo de feedback inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * MIDDLEWARE DE VALIDAÇÃO
 */

/**
 * Middleware para sanitizar corpo da requisição
 */
function sanitizeRequestBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware para sanitizar query params
 */
function sanitizeQueryParams(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }
  next();
}

/**
 * Middleware de validação de contato
 */
function validateContactMiddleware(req, res, next) {
  const validation = validateContact(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Dados de contato inválidos',
      details: validation.errors,
    });
  }
  
  next();
}

/**
 * Middleware de validação de mensagem
 */
function validateMessageMiddleware(req, res, next) {
  const validation = validateMessage(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Dados de mensagem inválidos',
      details: validation.errors,
    });
  }
  
  next();
}

/**
 * Sanita e valida dados de contato
 */
function cleanContact(data) {
  const validation = validateContact(data);
  
  if (!validation.isValid) {
    throw new Error(`Contato inválido: ${validation.errors.join(', ')}`);
  }
  
  return {
    phone: sanitizePhone(data.phone),
    name: sanitizeString(data.name),
    email: data.email ? sanitizeEmail(data.email) : '',
    company: data.company ? sanitizeString(data.company) : '',
    metadata: sanitizeObject(data.metadata || {}),
  };
}

/**
 * Sanita e valida dados de mensagem
 */
function cleanMessage(data) {
  const validation = validateMessage(data);
  
  if (!validation.isValid) {
    throw new Error(`Mensagem inválida: ${validation.errors.join(', ')}`);
  }
  
  return {
    phone: sanitizePhone(data.phone),
    content: sanitizeString(data.content),
    type: String(data.type || 'text').toLowerCase(),
    direction: String(data.direction || 'incoming').toLowerCase(),
    metadata: sanitizeObject(data.metadata || {}),
  };
}

/**
 * Sanita e valida dados de follow-up
 */
function cleanFollowUp(data) {
  const validation = validateFollowUp(data);
  
  if (!validation.isValid) {
    throw new Error(`Follow-up inválido: ${validation.errors.join(', ')}`);
  }
  
  return {
    phone: sanitizePhone(data.phone),
    message: sanitizeString(data.message),
    dueDate: new Date(data.dueDate).toISOString(),
  };
}

/**
 * Sanita e valida dados de feedback
 */
function cleanFeedback(data) {
  const validation = validateFeedback(data);
  
  if (!validation.isValid) {
    throw new Error(`Feedback inválido: ${validation.errors.join(', ')}`);
  }
  
  return {
    phone: sanitizePhone(data.phone),
    content: sanitizeString(data.content),
    type: String(data.type || 'neutral').toLowerCase(),
    rating: Number(data.rating || 3),
  };
}

module.exports = {
  // Sanitização
  sanitizeHTML,
  sanitizeString,
  sanitizePhone,
  sanitizeEmail,
  sanitizeObject,
  
  // Validação individual
  isValidPhone,
  isValidEmail,
  isValidURL,
  isValidName,
  isValidMessage,
  isValidDate,
  isValidFutureDate,
  isValidPositiveNumber,
  isValidStatus,
  isValidMessageType,
  isValidMessageDirection,
  isValidRating,
  
  // Validação em lote
  validateContact,
  validateMessage,
  validateFollowUp,
  validateFeedback,
  
  // Middleware
  sanitizeRequestBody,
  sanitizeQueryParams,
  validateContactMiddleware,
  validateMessageMiddleware,
  
  // Limpeza (validação + sanitização)
  cleanContact,
  cleanMessage,
  cleanFollowUp,
  cleanFeedback,
};

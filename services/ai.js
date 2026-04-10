const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Histórico de conversa por número de telefone (máx. 20 trocas por usuário)
const historicos = new Map();

// Rate limiting: máx. mensagens por janela de tempo por usuário
const rateLimits = new Map();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10');
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 min

/**
 * Verifica se o número ultrapassou o limite de mensagens
 * @returns {boolean} true se deve ser bloqueado
 */
function isRateLimited(numero) {
  const agora = Date.now();
  const dados = rateLimits.get(numero) || { count: 0, windowStart: agora };

  if (agora - dados.windowStart > RATE_LIMIT_WINDOW_MS) {
    dados.count = 1;
    dados.windowStart = agora;
  } else {
    dados.count++;
  }

  rateLimits.set(numero, dados);
  return dados.count > RATE_LIMIT_MAX;
}

/**
 * Gera uma resposta usando OpenAI, mantendo histórico por usuário
 * @param {string} numero - Número do usuário (para contexto de conversa)
 * @param {string} mensagem - Mensagem do usuário
 * @param {object} config - Configurações do modelo (model, temperature, maxTokens, customPrompt)
 * @returns {Promise<string>}
 */
async function gerarResposta(numero, mensagem, config = {}) {
  try {
    // Verificar rate limit
    if (isRateLimited(numero)) {
      console.warn(`[AI] Rate limit atingido para ${numero}`);
      return 'Você enviou muitas mensagens em pouco tempo. Aguarde um momento e tente novamente.';
    }

    const model = config.aiModel || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const temperature = parseFloat(config.temperature ?? 0.7);
    const maxTokens = parseInt(config.maxTokens || 500);
    const systemPrompt = config.customPrompt ||
      'Você é um assistente virtual amigável e prestativo. Responda de forma concisa e útil. Seja sempre cortês e profissional.';

    // Recuperar ou inicializar histórico do usuário
    const historico = historicos.get(numero) || [];
    historico.push({ role: 'user', content: mensagem });

    console.log(`[AI] Gerando resposta para ${numero} | modelo: ${model} | histórico: ${historico.length} msgs`);

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...historico],
      temperature,
      max_tokens: maxTokens,
    });

    const resposta = completion.choices[0].message.content;
    historico.push({ role: 'assistant', content: resposta });

    // Manter somente as últimas 20 trocas (40 entradas) para não explodir o contexto
    if (historico.length > 40) historico.splice(0, historico.length - 40);
    historicos.set(numero, historico);

    console.log(`[AI] Resposta gerada (${resposta.length} chars)`);
    return resposta;
  } catch (error) {
    console.error('[AI] Erro ao gerar resposta:', error.message);
    return 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.';
  }
}

/**
 * Limpa o histórico de conversa de um usuário
 * @param {string} numero
 */
function limparHistorico(numero) {
  historicos.delete(numero);
  console.log(`[AI] Histórico limpo para ${numero}`);
}

module.exports = { gerarResposta, limparHistorico };

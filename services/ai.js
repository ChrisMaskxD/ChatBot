const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera uma resposta automática usando OpenAI
 * @param {string} mensagem - Mensagem do usuário
 * @returns {Promise<string>} - Resposta gerada
 */
async function gerarResposta(mensagem) {
  try {
    console.log(`[AI] Gerando resposta para: "${mensagem}"`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente virtual amigável e prestativo. Responda as mensagens de forma concisa e útil. Sempre seja cortês e profissional.',
        },
        {
          role: 'user',
          content: mensagem,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const resposta = completion.choices[0].message.content;
    console.log(`[AI] Resposta gerada: "${resposta}"`);

    return resposta;
  } catch (error) {
    console.error('[AI] Erro ao gerar resposta:', error.message);
    return 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.';
  }
}

module.exports = {
  gerarResposta,
};

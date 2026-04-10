const axios = require('axios');

const EVO_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

const headers = {
  'Content-Type': 'application/json',
  'apikey': API_KEY
};

/**
 * Envia mensagem de texto
 */
async function sendMessage(numeroDestino, texto) {
  try {
    console.log(`[Evolution] Enviando texto para ${numeroDestino}`);

    const payload = {
      number: numeroDestino.replace(/\D/g, ''),
      text: texto
    };

    const response = await axios.post(
      `${EVO_URL}/message/sendText/${INSTANCE}`,
      payload,
      { headers }
    );

    console.log(`[Evolution] Mensagem enviada com sucesso!`);
    return response.data;
  } catch (error) {
    console.error('[Evolution] Erro ao enviar mensagem:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Envia documento (PDF)
 */
async function sendDocument(numeroDestino, linkPDF, nomeArquivo) {
  try {
    console.log(`[Evolution] Enviando documento para ${numeroDestino}`);

    const payload = {
      number: numeroDestino.replace(/\D/g, ''),
      media: linkPDF,
      fileName: nomeArquivo || 'catalogo.pdf',
      caption: 'Aqui está nosso catálogo! 📄',
      mediatype: 'document'
    };

    const response = await axios.post(
      `${EVO_URL}/message/sendMedia/${INSTANCE}`,
      payload,
      { headers }
    );

    console.log(`[Evolution] Documento enviado com sucesso!`);
    return response.data;
  } catch (error) {
    console.error('[Evolution] Erro ao enviar documento:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Marca como lida (Evolution não precisa, mas mantemos compatibilidade)
 */
async function markAsRead(messageId) {
  console.log(`[Evolution] Mensagem ${messageId} marcada como lida (simulado)`);
  return { success: true };
}

module.exports = { sendMessage, sendDocument, markAsRead };
const axios = require('axios');

const WHATSAPP_API_URL = 'https://graph.instagram.com/v18.0';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

/**
 * Envia uma mensagem de texto para um número do WhatsApp
 * @param {string} numeroDestino - Número do WhatsApp destinatário (formato: 55XXXXXXXXXXXX)
 * @param {string} texto - Texto da mensagem
 * @returns {Promise<object>} - Resposta da API
 */
async function sendMessage(numeroDestino, texto) {
  try {
    console.log(`[WhatsApp] Enviando mensagem para ${numeroDestino}`);

    const payload = {
      messaging_product: 'whatsapp',
      to: numeroDestino,
      type: 'text',
      text: {
        preview_url: false,
        body: texto,
      },
    };

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[WhatsApp] Mensagem enviada com sucesso. ID: ${response.data.messages[0].id}`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Envia um documento PDF para um número do WhatsApp
 * @param {string} numeroDestino - Número do WhatsApp destinatário (formato: 55XXXXXXXXXXXX)
 * @param {string} linkPDF - URL do arquivo PDF
 * @param {string} nomeArquivo - Nome do arquivo PDF
 * @returns {Promise<object>} - Resposta da API
 */
async function sendDocument(numeroDestino, linkPDF, nomeArquivo) {
  try {
    console.log(`[WhatsApp] Enviando documento para ${numeroDestino}: ${nomeArquivo}`);

    const payload = {
      messaging_product: 'whatsapp',
      to: numeroDestino,
      type: 'document',
      document: {
        link: linkPDF,
        filename: nomeArquivo,
      },
    };

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[WhatsApp] Documento enviado com sucesso. ID: ${response.data.messages[0].id}`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar documento:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Marca uma mensagem como lida
 * @param {string} messageId - ID da mensagem no WhatsApp
 * @returns {Promise<object>} - Resposta da API
 */
async function markAsRead(messageId) {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[WhatsApp] Mensagem marcada como lida: ${messageId}`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] Erro ao marcar mensagem como lida:', error.message);
    throw error;
  }
}

module.exports = {
  sendMessage,
  sendDocument,
  markAsRead,
};

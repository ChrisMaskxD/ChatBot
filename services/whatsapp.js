const axios = require('axios');

const WHATSAPP_API_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v21.0'}`;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

async function sendMessage(numeroDestino, texto) {
  try {
    console.log(`[WhatsApp] Enviando mensagem para ${numeroDestino}`);
    const payload = {
      messaging_product: 'whatsapp',
      to: numeroDestino,
      type: 'text',
      text: { preview_url: false, body: texto },
    };
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    console.log(`[WhatsApp] Mensagem enviada. ID: ${response.data.messages[0].id}`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', error.response?.data || error.message);
    throw error;
  }
}

async function sendDocument(numeroDestino, linkPDF, nomeArquivo) {
  try {
    console.log(`[WhatsApp] Enviando documento para ${numeroDestino}: ${nomeArquivo}`);
    const payload = {
      messaging_product: 'whatsapp',
      to: numeroDestino,
      type: 'document',
      document: { link: linkPDF, filename: nomeArquivo },
    };
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    console.log(`[WhatsApp] Documento enviado. ID: ${response.data.messages[0].id}`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar documento:', error.response?.data || error.message);
    throw error;
  }
}

async function markAsRead(messageId) {
  try {
    const payload = { messaging_product: 'whatsapp', status: 'read', message_id: messageId };
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    console.log(`[WhatsApp] Mensagem marcada como lida: ${messageId}`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] Erro ao marcar como lida:', error.message);
    throw error;
  }
}

module.exports = { sendMessage, sendDocument, markAsRead };

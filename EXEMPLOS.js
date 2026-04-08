/**
 * EXEMPLOS DE USO
 * 
 * Este arquivo contém exemplos de como usar as funções dos serviços
 * Não execute este arquivo, use como referência
 */

const { sendMessage, sendDocument } = require('./services/whatsapp');
const { gerarResposta } = require('./services/ai');

// ==========================================
// EXEMPLO 1: Enviar mensagem de texto
// ==========================================
async function exemplo1_enviarMensagem() {
  try {
    const numero = '5511999999999'; // Formato: código país + DDD + número
    const texto = 'Olá! Esta é uma mensagem automática.';

    await sendMessage(numero, texto);
    console.log('Mensagem enviada com sucesso!');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ==========================================
// EXEMPLO 2: Enviar documento (PDF)
// ==========================================
async function exemplo2_enviarPDF() {
  try {
    const numero = '5511999999999';
    const linkPDF = 'https://exemplo.com/catalogo.pdf';
    const nomeArquivo = 'Catalogo.pdf';

    await sendDocument(numero, linkPDF, nomeArquivo);
    console.log('PDF enviado com sucesso!');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ==========================================
// EXEMPLO 3: Gerar resposta com IA
// ==========================================
async function exemplo3_gerarRespostaIA() {
  try {
    const mensagem = 'Qual é o preço de seus produtos?';
    const resposta = await gerarResposta(mensagem);

    console.log('Mensagem:', mensagem);
    console.log('Resposta:', resposta);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ==========================================
// EXEMPLO 4: Fluxo completo
// ==========================================
async function exemplo4_fluxoCompleto() {
  try {
    const numero = '5511999999999';
    const mensagemDoUsuario = 'Olá, vocês têm um catálogo?';

    // 1. Processar com IA
    const resposta = await gerarResposta(
      `O usuário perguntou: "${mensagemDoUsuario}". Responda de forma útil.`
    );

    // 2. Enviar resposta
    await sendMessage(numero, resposta);

    // 3. Enviar catálogo
    await sendMessage(numero, 'Segue nosso catálogo abaixo:');
    await sendDocument(
      numero,
      'https://exemplo.com/catalogo.pdf',
      'Catalogo_Produtos.pdf'
    );

    console.log('Fluxo completo executado!');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ==========================================
// EXEMPLO 5: Responder mensagens diferentes
// ==========================================
async function exemplo5_centroAtendimento() {
  const numero = '5511999999999';
  const mensagemRecebida = 'preciso de ajuda';

  try {
    if (mensagemRecebida.toLowerCase().includes('oi')) {
      await sendMessage(numero, 'Olá! Como posso ajudá-lo?');
    } else if (mensagemRecebida.toLowerCase().includes('catalogo')) {
      await sendMessage(numero, 'Aqui está nosso catálogo:');
      await sendDocument(numero, 'https://exemplo.com/catalogo.pdf', 'Catalogo.pdf');
    } else if (mensagemRecebida.toLowerCase().includes('ajuda')) {
      const resposta = await gerarResposta(
        `Um cliente pediu ajuda: "${mensagemRecebida}". Responda de forma profissional e útil.`
      );
      await sendMessage(numero, resposta);
    } else {
      const resposta = await gerarResposta(mensagemRecebida);
      await sendMessage(numero, resposta);
    }

    console.log('Mensagem processada!');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ==========================================
// EXEMPLO 6: Buscar dados de um catálogo
// ==========================================
async function exemplo6_catalogoComDados() {
  try {
    const numero = '5511999999999';
    
    // Simular busca em banco de dados
    const produtos = [
      { nome: 'Produto A', preco: 'R$ 29,90' },
      { nome: 'Produto B', preco: 'R$ 49,90' },
      { nome: 'Produto C', preco: 'R$ 79,90' },
    ];

    let mensagem = '📦 *Nossos Produtos:*\n\n';
    produtos.forEach((p) => {
      mensagem += `• ${p.nome} - ${p.preco}\n`;
    });

    await sendMessage(numero, mensagem);
    console.log('Catálogo enviado!');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ==========================================
// EXEMPLO 7: Customizar comportamento da IA
// ==========================================
async function exemplo7_personalizarIA() {
  try {
    const numeroCliente = '5511999999999';
    const perguntaCliente = 'Quais são os horários de atendimento?';

    // Você pode customizar a resposta da IA
    const contexto = `
      Você é um atendente da loja XYZ Ltda.
      Informações importantes:
      - Horário de funcionamento: 9h às 18h
      - Local: Rua Exemplo, 123
      - Telefone: (11) 98765-4321
      
      Responda sempre com profissionalismo e cortesia.
    `;

    const resposta = await gerarResposta(
      `${contexto}\n\nCliente perguntou: "${perguntaCliente}"`
    );

    await sendMessage(numeroCliente, resposta);
    console.log('Resposta customizada enviada!');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ==========================================
// RESUMO DE USO
// ==========================================
/*
  FUNÇÕES DISPONÍVEIS:

  1. sendMessage(numero, texto)
     - Envia uma mensagem de texto
     - numero: String (formato: 55XXXXXXXXXXXX)
     - texto: String (mensagem a enviar)

  2. sendDocument(numero, linkPDF, nomeArquivo)
     - Envia um arquivo PDF
     - numero: String (formato: 55XXXXXXXXXXXX)
     - linkPDF: String (URL pública do PDF)
     - nomeArquivo: String (nome que aparecerá no WhatsApp)

  3. gerarResposta(mensagem)
     - Gera uma resposta usando IA
     - mensagem: String (mensagem do usuário)
     - return: Promise<String> (resposta gerada)

  EXEMPLO PRÁTICO NO WEBHOOK:

  app.post('/webhook', async (req, res) => {
    const numeroOrigem = req.body.entry[0].changes[0].value.messages[0].from;
    const textoRecebido = req.body.entry[0].changes[0].value.messages[0].text.body;

    // Usar IA para responder
    const resposta = await gerarResposta(textoRecebido);
    await sendMessage(numeroOrigem, resposta);

    res.sendStatus(200);
  });
*/

module.exports = {
  exemplo1_enviarMensagem,
  exemplo2_enviarPDF,
  exemplo3_gerarRespostaIA,
  exemplo4_fluxoCompleto,
  exemplo5_centroAtendimento,
  exemplo6_catalogoComDados,
  exemplo7_personalizarIA,
};

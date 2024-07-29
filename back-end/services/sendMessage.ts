import axios from 'axios';

const sendMessage = async (phone: string, messageType: string, content: Record<string, unknown>) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!phoneNumberId) {
    throw new Error('WHATSAPP_BUSINESS_ACCOUNT_ID não está definido.');
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: messageType,
    [messageType]: content
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Mensagem enviada:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erro ao enviar mensagem:', error.response ? error.response.data : error.message);
    } else {
      console.error('Erro desconhecido:', error);
    }
  }
};

export default sendMessage;

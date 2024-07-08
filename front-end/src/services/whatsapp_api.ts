// src/api/whatsappApi.ts
import axios, { AxiosError } from 'axios';

const apiKey = '05fac500cd929eae2e37ef0b1bbbafe9-c7aab01f-930a-4cf8-af4f-364541aee40a';
const baseUrl = 'https://xlvgq4.api.infobip.com';

const sendMessage = async (message: string, to: string) => {
  const data = {
    from: '+15556164377', // Número de remetente registrado do WhatsApp
    to: to, // Número do destinatário da mensagem
    content: {
      text: message, // Conteúdo da mensagem que está sendo enviada
    }
  };

  try {
    const response = await axios.post(`${baseUrl}/whatsapp/1/message/text`, data, {
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
      console.error('Response data:', error.response ? error.response.data : 'No response data');
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
};

export default sendMessage;

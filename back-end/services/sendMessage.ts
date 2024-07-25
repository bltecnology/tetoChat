import axios from 'axios';

const sendMessage = async (phone: string, message: string) => {
  const url = `https://graph.facebook.com/v14.0/408476129004761/messages`; // Substitua 'YOUR_PHONE_NUMBER_ID'
  const token = process.env.WHATSAPP_ACCESS_TOKEN; // Use a variável de ambiente

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Mensagem enviada:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erro ao enviar mensagem:', error.response?.data);
    } else {
      console.error('Erro ao enviar mensagem:', error);
    }
  }
};

export default sendMessage;

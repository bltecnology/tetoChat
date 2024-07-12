import axios from 'axios';

const sendMessage = async (phone: string, message: string) => {
    const url = `https://graph.facebook.com/v14.0/368232926373701/messages`; // Substitua 'YOUR_PHONE_NUMBER_ID'
    const token = 'EAAXfbaD8KnoBO6vlPawvlbLFbFu9iZAdKahEfhhegdzwdcxuXUtvScNgBWxFMR8DZCHdfNQ0RvMsMP2bfCFKwl7ApRrVUIZBEai87ncNLgZAmgXBng99MRgQkMhgaD8Q4x1ZBVl9sp0ulFInsacyIy5a5EvgZB7bdmaZASYlZCZAWyN0pxm8hOPG81GOPqra0xHT6BYVKSK78QImxK16O0atS'; // Substitua 'YOUR_ACCESS_TOKEN' pelo token temporário

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
        if (error instanceof Error) {
            console.error('Erro ao enviar mensagem:', error.message);
        } else {
            console.error('Erro ao enviar mensagem:', error);
        }
    }
};

export default sendMessage;

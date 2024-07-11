import axios from 'axios';

const sendMessage = async (phone: string, message: string) => {
    const url = `https://graph.facebook.com/v14.0/351880008013177/messages`; // Substitua 'YOUR_PHONE_NUMBER_ID'
    const token = 'EAAXfbaD8KnoBO3uulFxWlDPpLEEppHOewRFlQzZBka696ZBMIUplW86YPhC7NuaoHPe1f79ak6dIGyGZBZCZAl9u6sfFKcZBVt0De6duDGo6uZC7lDlNZCKwtl4VdVju3WEMV2WLwyDQ60A7kmoMNmCehIDhRmwmjLuApLEV22xYinkIOrMRqeieQlzXG1oE9cpUFvzXvh0cMAWrueTZA2S0ZD'; // Substitua 'YOUR_ACCESS_TOKEN' pelo token temporário

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

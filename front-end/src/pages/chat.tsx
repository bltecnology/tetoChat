import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/header';

interface Message {
    from: string;
    content: {
        text: string;
        templateName?: string;
        templateData?: {
            body: {
                placeholders: string[];
            };
        };
    };
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get('http://localhost:3005/messages');
                setMessages(response.data);
            } catch (error) {
                console.error('Erro ao buscar mensagens:', error);
            }
        };

        const intervalId = setInterval(fetchMessages, 5000); // Busque mensagens a cada 5 segundos

        return () => clearInterval(intervalId);
    }, []);

    const handleSendMessage = async () => {
        try {
            await axios.post('http://localhost:3005/send', {
                phone: phoneNumber,
                message: newMessage,
            });
            setNewMessage('');
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    };

    return (
        <div>
            <Header />
            <div className="bg-black min-h-screen w-1/3 flex flex-col justify-center items-center">
                <div className="bg-pink-100 min-h-screen h-80 w-full flex flex-col justify-center items-center">
                    {messages.map((message, index) => (
                        <div key={index} className="bg-white p-2 m-2 rounded shadow">
                            <p><strong>{message.from}:</strong> {message.content.text || message.content.templateName}</p>
                            {message.content.templateData && (
                                <p>Placeholder: {message.content.templateData.body.placeholders.join(', ')}</p>
                            )}
                        </div>
                    ))}
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Digite o número de telefone"
                        className="p-2 border rounded mt-2"
                    />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem"
                        className="p-2 border rounded mt-2"
                    />
                    <button onClick={handleSendMessage} className="p-2 bg-blue-500 text-white rounded mt-2">
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;

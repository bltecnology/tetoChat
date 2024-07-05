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

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get('http://localhost:3001/messages');
                setMessages(response.data);
            } catch (error) {
                console.error('Erro ao buscar mensagens:', error);
            }
        };

        fetchMessages();
    }, []);

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
                </div>
            </div>
        </div>
    );
}

export default Chat;

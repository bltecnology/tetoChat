import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/header';

interface Message {
    from: string;
    content: string;
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [recipient, setRecipient] = useState("");

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get('http://localhost:3005/messages');
                setMessages(response.data);
            } catch (error) {
                console.error('Erro ao buscar mensagens:', error);
            }
        };

        fetchMessages();
    }, []);

    const handleSendMessage = async () => {
        if (newMessage.trim() && recipient.trim()) {
            try {
                const response = await axios.post('http://localhost:3005/send', {
                    phone: recipient,
                    message: newMessage
                });
                console.log('Mensagem enviada com sucesso:', response.data);

                // Atualiza o estado messages com a nova mensagem
                setMessages(prevMessages => [
                    ...prevMessages,
                    { from: recipient, content: newMessage }
                ]);

                setNewMessage("");
                setRecipient("");
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        }
    };

    return (
        <div>
            <Header />
            <div>
                {messages.map((message, index) => (
                    <div key={index}>
                        <p>{message.content}</p>
                    </div>
                ))}
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Número do destinatário"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Digite sua mensagem"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button onClick={handleSendMessage}>Enviar Mensagem</button>
            </div>
        </div>
    );
};

export default Chat;

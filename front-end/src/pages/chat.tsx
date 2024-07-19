import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/header';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');

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

        const sentMessage: Message = {
          id: Date.now(),
          text: newMessage,
          sender: 'user'
        };

        setMessages([...messages, sentMessage]);
        setNewMessage('');
        setRecipient('');

        console.log('Mensagem enviada com sucesso:', response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Erro ao enviar mensagem:', error.response?.data);
        } else {
          console.error('Erro ao enviar mensagem:', error);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <div className="flex flex-col flex-grow bg-cover bg-center" style={{ backgroundImage: 'url(/path/to/background-image.png)' }}>
        <div className="flex flex-col flex-grow p-4 overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className={`max-w-xs p-3 my-2 rounded-lg ${message.sender === 'user' ? 'ml-auto bg-green-200' : 'mr-auto bg-white'}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="flex p-4 bg-white border-t border-gray-200">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Número do destinatário"
            className="flex-grow p-2 mr-2 border rounded"
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-grow p-2 mr-2 border rounded"
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-blue-500 text-white rounded"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

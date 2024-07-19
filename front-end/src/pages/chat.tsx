import React, { useState } from 'react';
import axios from 'axios';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');

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
    <div className="chat-screen">
      <div className="message-list">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Número do destinatário"
        />
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
        />
        <button onClick={handleSendMessage}>Enviar</button>
      </div>
    </div>
  );
};

export default Chat;

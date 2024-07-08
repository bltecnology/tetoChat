import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/header';
import sendMessage from '../services/whatsapp_api';

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
  const [newMessage, setNewMessage] = useState<string>('');
  const [recipient, setRecipient] = useState<string>(''); // Novo estado para o destinatário

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

  const handleSendMessage = async () => {
    try {
      const response = await sendMessage(newMessage, recipient); // Enviar mensagem para o destinatário especificado
      if (response) {
        setMessages([...messages, { from: '+5511978279776', content: { text: newMessage } }]);
        setNewMessage('');
        setRecipient('');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  return (
    <div>
      <Header />
      <div className="bg-black min-h-screen w-1/3 flex flex-col justify-center items-center">
        <div className="bg-pink-100 min-h-screen h-80 w-full flex flex-col justify-center items-center">
          <div className="w-full flex flex-col items-center">
            {messages.map((message, index) => (
              <div key={index} className="bg-white p-2 m-2 rounded shadow w-3/4">
                <p><strong>{message.from}:</strong> {message.content.text || message.content.templateName}</p>
                {message.content.templateData && (
                  <p>Placeholder: {message.content.templateData.body.placeholders.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
          <div className="w-full p-4">
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient's phone number"
              className="p-2 w-3/4 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="p-2 w-3/4 border border-gray-300 rounded mt-2"
            />
            <button
              onClick={handleSendMessage}
              className="p-2 ml-2 bg-blue-500 text-white rounded mt-2"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;

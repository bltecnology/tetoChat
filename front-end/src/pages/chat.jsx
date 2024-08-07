import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSend } from 'react-icons/fi';
import Header from '../components/header';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get('https://tetochat-8m0r.onrender.com/contacts', {
          withCredentials: true
        })
        setContacts(response.data);
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`https://tetochat-8m0r.onrender.com/messages?contact=${selectedContact.id}`);
          setMessages(response.data);
        } catch (error) {
          console.error('Erro ao buscar mensagens:', error);
        }
      };

      fetchMessages();
    }
  }, [selectedContact]);

  const handleSendMessage = async () => {
    if (selectedContact) {
      try {
        await axios.post('https://tetochat-8m0r.onrender.com/send', {
          toPhone: selectedContact.phone,
          text: newMessage,
        });

        const sentMessage = {
          id: Date.now(),
          content: newMessage,
          from_phone: 'me',
          to_phone: selectedContact.phone,
          timestamp: new Date().toISOString(),
          type: 'text',
        };

        setMessages((prevMessages) => [...prevMessages, sentMessage]);
        setNewMessage('');
        console.log('Mensagem enviada com sucesso');
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-grow">
        <div className="w-1/3 bg-white border-r border-gray-200">
          <input
            type="text"
            placeholder="Pesquise por nome ou número"
            className="w-full p-2 border-b border-gray-200"
          />
          <div className="p-2">
            <ul>
              {contacts.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedContact(contact)}
                >
                  <img src={contact.profilePic} alt={contact.name} className="w-10 h-10 rounded-full mr-2" />
                  <div>
                    <div className="font-bold">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.lastMessage}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="w-2/3 flex flex-col">
          {selectedContact ? (
            <>
              <div className="flex-grow bg-cover bg-center p-4 overflow-y-auto" style={{ backgroundImage: 'url(/path/to/background-image.png)' }}>
                {messages.map((message) => (
                  <div key={message.id} className={`max-w-xs p-3 my-2 rounded-lg ${message.from_phone === 'me' ? 'ml-auto bg-green-200' : 'mr-auto bg-white'}`}>
                    {message.content}
                  </div>
                ))}
              </div>
              <div className="flex items-center p-4 bg-white border-t border-gray-200">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-grow p-2 mr-2 border rounded"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-blue-500 text-white rounded mr-2"
                >
                  <FiSend />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <div className="text-gray-500">Selecione um contato para começar a conversar</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

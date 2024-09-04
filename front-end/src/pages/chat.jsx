import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPhoneForwarded, FiSmile, FiPaperclip, FiMic, FiMoreVertical } from 'react-icons/fi';
import { AiOutlineThunderbolt } from 'react-icons/ai';
import Header from '../components/header';
import TransferModal from '../components/modalChat';
import { io } from 'socket.io-client';
import backgroundImage from '../assets/image.png';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';
import defaultProfilePic from '../assets/defaultProfile.png';
import { useNavigate } from 'react-router-dom'; // Importando useNavigate

const socket = io('https://tetochat-8m0r.onrender.com');

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [chatContacts, setChatContacts] = useState([]); // Contatos da aba "Chat"
  const [queueContacts, setQueueContacts] = useState([]); // Contatos da aba "Fila"
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('contatos');
  const navigate = useNavigate(); // Inicializando useNavigate
  const loggedUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login'); // Redireciona para a página de login se o token não estiver presente
    }
  }, [navigate]);

  const handleEmojiClick = (event, emojiObject) => {
    if (emojiObject && emojiObject.emoji) {
      setNewMessage(prevInput => prevInput + emojiObject.emoji);
    }
    setShowEmojiPicker(false);
  };

  // Função para carregar mensagens ao clicar em um contato
  const loadMessages = async (contactId) => {
    try {
      const response = await axios.get(`https://tetochat-8m0r.onrender.com/messages?contact=${contactId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  // Função para carregar conversas na aba "Chat"
  const fetchChats = async () => {
    try {
      const response = await axios.get(`https://tetochat-8m0r.onrender.com/getUserChats?userId=${loggedUser.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      const fetchedChats = response.data;
  
      // Filtrar apenas as conversas iniciadas pelo usuário
      const uniqueChats = fetchedChats.filter(chat =>
        chat.user_id === loggedUser.id // Filtra as conversas em que o usuário atual participou
      );
  
      setChatContacts(prevChats => [...prevChats, ...uniqueChats]);
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
    }
  };

  // Função para carregar a fila de contatos
  const fetchQueue = async () => {
    try {
      const response = await axios.get(`/queue?userId=${loggedUser.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setQueueContacts(response.data); // Atualiza contatos na aba "Fila"
    } catch (error) {
      console.error('Erro ao buscar fila:', error);
    }
  };

  // Função para carregar a lista de contatos
  const fetchContacts = async () => {
    try {
      const response = await axios.get('https://tetochat-8m0r.onrender.com/contacts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setContacts(response.data); // Atualiza contatos na aba "Contatos"
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
    }
  };

  // UseEffect para carregar a lista de contatos conforme a aba ativa
  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChats();
    } else if (activeTab === 'fila') {
      fetchQueue();
    } else if (activeTab === 'contatos') {
      fetchContacts();
    }
  }, [activeTab]);

  // UseEffect para carregar mensagens ao selecionar um contato
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact]);

  // UseEffect para escutar novos eventos de mensagens
  useEffect(() => {
    socket.on('new_message', (message) => {
      if (message.contact_id === selectedContact?.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }

      // Verificar diretamente se o contato já existe na aba "Chat"
      if (!chatContacts.some(c => c.id === message.contact_id)) {
        const updatedContact = contacts.find(contact => contact.id === message.contact_id);
        if (updatedContact) {
          setChatContacts((prevChats) => [...prevChats, updatedContact]);
        }
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [selectedContact, chatContacts, contacts]);

  const handleSendMessage = async () => {
    if (selectedContact && newMessage.trim() !== '') {
      const sentMessage = {
        id: `msg-${Date.now()}`, // Gerar um ID temporário para a mensagem
        message_body: newMessage,
        message_from: 'me',
        message_timestamp: Math.floor(Date.now() / 1000).toString(),
        contact_id: selectedContact.id,
      };
  
      // Adiciona a mensagem imediatamente ao estado
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
  
      try {
        // Enviar a mensagem para o backend
        const response = await axios.post('https://tetochat-8m0r.onrender.com/send', {
          toPhone: selectedContact.phone,
          text: newMessage,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
  
        if (response.status === 200) {
          // Salvar a mensagem na tabela correta de chat do usuário logado
          await axios.post('https://tetochat-8m0r.onrender.com/saveMessage', {
            contactId: selectedContact.id,
            message: newMessage,
            message_from: 'me'
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
  
          fetchChats(); // Atualizar os chats do usuário
          setNewMessage(''); // Limpar o campo de nova mensagem
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    }
  };
  

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleTransferClick = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleTransferComplete = () => {
    setQueueContacts(queueContacts.filter(contact => contact.id !== selectedContact.id));
    setSelectedContact(null);
    setShowModal(false);
  };

  const handleContactClick = async (contact) => {
    setSelectedContact(contact);
    setShowModal(false);

    // Carrega as mensagens do contato ao clicar em "Contatos"
    await loadMessages(contact.id);

    // Garante que o contato será adicionado na aba "Chat" apenas se não estiver lá
    if (!chatContacts.some(c => c.id === contact.id)) {
      setChatContacts((prevChats) => [...prevChats, contact]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <div className="flex-shrink-0 w-1/4 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex relative">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-1/3 p-2 relative ${activeTab === 'chat' ? 'text-red-500' : 'text-gray-500'}`}
            >
              Chat
              {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />}
            </button>
            <button
              onClick={() => setActiveTab('fila')}
              className={`w-1/3 p-2 relative ${activeTab === 'fila' ? 'text-red-500' : 'text-gray-500'}`}
            >
              Fila
              {activeTab === 'fila' && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />}
            </button>
            <button
              onClick={() => setActiveTab('contatos')}
              className={`w-1/3 p-2 relative ${activeTab === 'contatos' ? 'text-red-500' : 'text-gray-500'}`}
            >
              Contatos
              {activeTab === 'contatos' && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />}
            </button>
          </div>
          <div className="flex-grow p-2 overflow-y-auto">
            <ul>
              {(activeTab === 'chat' ? chatContacts : activeTab === 'fila' ? queueContacts : contacts).map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleContactClick(contact)}
                >
                  <img src={contact.profilePic || defaultProfilePic} alt={contact.name} className="w-10 h-10 rounded-full mr-2" />
                  <div>
                    <div className="font-bold">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.lastMessage}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-grow flex flex-col" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }}>
          {selectedContact && (
            <div className="w-full p-2 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="text-lg ml-10 font-bold">{selectedContact.name}</div>
              <div className="flex items-center mr-6 space-x-4">
                <FiPhoneForwarded size={20} onClick={() => handleTransferClick(selectedContact)} />
                <FiMoreVertical size={20} />
              </div>
            </div>
          )}
          <div className="flex-grow p-2 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-xs px-2 py-1 my-1 rounded-lg ${message.message_from === 'me' ? 'ml-auto bg-green-200 text-black' : 'mr-auto bg-blue-200 text-black'}`}>
                <div>{message.message_body}</div>
                <div className="text-[10px] text-gray-500 text-right">
                  {format(new Date(message.message_timestamp * 1000), 'HH:mm')}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center p-4 bg-white border-t border-gray-200 relative">
            <button 
              className="p-2 text-gray-500"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FiSmile size={24} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-14">
                <EmojiPicker onEmojiClick={(event, emojiObject) => handleEmojiClick(event, emojiObject)} />
              </div>
            )}
            <button className="p-2 text-gray-500">
              <AiOutlineThunderbolt size={24} />
            </button>
            <button className="p-2 text-gray-500">
              <FiPaperclip size={24} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem"
              className="flex-grow p-2 mx-2 border rounded-full"
            />
            <button className="p-2 text-gray-500">
              <FiMic size={24} />
            </button>
          </div>
        </div>
      </div>
      {selectedContact && (
        <TransferModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onTransfer={handleTransferComplete}
          contactId={selectedContact.id}
        />
      )}
    </div>
  );
};

export default Chat;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPhoneForwarded, FiSmile, FiPaperclip, FiMic, FiMoreVertical } from 'react-icons/fi';
import { AiOutlineThunderbolt } from 'react-icons/ai'; // Ícone de raio
import Header from '../components/header';
import TransferModal from '../components/modalChat'; // Importando o TransferModal
import { io } from 'socket.io-client';
import backgroundImage from '../assets/image.png';
import EmojiPicker from 'emoji-picker-react';

const socket = io('https://tetochat-8m0r.onrender.com'); // Ajuste para o endereço correto do seu servidor

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // Para controlar as abas
  const loggedUser = { departmentId: 1 }; // Exemplo de usuário logado (substitua conforme necessário)

  // Função para adicionar o emoji ao campo de mensagem
  const handleEmojiClick = (event, emojiObject) => {
    if (emojiObject && emojiObject.emoji) {
      setNewMessage(prevInput => prevInput + emojiObject.emoji);
    }
    setShowEmojiPicker(false); // Fecha o emoji picker após selecionar um emoji
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get(`https://tetochat-8m0r.onrender.com/chats?department=${loggedUser.departmentId}&status=respondida`);
        setContacts(response.data);
      } catch (error) {
        console.error('Erro ao buscar chats:', error);
      }
    };
  
    const fetchQueue = async () => {
      try {
        const response = await axios.get(`https://tetochat-8m0r.onrender.com/queue?department=${loggedUser.departmentId}&status=fila`);
        setContacts(response.data);
      } catch (error) {
        console.error('Erro ao buscar fila:', error);
      }
    };
  
    const fetchContacts = async () => {
      try {
        const response = await axios.get('https://tetochat-8m0r.onrender.com/contacts');
        setContacts(response.data);
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
      }
    };
  
    if (activeTab === 'chat') {
      fetchChats();
    } else if (activeTab === 'fila') {
      fetchQueue();
    } else if (activeTab === 'contatos') {
      fetchContacts();
    }
  }, [activeTab]);
  
  

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

  useEffect(() => {
    socket.on('new_message', (message) => {
      if (message.contact_id === selectedContact?.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [selectedContact]);

  const handleSendMessage = async () => {
    if (selectedContact && newMessage.trim() !== '') {
      try {
        // Envia a mensagem para o backend
        const response = await axios.post('https://tetochat-8m0r.onrender.com/send', {
          toPhone: selectedContact.phone,
          text: newMessage,
        });
  
        if (response.status === 200) {
          setNewMessage(''); // Limpa o campo de nova mensagem
          console.log('Mensagem enviada com sucesso');
  
          // Verifique se o contato já está na lista de chats
          if (!contacts.find(contact => contact.id === selectedContact.id)) {
            setContacts([...contacts, selectedContact]); // Adicione o contato à lista de chats
          }
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
    setShowModal(true); // Ativa o modal
  };

  const handleTransferComplete = () => {
    // Filtra o contato transferido da lista de contatos
    setContacts(contacts.filter(contact => contact.id !== selectedContact.id));

    // Depois de transferir o contato, defina o selectedContact como null
    setSelectedContact(null);

    // Fecha o modal após a transferência
    setShowModal(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        {/* Coluna esquerda com as abas de Chat, Fila e Contatos */}
        <div className="flex-shrink-0 w-1/4 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-1/3 p-2 ${activeTab === 'chat' ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('fila')}
              className={`w-1/3 p-2 ${activeTab === 'fila' ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
            >
              Fila
            </button>
            <button
              onClick={() => setActiveTab('contatos')}
              className={`w-1/3 p-2 ${activeTab === 'contatos' ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
            >
              Contatos
            </button>
          </div>
          <div className="flex-grow p-2 overflow-y-auto">
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
        {/* Coluna direita com o chat */}
        <div className="flex-grow flex flex-col" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }}>
          {/* Div para exibir o nome do contato */}
          {selectedContact && (
            <div className="w-full p-2 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="text-lg ml-10 font-bold">{selectedContact.name}</div>
              <div className="flex items-center mr-6 space-x-4">
                <FiPhoneForwarded size={20} onClick={() => handleTransferClick(selectedContact)} />
                <FiMoreVertical size={20} />
              </div>
            </div>
          )}
          {/* Div para exibir as mensagens */}
          <div className="flex-grow p-4 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-xs p-3 my-2 rounded-lg ${message.message_from === 'me' ? 'ml-auto bg-green-200 text-black' : 'mr-auto bg-blue-200 text-black'}`}>
                {message.message_body}
              </div>
            ))}
          </div>
          {/* Div para enviar nova mensagem */}
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
      {/* Modal de Transferência */}
      {selectedContact && (
        <TransferModal
          isOpen={showModal} // Passe a prop isOpen em vez de show
          onClose={() => setShowModal(false)}
          onTransfer={handleTransferComplete}
          contactId={selectedContact.id}
        />
      )}
    </div>
  );
};

export default Chat;

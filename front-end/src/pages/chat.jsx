/*
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiPhoneForwarded,
  FiSmile,
  FiPaperclip,
  FiMic,
  FiMoreVertical,
} from "react-icons/fi";
import { AiOutlineThunderbolt } from "react-icons/ai";
import Header from "../components/header";
import TransferModal from "../components/modalChat";
import { io } from "socket.io-client";
import backgroundImage from "../assets/image.png";
import EmojiPicker from "emoji-picker-react";
import { format } from "date-fns";
import defaultProfilePic from "../assets/defaultProfile.png";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:3005");

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [chatContacts, setChatContacts] = useState([]);
  const [queueContacts, setQueueContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("contatos");
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("update_queue", (data) => {
      fetchQueue(); // Atualiza a fila
    });

    return () => {
      socket.off("update_queue");
    };
  }, []);

  const loadMessages = async (contactId) => {
    try {
      const response = await axios.get(
        `http://localhost:3005/messages?contactId=${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Filtrar mensagens pelo contato selecionado
      setMessages(response.data.filter(message => message.contact_id === contactId));
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    }
  };
  

  const fetchChats = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3005/getUserChats?userId=${localStorage.getItem(
          "userId"
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const fetchedChats = Array.isArray(response.data) ? response.data : [];

      const uniqueChats = fetchedChats.filter(
        (chat) => chat.user_id === localStorage.getItem("userId")
      );

      setChatContacts((prevChats) => [...prevChats, ...uniqueChats]);
    } catch (error) {
      console.error("Erro ao buscar chats:", error);
    }
  };

  const fetchQueue = async () => {
    try {
      const departmentTable = `${localStorage.getItem("department")}`;
      console.log(departmentTable);
      
      const response = await axios.get(
        `http://localhost:3005/queue/${departmentTable}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setQueueContacts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar fila:", error);
      setQueueContacts([]);
    }
  };
  

  const fetchContacts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3005/contacts",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setContacts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
      setContacts([]);
    }
  };

  useEffect(() => {
    if (activeTab === "chat") {
      fetchChats();
    } else if (activeTab === "fila") {
      fetchQueue();
    } else if (activeTab === "contatos") {
      fetchContacts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    } else {
      setMessages([]); // Limpa as mensagens ao trocar de contato
    }
  }, [selectedContact]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      // Verificar se a mensagem recebida é para o contato atualmente selecionado
      if (selectedContact && message.contact_id === selectedContact.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedContact]);
  
  const handleSendMessage = async () => {
    if (selectedContact && newMessage.trim() !== "") {
      const sentMessage = {
        id: `msg-${Date.now()}`,
        message_body: newMessage,
        message_from: "me",
        message_timestamp: Math.floor(Date.now() / 1000).toString(),
        contact_id: selectedContact.id,
      };
  
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
  
      try {
        // Enviar a mensagem ao backend
        const response = await axios.post(
          "http://localhost:3005/send",
          {
            toPhone: selectedContact.phone,
            text: newMessage,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Token JWT enviado no cabeçalho
            },
          }
        );
        console.log(response);
        
        if (response.status === 200) {
          setNewMessage(""); // Limpa o campo de nova mensagem
          fetchChats(); // Atualiza as conversas após enviar a mensagem
        }
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  };
  
    const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleTransferClick = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleTransferComplete = async (selectedDepartmentId) => {
    try {
      // Enviar o contato para outro departamento
      await axios.post(
        "http://localhost:3005/transfer",
        {
          contactId: selectedContact.id,
          departmentId: selectedDepartmentId.selectedDepartment, // id do departamento selecionado
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Atualizar a fila e a lista de chats localmente
      setQueueContacts((prevQueue) =>
        prevQueue.filter((contact) => contact.id !== selectedContact.id)
      );
      setChatContacts((prevChats) =>
        prevChats.filter((contact) => contact.id !== selectedContact.id)
      );
      setSelectedContact(null);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao transferir contato:", error);
    }
  };
  

  const handleContactClick = async (contact) => {
    setSelectedContact(contact);
    setShowModal(false);
    await loadMessages(contact.id);

    if (!chatContacts.some((c) => c.id === contact.id)) {
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
              onClick={() => setActiveTab("chat")}
              className={`w-1/3 p-2 relative ${
                activeTab === "chat" ? "text-red-500  " : "text-gray-500"
              }`}
            >
              Chat
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("fila")}
              className={`w-1/3 p-2 relative ${
                activeTab === "fila" ? "text-red-500" : "text-gray-500"
              }`}
            >
              Fila
              {activeTab === "fila" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("contatos")}
              className={`w-1/3 p-2 relative ${
                activeTab === "contatos" ? "text-red-500" : "text-gray-500"
              }`}
            >
              Contatos
              {activeTab === "contatos" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
              )}
            </button>
          </div>

          <div className="overflow-y-auto flex-grow">
            {activeTab === "chat" && (
              <div>
                {chatContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${
                      selectedContact?.id === contact.id
                        ? "bg-gray-200"
                        : "bg-white"
                    }`}
                  >
                    <img
                      src={defaultProfilePic}
                      alt="Profile"
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {contact.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "fila" && (
              <div>
                {queueContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${
                      selectedContact?.id === contact.id
                        ? "bg-gray-200"
                        : "bg-white"
                    }`}
                  >
                    <img
                      src={defaultProfilePic}
                      alt="Profile"
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {contact.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "contatos" && (
              <div>
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${
                      selectedContact?.id === contact.id
                        ? "bg-gray-200"
                        : "bg-white"
                    }`}
                  >
                    <img
                      src={defaultProfilePic}
                      alt="Profile"
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {contact.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col w-full bg-gray-100 relative">
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-white h-14 flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={defaultProfilePic}
                    alt="Profile"
                    className="h-10 w-10 rounded-full mr-3"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">
                      {selectedContact.name}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => handleTransferClick(selectedContact)}
                  >
                    <FiPhoneForwarded size={24} />
                  </button>
                  <button className="text-gray-500 hover:text-gray-700">
                    <FiMoreVertical size={24} />
                  </button>
                </div>
              </div>

              <div
                className="flex-grow p-4 overflow-y-auto bg-white"
                style={{
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="flex flex-col space-y-4 ">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${
                        message.message_from === "me"
                          ? "self-end bg-blue-100"
                          : "self-start bg-gray-200"
                      } p-2 rounded-md max-w-xs`}
                    >
                      <span className="text-sm">{message.message_body}</span>
                      <span className="text-xs text-gray-500 block memt-1">
                        {format(
                          new Date(parseInt(message.message_timestamp) * 1000),
                          "HH:mm"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center p-4 bg-white border-t border-gray-200">
                <button
                  className="text-gray-500 hover:text-gray-700 mr-3"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <FiSmile size={24} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-10 z-50">
                    <EmojiPicker
                      onEmojiClick={(event, emojiObject) =>
                        setNewMessage(newMessage + emojiObject.emoji)
                      }
                    />
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Digite uma mensagem..."
                  className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />

                <button
                  className="text-gray-500 hover:text-gray-700 ml-3"
                  onClick={handleSendMessage}
                >
                  <FiPaperclip size={24} />
                </button>

                <button
                  className="text-gray-500 hover:text-gray-700 ml-3"
                  onClick={handleSendMessage}
                >
                  <FiMic size={24} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-500">
                Selecione um contato para começar a conversar
              </span>
            </div>
          )}
        </div>
      </div>
      {selectedContact? 
      <TransferModal
        contactId={selectedContact.id}

        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTransfer={handleTransferComplete}
      />
    :
    <TransferModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTransfer={handleTransferComplete}
      />}
    </div>
  );
};

export default Chat;
*/

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiPhoneForwarded,
  FiSmile,
  FiPaperclip,
  FiMic,
  FiMoreVertical,
} from "react-icons/fi";
import Header from "../components/header";
import TransferModal from "../components/modalChat";
import { io } from "socket.io-client";
import backgroundImage from "../assets/image.png";
import EmojiPicker from "emoji-picker-react";
import { format } from "date-fns";
import defaultProfilePic from "../assets/defaultProfile.png";

const socket = io("http://localhost:3005");

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [chatContacts, setChatContacts] = useState([]);
  const [queueContacts, setQueueContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("contatos");

  useEffect(() => {
    socket.on("update_queue", (data) => {
      fetchQueue(); // Atualiza a fila
    });
    return () => {
      socket.off("update_queue");
    };
  }, []);

  const loadMessages = async (contactId) => {
    try {
      const response = await axios.get(
        `http://localhost:3005/messages?contactId=${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Filtrar mensagens pelo contato selecionado
      setMessages(response.data.filter(message => message.contact_id === contactId));
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    }
  };
  

  const fetchChats = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3005/getUserChats?userId=${localStorage.getItem(
          "userId"
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const fetchedChats = Array.isArray(response.data) ? response.data : [];

      const uniqueChats = fetchedChats.filter(
        (chat) => chat.user_id === localStorage.getItem("userId")
      );

      setChatContacts((prevChats) => [...prevChats, ...uniqueChats]);
    } catch (error) {
      console.error("Erro ao buscar chats:", error);
    }
  };

  const fetchQueue = async () => {
    try {
      const departmentTable = `${localStorage.getItem("department")}`;
      console.log(departmentTable);
      
      
      const response = await axios.get(
        `http://localhost:3005/queue/${departmentTable}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setQueueContacts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar fila:", error);
      setQueueContacts([]);
    }
  };
  

  const fetchContacts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3005/contacts",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setContacts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
      setContacts([]);
    }
  };

  useEffect(() => {
    if (activeTab === "chat") {
      fetchChats();
    } else if (activeTab === "fila") {
      fetchQueue();
    } else if (activeTab === "contatos") {
      fetchContacts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    } else {
      setMessages([]); // Limpa as mensagens ao trocar de contato
    }
  }, [selectedContact]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      // Verificar se a mensagem recebida é para o contato atualmente selecionado
      if (selectedContact && message.contact_id === selectedContact.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedContact]);
  
  const handleSendMessage = async () => {
    if (selectedContact && newMessage.trim() !== "") {
      const sentMessage = {
        id: `msg-${Date.now()}`,
        message_body: newMessage,
        message_from: "me",
        message_timestamp: Math.floor(Date.now() / 1000).toString(),
        contact_id: selectedContact.id,
      };
  
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
  
      try {
        // Enviar a mensagem ao backend
        const response = await axios.post(
          "http://localhost:3005/send",
          {
            toPhone: selectedContact.phone,
            text: newMessage,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Token JWT enviado no cabeçalho
            },
          }
        );
        console.log(response);
        
        if (response.status === 200) {
          setNewMessage(""); // Limpa o campo de nova mensagem
          fetchChats(); // Atualiza as conversas após enviar a mensagem
        }
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  };
  
    const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleTransferClick = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleTransferComplete = async (selectedDepartmentId) => {
    try {
      // Enviar o contato para outro departamento
      await axios.post(
        "http://localhost:3005/transfer",
        {
          contactId: selectedContact.id,
          departmentId: selectedDepartmentId.selectedDepartment, // id do departamento selecionado
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Atualizar a fila e a lista de chats localmente
      setQueueContacts((prevQueue) =>
        prevQueue.filter((contact) => contact.id !== selectedContact.id)
      );
      setChatContacts((prevChats) =>
        prevChats.filter((contact) => contact.id !== selectedContact.id)
      );
      setSelectedContact(null);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao transferir contato:", error);
    }
  };
  

  const handleContactClick = async (contact) => {
    setSelectedContact(contact);
    setShowModal(false);
    await loadMessages(contact.id);

    if (!chatContacts.some((c) => c.id === contact.id)) {
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
              onClick={() => setActiveTab("chat")}
              className={`w-1/3 p-2 relative ${
                activeTab === "chat" ? "text-red-500  " : "text-gray-500"
              }`}
            >
              Chat
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("fila")}
              className={`w-1/3 p-2 relative ${
                activeTab === "fila" ? "text-red-500" : "text-gray-500"
              }`}
            >
              Fila
              {activeTab === "fila" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("contatos")}
              className={`w-1/3 p-2 relative ${
                activeTab === "contatos" ? "text-red-500" : "text-gray-500"
              }`}
            >
              Contatos
              {activeTab === "contatos" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
              )}
            </button>
          </div>

          <div className="overflow-y-auto flex-grow">
            {activeTab === "chat" && (
              <div>
                {chatContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${
                      selectedContact?.id === contact.id
                        ? "bg-gray-200"
                        : "bg-white"
                    }`}
                  >
                    <img
                      src={defaultProfilePic}
                      alt="Profile"
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {contact.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "fila" && (
              <div>
                {queueContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${
                      selectedContact?.id === contact.id
                        ? "bg-gray-200"
                        : "bg-white"
                    }`}
                  >
                    <img
                      src={defaultProfilePic}
                      alt="Profile"
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {contact.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "contatos" && (
              <div>
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${
                      selectedContact?.id === contact.id
                        ? "bg-gray-200"
                        : "bg-white"
                    }`}
                  >
                    <img
                      src={defaultProfilePic}
                      alt="Profile"
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {contact.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col w-full bg-gray-100 relative">
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-white h-14 flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={defaultProfilePic}
                    alt="Profile"
                    className="h-10 w-10 rounded-full mr-3"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">
                      {selectedContact.name}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => handleTransferClick(selectedContact)}
                  >
                    <FiPhoneForwarded size={24} />
                  </button>
                  <button className="text-gray-500 hover:text-gray-700">
                    <FiMoreVertical size={24} />
                  </button>
                </div>
              </div>

              <div
                className="flex-grow p-4 overflow-y-auto bg-white"
                style={{
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="flex flex-col space-y-4 ">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${
                        message.message_from === "me"
                          ? "self-end bg-blue-100"
                          : "self-start bg-gray-200"
                      } p-2 rounded-md max-w-xs`}
                    >
                      <span className="text-sm">{message.message_body}</span>
                      <span className="text-xs text-gray-500 block memt-1">
                        {format(
                          new Date(parseInt(message.message_timestamp) * 1000),
                          "HH:mm"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center p-4 bg-white border-t border-gray-200">
                <button
                  className="text-gray-500 hover:text-gray-700 mr-3"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <FiSmile size={24} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-10 z-50">
                    <EmojiPicker
                      onEmojiClick={(event, emojiObject) =>
                        setNewMessage(newMessage + emojiObject.emoji)
                      }
                    />
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Digite uma mensagem..."
                  className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />

                <button
                  className="text-gray-500 hover:text-gray-700 ml-3"
                  onClick={handleSendMessage}
                >
                  <FiPaperclip size={24} />
                </button>

                <button
                  className="text-gray-500 hover:text-gray-700 ml-3"
                  onClick={handleSendMessage}
                >
                  <FiMic size={24} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-500">
                Selecione um contato para começar a conversar
              </span>
            </div>
          )}
        </div>
      </div>
      {selectedContact? 
      <TransferModal
        contactId={selectedContact.id}

        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTransfer={handleTransferComplete}
      />
    :
    <TransferModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTransfer={handleTransferComplete}
      />}
    </div>
  );
};

export default Chat;
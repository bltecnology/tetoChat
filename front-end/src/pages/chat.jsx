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

const socket = io("https://tetochat-8m0r.onrender.com");

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
  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "https://tetochat-8m0r.onrender.com/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setLoggedUser(response.data);
      } catch (error) {
        console.error("Erro na validação do token:", error);
        navigate("/login");
      }
    };

    validateToken();
  }, [navigate]);

  useEffect(() => {
    socket.on('update_queue', (data) => {
      fetchQueue(); // Atualiza a fila
    });
  
    return () => {
      socket.off('update_queue');
    };
  }, [loggedUser]);
  

  const loadMessages = async (contactId) => {
    try {
      const response = await axios.get(
        `https://tetochat-8m0r.onrender.com/messages?contact=${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    }
  };

  const fetchChats = async () => {
    if (!loggedUser || !loggedUser.id) {
      console.error("Usuário não está logado ou o id não está disponível.");
      return;
    }

    try {
      const response = await axios.get(
        `https://tetochat-8m0r.onrender.com/getUserChats?userId=${loggedUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const fetchedChats = Array.isArray(response.data) ? response.data : [];

      const uniqueChats = fetchedChats.filter(
        (chat) => chat.user_id === loggedUser.id
      );

      setChatContacts((prevChats) => [...prevChats, ...uniqueChats]);
    } catch (error) {
      console.error("Erro ao buscar chats:", error);
    }
  };

  const fetchQueue = async () => {
    if (!loggedUser || !loggedUser.department) {
      console.error("Usuário não está logado ou o departamento não está disponível.");
      return;
    }
  
    try {
      const departmentTable = `queueOf${loggedUser.department}`;
      const response = await axios.get(
        `https://tetochat-8m0r.onrender.com/queue/${departmentTable}`,
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
        "https://tetochat-8m0r.onrender.com/contacts",
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
  }, [activeTab, loggedUser]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    socket.on("new_message", (message) => {
      if (message.contact_id === selectedContact?.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }

      if (!chatContacts.some((c) => c.id === message.contact_id)) {
        const updatedContact = contacts.find(
          (contact) => contact.id === message.contact_id
        );
        if (updatedContact) {
          setChatContacts((prevChats) => [...prevChats, updatedContact]);
        }
      }
    });

    return () => {
      socket.off("new_message");
    };
  }, [selectedContact, chatContacts, contacts]);

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
        const response = await axios.post(
          "https://tetochat-8m0r.onrender.com/send",
          {
            toPhone: selectedContact.phone,
            text: newMessage,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.status === 200) {
          await axios.post(
            "https://tetochat-8m0r.onrender.com/saveMessage",
            {
              contactId: selectedContact.id,
              message: newMessage,
              message_from: "me",
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setNewMessage("");
          fetchChats();
        }
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }

      setNewMessage("");
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
        // Chama o endpoint de transferência
        await axios.post(
            "https://tetochat-8m0r.onrender.com/transfer",
            {
                contactId: selectedContact.id,
                departmentId: selectedDepartmentId, // Supondo que você tenha o id do departamento no modal
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );

        // Remove o contato da fila e do chat localmente
        setQueueContacts((prevQueue) => 
            prevQueue.filter((contact) => contact.id !== selectedContact.id)
        );

        setChatContacts((prevChats) => 
            prevChats.filter((contact) => contact.id !== selectedContact.id)
        );

        // Reseta a seleção e fecha o modal
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
                activeTab === "chat" ? "text-red-500" : "text-gray-500"
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

          <div className="flex-grow p-2 overflow-y-auto">
            <ul>
              {(activeTab === "chat"
                ? chatContacts
                : activeTab === "fila"
                ? queueContacts
                : contacts
              ).map((contact) => (
                <li
                  key={contact.contact_id}
                  className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleContactClick(contact)}
                >
                  <img
                    src={contact.profilePic || defaultProfilePic}
                    alt={contact.contact_id}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <div>
                    <div className="font-bold">{contact.name}</div>
                    {activeTab === "fila" && (
                      <div className="text-sm text-gray-600">
                        Última mensagem: {contact.message_body}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col flex-grow">
          {selectedContact ? (
            <div className="flex flex-col h-full">
              <div className="bg-white shadow p-4 flex justify-between items-center h-12">
                <div className="flex items-center">
                  <img
                    src={selectedContact.profilePic || defaultProfilePic}
                    alt={selectedContact.contact_id}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <div className="font-bold">{selectedContact.name}</div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 rounded-full hover:bg-gray-200"
                  onClick={() => setShowModal(true)}
                  >
                    <FiPhoneForwarded size={24} />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-200">
                    <FiMoreVertical size={24} />
                  </button>
                </div>
              </div>

              <div
                className="flex-grow p-2 overflow-y-auto"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-xs px-2 py-1 my-1 rounded-lg break-words ${
                      message.message_from === "me"
                        ? "ml-auto bg-green-200 text-black"
                        : "mr-auto bg-blue-200 text-black"
                    }`}
                  >
                    <div>{message.message_body}</div>
                    <div className="text-[10px] text-gray-500 text-right">
                      {format(
                        new Date(message.message_timestamp * 1000),
                        "HH:mm"
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-4 flex items-center">
                  <button
                    className="p-2 rounded-full hover:bg-gray-200"
                  >
                    <AiOutlineThunderbolt size={24} />
                  </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-200"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <FiSmile size={24} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-4">
                    <EmojiPicker
                      onEmojiClick={(event, emojiObject) =>
                        setNewMessage(newMessage + emojiObject.emoji)
                      }
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-grow mx-4 p-2 border rounded-full"
                  placeholder="Digite uma mensagem..."
                />
                <button
                  className="p-2 rounded-full hover:bg-gray-200"
                  onClick={() => alert("Em desenvolvimento")}
                >
                  <FiPaperclip size={24} />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-200"
                  onClick={handleSendMessage}
                >
                  <FiMic size={24} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Selecione um contato para iniciar a conversa.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TransferModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onComplete={handleTransferComplete}
          contact={selectedContact}
        />
      )}
    </div>
  );
};

export default Chat;

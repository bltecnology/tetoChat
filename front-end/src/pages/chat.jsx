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

  useEffect(() => {
    socket.on('update_queue', (data) => {
      fetchQueue(); // Atualiza a fila
    });
  
    return () => {
      socket.off('update_queue');
    };
  }, []);
  
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
    try {
      const response = await axios.get(
        `https://tetochat-8m0r.onrender.com/getUserChats?userId=${localStorage.getItem("userId")}`,
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
      const departmentTable = `queueOf${localStorage.getItem("department")}`;
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
  }, [activeTab]);

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
          <div className="flex-grow overflow-y-auto">
            {activeTab === "chat" &&
              chatContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactClick(contact)}
                  className={`flex items-center p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100`}
                >
                  <img
                    src={defaultProfilePic}
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <div className="flex-grow">
                    <div className="font-semibold">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.phone}</div>
                  </div>
                </div>
              ))}
            {activeTab === "fila" &&
              queueContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100`}
                >
                  <img
                    src={defaultProfilePic}
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <div className="flex-grow">
                    <div className="font-semibold">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.phone}</div>
                  </div>
                  <button
                    onClick={() => handleTransferClick(contact)}
                    className="text-blue-500 hover:underline"
                  >
                    Transferir
                  </button>
                </div>
              ))}
            {activeTab === "contatos" &&
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactClick(contact)}
                  className={`flex items-center p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100`}
                >
                  <img
                    src={defaultProfilePic}
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <div className="flex-grow">
                    <div className="font-semibold">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.phone}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="flex-grow bg-gray-50 p-4 flex flex-col">
          {selectedContact ? (
            <>
              <div className="flex-grow overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-2 ${
                      msg.message_from === "me" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block px-3 py-1 rounded-full ${
                        msg.message_from === "me"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      {msg.message_body}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(msg.message_timestamp * 1000), "HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="p-2 text-gray-500"
                >
                  <FiSmile />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onEmojiClick={(emoji) => {
                      setNewMessage((prev) => prev + emoji.emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="absolute z-10"
                  />
                )}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-grow p-2 border border-gray-300 rounded"
                  placeholder="Digite uma mensagem..."
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 text-gray-500"
                >
                  <FiPaperclip />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="p-2 text-gray-500"
                >
                  <FiMic />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="p-2 text-gray-500"
                >
                  <AiOutlineThunderbolt />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="p-2 text-gray-500"
                >
                  <FiMoreVertical />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500">Selecione um contato para iniciar o chat.</p>
            </div>
          )}
        </div>
      </div>
      <TransferModal
        showModal={showModal}
        setShowModal={setShowModal}
        onTransferComplete={handleTransferComplete}
        selectedContact={selectedContact}
      />
    </div>
  );
};

export default Chat;

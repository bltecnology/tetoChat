import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiPhoneForwarded,
  FiSmile,
  FiPaperclip,
  FiSend,
  FiMoreVertical,
  FiDownload,
} from "react-icons/fi";
import Header from "../components/header";
import TransferModal from "../components/modalChat";
import { io } from "socket.io-client";
import backgroundImage from "../assets/image.png";
import EmojiPicker from "emoji-picker-react";
import { format } from "date-fns";
import defaultProfilePic from "../assets/defaultProfile.png";

const socket = io("https://tetochat-backend.onrender.com");

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
  const [imageUrls, setImageUrls] = useState({})
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [audioUrls, setAudioUrls] = useState({});
  const [documentUrls, setDocumentUrls] = useState({});
  const [documentNames, setDocumentNames] = useState({});
  const [quickResponses, setQuickResponses] = useState({});
  const [videoUrls, setVideoUrls] = useState({});

  const handleImageClick = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  // 1. Criar uma referência para o final do container de mensagens
  const messagesEndRef = useRef(null);

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
        `https://tetochat-backend.onrender.com/messages?contactId=${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Filtrar mensagens pelo contato selecionado

      setMessages(response.data.filter(message => message.contact_id === contactId));
      scrollToBottom(); // Rola automaticamente após carregar mensagens
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    }
  };


  const fetchChats = async () => {
    const department = localStorage.getItem("department");

    try {
      const response = await axios.get(
        `https://tetochat-backend.onrender.com/getUserChats/${department}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const fetchedChats = Array.isArray(response.data) ? response.data : [];
      setChatContacts(fetchedChats);  // Atualiza os contatos do chat
    } catch (error) {
      console.error("Erro ao buscar chats:", error);
    }
  };


  const fetchQueue = async () => {
    try {
      const departmentTable = `${localStorage.getItem("department")}`;


      const response = await axios.get(
        `https://tetochat-backend.onrender.com/queue/${departmentTable}`,
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
        "https://tetochat-backend.onrender.com/contacts",
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

  // 2. Função para rolar automaticamente para o fim das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    } else {
      setMessages([]); // Limpa as mensagens ao trocar de contato
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom(); // Rola para o final sempre que as mensagens são atualizadas
  }, [messages]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      // Verificar se a mensagem recebida é para o contato atualmente selecionado
      if (selectedContact && message.contact_id === selectedContact.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
        scrollToBottom(); // Rola para o final ao receber nova mensagem
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedContact]);
  const fetchImage = async (messageId) => {
    if (!imageUrls[messageId]) {
      try {
        const response = await axios.get(
          `https://tetochat-backend.onrender.com/file/${messageId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            responseType: "blob",
          }
        );
        const imageUrl = URL.createObjectURL(response.data);
        setImageUrls((prevUrls) => ({ ...prevUrls, [messageId]: imageUrl })); // Armazena a URL da imagem com base no ID da mensagem
      } catch (error) {
        console.error("Erro ao buscar imagem:", error);
      }
    }
  };

  const fetchQuickResponses = async () => {
    try {
      const response = await axios.get(
        `https://tetochat-backend.onrender.com/quickResponses`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        }
      );
      const departament = response.data
      const filterDepartamentFull = departament.filter((departament) => departament.name === localStorage.department)
      const filterDepartament = filterDepartamentFull.filter((departament) => departament.text)
      setQuickResponses(filterDepartament);
    } catch (error) {
      console.error('Erro ao buscar respostas rápidas:', error);
    }
  }
  const fetchDocument = async (messageId, fileName) => {
    if (!documentUrls[messageId]) {
      try {
        const response = await axios.get(
          `https://tetochat-backend.onrender.com/file/${messageId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            responseType: "blob", // Garante que o arquivo seja baixado como blob
          }
        );
        const fileNameString = String(fileName);

        // const newFileName = fileNameString
        //   .replace(/[\[\]]/g, "") // Remove todos os colchetes
        //   .split("nome: ")[1]      // Separa a string e pega a parte após "nome: "
        //   .trim();


        console.log(fileNameString);

        // Obtém a extensão do arquivo a partir do nome do arquivo original
        const fileExtension = fileNameString.split('.').pop().toLowerCase();

        // Define o tipo MIME com base na extensão do arquivo
        let mimeType;
        switch (fileExtension) {
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'xlsx':
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          default:
            mimeType = 'application/octet-stream'; // Tipo genérico
        }

        const blob = new Blob([response.data], { type: mimeType });
        const documentUrl = URL.createObjectURL(blob);

        setDocumentUrls((prevUrls) => ({ ...prevUrls, [messageId]: documentUrl }));
        setDocumentNames((prevNames) => ({ ...prevNames, [messageId]: fileNameString }));
      } catch (error) {
        console.error("Erro ao buscar documento:", error);
      }
    }
  };


  // Função para forçar o download do documento
  const handleDocumentDownload = (messageId) => {
    const url = documentUrls[messageId];
    const fileNames = documentNames[messageId] || 'downloaded_file';
    const fileName = fileNames.replace(/[\[\]]/g, "")
    // Cria um link <a> programaticamente e força o clique
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const fetchAudio = async (messageId) => {
    if (!audioUrls[messageId]) {
      try {
        const response = await axios.get(
          `https://tetochat-backend.onrender.com/file/${messageId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            responseType: "blob", // Especifica que a resposta é um blob (arquivo binário)
          }
        );
        const audioUrl = URL.createObjectURL(response.data);
        setAudioUrls((prevUrls) => ({ ...prevUrls, [messageId]: audioUrl })); // Armazena a URL do áudio
      } catch (error) {
        console.error("Erro ao buscar áudio:", error);
      }
    }
  };

  // const handleAudioUpload = async (event) => {
  //   const file = event.target.files[0]; // Captura o arquivo selecionado
  //   if (!file || !selectedContact) return; // Certifica-se de que há um arquivo e um contato selecionado

  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("toPhone", selectedContact.phone);
  //   formData.append("whatsappBusinessAccountId", "408476129004761"); // Atualize com o ID correto
  //   formData.append("fileType", "audio");

  //   try {
  //     const response = await axios.post(
  //       "https://tetochat-backend.onrender.com/send-file", // Endpoint para envio de arquivos
  //       formData,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`, // Token JWT
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );

  //     if (response.status === 200) {
  //       const newMessage = {
  //         id: `msg-${Date.now()}`, // Gera um ID temporário
  //         message_body: file.name, // O nome do arquivo
  //         message_from: "me",
  //         message_type: "audio", // Tipo de mensagem
  //         message_timestamp: Math.floor(Date.now() / 1000).toString(),
  //         contact_id: selectedContact.id,
  //         message_id: response.data.message_id, // ID do backend
  //       };

  //       // Atualiza o estado com a nova mensagem
  //       setMessages((prevMessages) => [...prevMessages, newMessage]);

  //       // Carrega o áudio para exibição imediata
  //       fetchAudio(newMessage.message_id);

  //       scrollToBottom(); // Rola para o final do chat
  //     }
  //   } catch (error) {
  //     console.error("Erro ao enviar áudio:", error);
  //   }
  // };


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
      setNewMessage(""); // Limpa o campo de nova mensagem
      scrollToBottom();

      try {
        // Enviar a mensagem ao backend
        const response = await axios.post(
          "https://tetochat-backend.onrender.com/send",
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

        if (response.status === 200) {
          setNewMessage(""); // Limpa o campo de nova mensagem

          fetchChats(); // Atualiza as conversas após enviar a mensagem

          // Remover o contato da fila usando queueOut
          await axios.delete(
            `https://tetochat-backend.onrender.com/queue/${localStorage.getItem("department")}`,
            {
              data: { idContact: selectedContact.id },
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          // Atualizar o estado da fila localmente após a remoção
          setQueueContacts((prevQueue) =>
            prevQueue.filter((contact) => contact.id !== selectedContact.id)
          );
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
        "https://tetochat-backend.onrender.com/transfer",
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
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]; 
    const originalname = file.name
    const fileName = file.push(originalname)
    console.log(fileName);
    
    // Pega o primeiro arquivo selecionado
    if (!file || !selectedContact) return; // Verifica se existe um arquivo e um contato selecionado
    console.log(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("toPhone", selectedContact.phone);
    formData.append("whatsappBusinessAccountId", "408476129004761"); // Atualize com o ID correto
    formData.append("fileType", file.type.startsWith("image/") ? "image" : "document");

    try {
      const response = await axios.post(
        "https://tetochat-backend.onrender.com/send-file", // URL do endpoint
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Token JWT
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        // Opcional: Atualize as mensagens após enviar o arquivo
        loadMessages(selectedContact.id);
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
    }
  };

  const fetchVideo = async (messageId) => {
    if (!videoUrls[messageId]) {
      try {
        const response = await axios.get(
          `https://tetochat-backend.onrender.com/file/${messageId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            responseType: "blob", // Garante que o arquivo seja baixado como blob
          }
        );

        const videoUrl = URL.createObjectURL(response.data);
        setVideoUrls((prevUrls) => ({ ...prevUrls, [messageId]: videoUrl }));

        // Atualiza o estado da mensagem com a URL do vídeo
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.message_id === messageId
              ? { ...msg, videoUrl }
              : msg
          )
        );
      } catch (error) {
        console.error("Erro ao buscar vídeo:", error);
      }
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
              className={`w-1/3 p-2 relative ${activeTab === "chat" ? "text-red-500  " : "text-gray-500"
                }`}
            >
              Chat
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("fila")}
              className={`w-1/3 p-2 relative ${activeTab === "fila" ? "text-red-500" : "text-gray-500"
                }`}
            >
              Fila
              {activeTab === "fila" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("contatos")}
              className={`w-1/3 p-2 relative ${activeTab === "contatos" ? "text-red-500" : "text-gray-500"
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
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${selectedContact?.id === contact.id
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
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${selectedContact?.id === contact.id
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
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-100 flex ${selectedContact?.id === contact.id
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
                  {messages.map((message) => {
                    // Fetch image only if the message type is "image"
                    if (message.message_type === "image") {
                      fetchImage(message.message_id); // Carrega a imagem uma vez
                    } if (message.message_type === "audio") {
                      fetchAudio(message.message_id)
                    } if (message.message_type === "document") {
                      fetchDocument(message.message_id, message.message_body); // file_name contém o nome do arquivo
                    }
                    if (message.message_type === "video" && !videoUrls[message.message_id]) {
                      fetchVideo(message.message_id);
                    }

                    return (
                      <div
                        key={message.id}
                        className={`${message.message_from === "me" ? "self-end bg-blue-100" : "self-start bg-gray-200"
                          } p-2 rounded-md max-w-xs`}
                      >
                        {/* Renderiza imagem se existir */}
                        {message.message_type === "image" && imageUrls[message.message_id] && (

                          <img
                            src={imageUrls[message.message_id]}
                            alt=""
                            className="cursor-pointer"
                            onClick={() => handleImageClick(imageUrls[message.message_id])}
                          />
                        )}


                        {/* Renderiza áudio se existir */}
                        {message.message_type === "audio" && audioUrls[message.message_id] && (
                          <audio controls>
                            <source src={audioUrls[message.message_id]} type="audio/ogg" />
                            Seu navegador não suporta a reprodução de áudio.
                          </audio>
                        )}
                        {/* Renderiza áudio se existir */}
                        {message.message_type === "document" && documentUrls[message.message_id] && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{documentNames[message.message_id]}</span>
                            <button onClick={() => handleDocumentDownload(message.message_id)} className="text-gray-500 cursor-pointer">
                              <FiDownload size={20} />
                            </button>
                          </div>
                        )}
                        {message.message_type === "video" && videoUrls[message.message_id] && (
                          <video
                            controls
                            className="max-w-full max-h-80"
                            src={videoUrls[message.message_id]}
                          >
                            Seu navegador não suporta a reprodução de vídeos.
                          </video>
                        )}
                        {/* Exibe o corpo da mensagem de texto, se não for imagem ou áudio */}
                        {message.message_type !== "image" && message.message_type !== "audio" && message.message_type !== "document" && message.message_type !== "video" && (
                          <span className="text-sm">{message.message_body}</span>
                        )}
                        {/* Exibe o timestamp da mensagem */}
                        <span className="text-xs text-gray-500 block memt-1">
                          {format(new Date(parseInt(message.message_timestamp) * 1000), "HH:mm")}
                        </span>
                      </div>

                    );
                  })}
                  <div ref={messagesEndRef} /> {/* Referência ao final das mensagens */}
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
                      onEmojiClick={(emojiObject) =>
                        setNewMessage(newMessage + emojiObject.emoji) // Access emoji directly
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
                  <FiSend size={24} />
                </button>
                <button
                  className="text-gray-500 hover:text-gray-700 ml-3"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <FiPaperclip size={24} />
                </button>
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />

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
      {selectedContact ?
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
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsImageModalOpen(false)} // Fecha o modal ao clicar fora
        >
          <div
            className="relative bg-white p-4 rounded-lg"
            onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar dentro do modal
          >
            <img
              src={selectedImageUrl}
              alt="Imagem ampliada"
              className="max-w-screen h-auto max-h-screen" // Ajusta para ocupar até 80%
              style={{ maxWidth: "70vw", maxHeight: "80vh" }}
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-2 right-2 text-white text-2xl"
            >
              &times;
            </button>
            <a
              href={selectedImageUrl}
              download
              className="absolute bottom-2 right-2 text-white bg-gray-800 p-2 rounded"
            >
              <FiDownload size={24} /> Baixar
            </a>
          </div>
        </div>
      )}


    </div>

  );

};
export default Chat;

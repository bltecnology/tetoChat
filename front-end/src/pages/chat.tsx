import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiSend, FiMic, FiPaperclip } from 'react-icons/fi';
import Header from '../components/header';

interface Message {
  id: number;
  content: string;
  from_phone: string;
  to_phone: string;
  timestamp: string;
  type: string;
}

interface Contact {
  id: number;
  name: string;
  profilePic: string;
  lastMessage: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get('http://localhost:3005/messages');
        setMessages(response.data);
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      }
    };

    const fetchContacts = async () => {
      try {
        const response = await axios.get('http://localhost:3005/contacts');
        setContacts(response.data);
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
      }
    };

    fetchMessages();
    fetchContacts();
  }, []);

  const handleSendMessage = async (messageType: string, content: any) => {
    if (selectedContact) {
      try {
        const response = await axios.post('http://localhost:3005/send-message', {
          phone: selectedContact.id.toString(),
          messageType,
          content,
        });

        const sentMessage: Message = {
          id: Date.now(),
          content: content.body || content.link || content.fileName,
          from_phone: 'me',
          to_phone: selectedContact.id.toString(),
          timestamp: new Date().toISOString(),
          type: messageType,
        };

        setMessages((prevMessages) => [...prevMessages, sentMessage]);
        setNewMessage('');
        setAudioBlob(null);

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

  const handleSendTextMessage = () => {
    if (newMessage.trim() !== '') {
      handleSendMessage('text', { body: newMessage });
    }
  };

  const handleSendAudioMessage = async () => {
    if (audioBlob) {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audioMessage.ogg');
      
      try {
        const response = await axios.post('http://localhost:3005/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const { fileUrl } = response.data;
        handleSendMessage('audio', { link: fileUrl });
      } catch (error) {
        console.error('Erro ao enviar áudio:', error);
      }
    }
  };

  const handleSendDocumentMessage = async (documentFile: File) => {
    const formData = new FormData();
    formData.append('file', documentFile);
    
    try {
      const response = await axios.post('http://localhost:3005/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { fileUrl } = response.data;
      handleSendMessage('document', { link: fileUrl, fileName: documentFile.name });
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        setAudioBlob(event.data);
      };

      mediaRecorder.start();
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
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
                {messages
                  .filter((message) => 
                    message.from_phone === selectedContact.id.toString() || 
                    message.to_phone === selectedContact.id.toString()
                  )
                  .map((message) => (
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
                  onClick={handleSendTextMessage}
                  className="p-2 bg-blue-500 text-white rounded mr-2"
                >
                  <FiSend />
                </button>
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  className={`p-2 rounded ${isRecording ? 'bg-red-500' : 'bg-gray-200'} mr-2`}
                >
                  <FiMic />
                </button>
                {isRecording && (
                  <button
                    onClick={handleSendAudioMessage}
                    className="p-2 bg-green-500 text-white rounded mr-2"
                  >
                    Enviar Áudio
                  </button>
                )}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => e.target.files && handleSendDocumentMessage(e.target.files[0])}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="p-2 bg-gray-200 rounded cursor-pointer">
                  <FiPaperclip />
                </label>
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

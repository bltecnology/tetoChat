import React, { useState, useEffect } from "react";
import axios from "axios";

const TransmissionModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [contacts, setContacts] = useState([]); // Definir o estado como array vazio inicialmente
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [selectAll, setSelectAll] = useState(false); // Estado para controle de seleção de todos

  // Função para buscar contatos do banco de dados
  const fetchContacts = async () => {
    try {
      const response = await axios.get("https://tetochat-pgus.onrender.com/contacts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Verifica se response.data é um array
      if (Array.isArray(response.data)) {
        setContacts(response.data);
      } else {
        setContacts([]); // Se não for array, define como vazio
      }
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
      setContacts([]); // Em caso de erro, define como vazio
    }
  };

  // UseEffect para carregar os contatos quando o modal for aberto
  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  // Função para lidar com a seleção de múltiplos contatos
  const handleSelectContact = (contactPhone) => {
    if (selectedContacts.includes(contactPhone)) {
      setSelectedContacts(selectedContacts.filter((phone) => phone !== contactPhone));
    } else {
      setSelectedContacts([...selectedContacts, contactPhone]);
    }
  };

  // Função para selecionar ou desmarcar todos os contatos
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts([]); // Desmarcar todos
    } else {
      const allPhones = contacts.map(contact => contact.phone);
      setSelectedContacts(allPhones); // Selecionar todos os contatos
    }
    setSelectAll(!selectAll); // Alternar o estado de seleção
  };

  // Função para enviar a mensagem
  const handleSendMessage = async () => {
    if (selectedContacts.length === 0) {
      alert("Selecione ao menos um contato para enviar a mensagem.");
      return;
    }

    const formData = new FormData();
    formData.append("text", message); // Mensagem
    if (selectedFile) {
      formData.append("file", selectedFile); // Arquivo anexado
    }

    try {
      // Enviar a mensagem para cada contato selecionado
      for (const contactPhone of selectedContacts) {
        formData.set("toPhone", contactPhone); // Telefone do contato
        await axios.post("https://tetochat-pgus.onrender.com/send", formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      alert("Mensagens enviadas com sucesso!");
      onClose(); // Fechar o modal após envio
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem.");
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="bg-white p-6 max-w-lg w-full mx-auto rounded-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Enviar Mensagem</h2>

        {/* Seleção de contatos */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Contatos</label>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            <label className="ml-2 text-sm text-gray-900">Selecionar Todos</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <div key={contact.id} className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                    checked={selectedContacts.includes(contact.phone)}
                    onChange={() => handleSelectContact(contact.phone)}
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    {contact.name} - {contact.phone}
                  </label>
                </div>
              ))
            ) : (
              <p>Nenhum contato encontrado</p>
            )}
          </div>
        </div>

        {/* Caixa de texto para a mensagem */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
          />
        </div>

        {/* Anexar arquivo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Anexar Arquivo</label>
          <input
            type="file"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700"
            onClick={handleSendMessage}
          >
            Enviar
          </button>
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-400"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransmissionModal;

import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrMoreVertical, GrRefresh } from "react-icons/gr";
import MainContainer from "../components/mainContainer";
import ModalContacts from "../components/modalContacts";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import ModalEditContacts from "../components/modalEditContacts";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Função para buscar contatos
  const fetchContacts = async () => {
    try {
      const response = await axios.get(
        "https://tetochat-backend.onrender.com/contacts"
      );
      setContacts(response.data);
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    }
  };

  // Carrega os contatos ao montar o componente
  useEffect(() => {
    fetchContacts();
  }, []);

  // Função para adicionar contato
  const addContact = () => {
    fetchContacts();
    setIsModalOpen(false);
  };

  // Função para iniciar a edição de um contato
  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  // Função para salvar mudanças no contato
  const saveEditedContact = () => {
    fetchContacts();
    setIsEditModalOpen(false);
  };

  return (
    <div>
      <Header />
      <Background
        text="Contatos"
        btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
        btn3={<GrRefresh onClick={fetchContacts} />}
      >
        <MainContainer
          p1="Nome"
          p2="Número"
          p3="Tags"
          p4="Observação"
          p5="Email"
          p6="Ações"
          content={
            <>
              {contacts.map((contact) => (
                <tr key={contact.id} className="odd:bg-white even:bg-gray-50 border-b">
                  <td className="px-6 py-4">{contact.name}</td>
                  <td className="px-6 py-4">{contact.phone}</td>
                  <td className="px-6 py-4">{contact.tag}</td>
                  <td className="px-6 py-4">{contact.note}</td>
                  <td className="px-6 py-4">{contact.email}</td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded">
                          <GrMoreVertical className="cursor-pointer" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white text-black mt-2 w-48">
                        <DropdownMenuItem className="hover:bg-gray-200 text-center">
                          <button onClick={() => handleEditContact(contact)}>
                            Editar
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </>
          }
        />
      </Background>
      <ModalContacts
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addContact}
      />
      <ModalEditContacts
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={saveEditedContact}
        contact={selectedContact}
      />
    </div>
  );
};

export default Contacts;

import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrMoreVertical } from "react-icons/gr";
import MainContainer from "../components/mainContainer";
import ModalContacts from "../components/modalContacts";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get(
          "https://tetochat-nje1.onrender.com/contacts"
        );
        setContacts(response.data);
      } catch (error) {
        console.error("Erro ao buscar contatos:", error);
      }
    };

    fetchContacts();
  }, []);

  const addContact = async () => {
    try {
      const response = await axios.get(
        "https://tetochat-nje1.onrender.com/contacts"
      );
      setContacts(response.data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar contato:", error);
    }
  };

  const handleDeleteContact = async (contactId) => {
    const confirmDelete = window.confirm(
      "Você realmente deseja excluir este Contato?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(
          `https://tetochat-nje1.onrender.com/contacts/${contactId}`
        );
        setContacts(contacts.filter((contact) => contact.id !== contactId));
      } catch (error) {
        console.error("Erro ao excluir contato:", error.message);
        alert(
          "Erro ao excluir o contato. Verifique o console para mais detalhes."
        );
      }
    }
  };

  return (
    <div>
      <Header />
      <Background
        text="Contatos"
        btn1={
          <GrAdd
            className="rounded-full hover:bg-gray-400 hover:scale-110 transition-transform transition-colors duration-300"
            onClick={() => setIsModalOpen(true)}
          />
        }
      >
        <MainContainer
          p1="Nome"
          p2="Número"
          p3="Tags"
          p4="Observação"
          p5="Email"
          p6="Ações"
          content={
            <div>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div className="w-1/5">{contact.name}</div>
                  <div className="w-1/5">{contact.phone}</div>
                  <div className="w-1/5">{contact.tag}</div>
                  <div className="w-1/5">{contact.note}</div>
                  <div className="w-1/5">{contact.email}</div>
                  <div className="w-1/5 flex justify-end">
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
                        <DropdownMenuItem className="hover:bg-gray-200 text-center">
                          <button onClick={() => handleDeleteContact(contact.id)}>
                            Excluir
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </Background>
      <ModalContacts
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addContact}
      />
    </div>
  );
};

export default Contacts;

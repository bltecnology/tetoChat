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

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
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

    fetchContacts();
  }, []);

  const addContact = async () => {
    try {
      const response = await axios.get(
        "https://tetochat-backend.onrender.com/contacts"
      );
      setContacts(response.data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar contato:", error);
    }
  };

  // const handleDeleteContact = async (contactId) => {
  //   const confirmDelete = window.confirm(
  //     "Você realmente deseja excluir este Contato?"
  //   );
  //   if (confirmDelete) {
  //     try {
  //       await axios.delete(
  //         `https://tetochat-backend.onrender.com/contacts/${contactId}`
  //       );
  //       setContacts(contacts.filter((contact) => contact.id !== contactId));
  //     } catch (error) {
  //       console.error("Erro ao excluir contato:", error.message);
  //       alert(
  //         "Erro ao excluir o contato. Verifique o console para mais detalhes."
  //       );
  //     }
  //   }
  // };

  return (
    <div>
      <Header />
      <Background
        text="Contatos"
        btn1={
          <GrAdd
            onClick={() => setIsModalOpen(true)}
          />
        }
        btn3={<GrRefresh />} 

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

                <tr key={contact.id} className="odd:bg-white 0 even:bg-gray-50 0 border-b ">
                  <td className="px-6 py-4">{contact.name}</td>
                  <td className="px-6 py-4">{contact.phone}</td>
                  <td className="px-6 py-4">{contact.tag}</td>
                  <td className="px-6 py-4">{contact.note}</td>
                  <td className="px-6 py-4">{contact.email}</td>
                  <td className="px-6 py-4"><a href="">   <DropdownMenu>
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
                  </DropdownMenu></a></td>
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
    </div>
  );
};

export default Contacts;

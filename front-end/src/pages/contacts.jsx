import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrLinkTop } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';
import ModalContacts from '../components/modalContacts';
import { FiMoreVertical } from 'react-icons/fi'; // Ícone de três pontinhos

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(null); // Estado para controlar o menu visível
  const [selectedContact, setSelectedContact] = useState(null); // Contato selecionado para apagar

  const fetchContacts = async () => {
    try {
      const response = await axios.get('https://tetochat-8m0r.onrender.com/contacts');
      const contactsWithProfilePics = await Promise.all(
        response.data.map(async (contact) => {
          try {
            const profilePicResponse = await axios.get(`https://tetochat-8m0r.onrender.com/profile-picture/${contact.phone}`);
            return { ...contact, profilePic: profilePicResponse.data.profilePicUrl };
          } catch (error) {
            console.error(`Erro ao buscar foto de perfil para ${contact.phone}:`, error.response ? error.response.data : error.message);
            return { ...contact, profilePic: '/default-profile-pic.png' };  // Usar uma imagem padrão caso a foto de perfil não seja encontrada
          }
        })
      );
      setContacts(contactsWithProfilePics);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = () => {
    fetchContacts();
    setIsModalOpen(false);
  };

  const handleDeleteContact = async (contactId) => {
    try {
      await axios.delete(`https://tetochat-8m0r.onrender.com/contacts/${contactId}`);
      fetchContacts(); // Atualizar a lista de contatos
      setMenuVisible(null); // Fechar o menu
    } catch (error) {
      console.error('Erro ao apagar contato:', error);
    }
  };

  const toggleMenu = (contactId) => {
    setMenuVisible(contactId === menuVisible ? null : contactId);
  };

  return (
    <div>
      <Header />
      <Background
        text="Contatos"
        btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
        btn2={<GrLinkTop />}
      >
        <MainContainer
          p1="Nome"
          p3="Número"
          p6="Ações"
          content={
            contacts.map((contact) => (
              <div key={contact.id} className="flex items-center p-2 border-b space-x-40 relative">
                <div className="flex items-center space-x-2 w-1/4">
                  <img
                    src={contact.profilePic || '/default-profile-pic.png'} // Use uma imagem padrão se não houver foto de perfil
                    alt={contact.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>{contact.name}</div>
                </div>
                <div className="flex-1 w-1/4 text-right">{contact.phone}</div>
                <div className="flex-1 w-1/4">{contact.tag}</div>
                <div className="flex w-1/4 justify-end">
                  <FiMoreVertical
                    className="cursor-pointer"
                    onClick={() => toggleMenu(contact.id)}
                  />
                  {menuVisible === contact.id && (
                    <div className="absolute right-0 mt-8 w-40 bg-white border rounded shadow-lg z-10">
                      <div
                        className="cursor-pointer p-2 hover:bg-gray-100"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        Apagar
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        />
      </Background>
      <ModalContacts
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddContact}
      />
    </div>
  );
};

export default Contacts;

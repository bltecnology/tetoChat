import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrLinkTop } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';
import ModalContacts from '../components/modalContacts';

interface Contact {
  id: number;
  name: string;
  number: string;
  tags: string;
  profilePic: string;
  observation: string;
  cpf: string;
  rg: string;
  email: string;
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddContact = async (contact: Contact) => {
    try {
      const response = await axios.get(`/profile-picture?phone=${contact.number}`);
      const profilePictureUrl = response.data.profilePictureUrl;

      const newContact = {
        ...contact,
        id: Date.now(),
        profilePic: profilePictureUrl || 'URL_DA_IMAGEM_PADRÃO'
      };

      await axios.post('/contacts', newContact); // Salvar no backend

      setContacts([...contacts, newContact]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao obter a imagem do perfil:', error);
      const newContact = {
        ...contact,
        id: Date.now(),
        profilePic: 'URL_DA_IMAGEM_PADRÃO'
      };

      await axios.post('/contacts', newContact); // Salvar no backend

      setContacts([...contacts, newContact]);
      setIsModalOpen(false);
    }
  };

  return (
    <div>
      <Header />
      <Background
        text='Contatos'
        btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
        btn2={<GrLinkTop />}
      >
        <MainContainer
          p1={'Nome'}
          p3={'Número'}
          p6={'Ações'}
          content={
            contacts.map((contact) => (
              <div key={contact.id} className="flex items-center p-2 border-b">
                <div className="flex items-center">
                  <img src={contact.profilePic} alt={contact.name} className="w-10 h-10 rounded-full mr-2" />
                  <div>{contact.name}</div>
                </div>
                <div className="flex-1">{contact.number}</div>
                <div>{contact.tags}</div>
                <div className="flex">
                  {/* Adicione botões de ação aqui */}
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
}

export default Contacts;

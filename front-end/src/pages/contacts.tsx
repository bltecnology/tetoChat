import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrLinkTop } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';
import ModalContacts from '../components/modalContacts';
import { FiMoreVertical } from 'react-icons/fi'; // Ícone de três pontinhos

interface Contact {
  id: number;
  name: string;
  phone: string;
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

  const fetchContacts = async () => {
    try {
      const response = await axios.get('http://localhost:3005/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = () => {
    fetchContacts();
    setIsModalOpen(false);
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
              <div key={contact.id} className="flex items-center p-2 border-b space-x-40">
                <div className="flex items-center space-x-2 w-1/4">
                  <img
                    src={contact.profilePic}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>{contact.name}</div>
                </div>
                <div className="flex-1 w-1/4">{contact.phone}</div>
                <div className="flex-1 w-1/4">{contact.tags}</div>
                <div className="flex w-1/4 justify-end">
                  <FiMoreVertical className="cursor-pointer" />
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

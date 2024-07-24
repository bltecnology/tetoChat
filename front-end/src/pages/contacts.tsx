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
  phone: string; // Ajuste aqui
  tags: string;
  profilePic: string;
  observation: string; // Adicionei aqui para refletir o banco de dados
  cpf: string; // Adicionei aqui para refletir o banco de dados
  rg: string; // Adicionei aqui para refletir o banco de dados
  email: string; // Adicionei aqui para refletir o banco de dados
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
                <div className="flex-1">{contact.phone}</div>
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
        onSave={handleAddContact} // Atualiza a lista de contatos ao salvar
      />
    </div>
  );
};

export default Contacts;

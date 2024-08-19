import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrMoreVertical } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';
import ModalContacts from '../components/modalContacts';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await axios.get('https://tetochat-8m0r.onrender.com/contacts');
                setContacts(response.data);
            } catch (error) {
                console.error('Erro ao buscar contatos:', error);
            }
        };

        fetchContacts();
    }, []);

    const addContact = async () => {
        try {
            const response = await axios.get('https://tetochat-8m0r.onrender.com/contacts');
            setContacts(response.data);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao adicionar contato:', error);
        }
    };

    return (
        <div>
            <Header />
            <Background
                text="Contatos"
                btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
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
                                <div key={contact.id} className="flex justify-between items-center border-b py-2">
                                    <div className="w-1/5">{contact.name}</div>
                                    <div className="w-1/5">{contact.phone}</div>
                                    <div className="w-1/5">{contact.tag}</div>
                                    <div className="w-1/5">{contact.note}</div>
                                    <div className="w-1/5">{contact.email}</div>
                                    <div className="w-1/5 flex justify-end"><GrMoreVertical /></div>
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
}

export default Contacts;

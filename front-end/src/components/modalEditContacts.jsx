import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModalEditContacts = ({ isOpen, onClose, onSave, contact }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tags, setTags] = useState('');
  const [observation, setObservation] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
      setTags(contact.tag || '');
      setObservation(contact.note || '');
      setCpf(contact.cpf || '');
      setRg(contact.rg || '');
      setEmail(contact.email || '');
    }
  }, [contact]);

  const handleSave = async () => {
    const updatedContact = {
      name: name.trim() || null,
      phone: phone.trim() || null,
      tag: tags.trim() || null,
      note: observation.trim() || null,
      cpf: cpf.trim() || null,
      rg: rg.trim() || null,
      email: email.trim() || null,
    };

    try {
      await axios.put(`https://tetochat-backend.onrender.com/contacts/${contact.id}`, updatedContact);
      onSave(); // Atualiza a lista de contatos no componente pai
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg w-1/2">
        <h2 className="text-xl mb-4">Editar Contato</h2>
        <div className="mb-2">
          <label className="block mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Número</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Observação</label>
          <input
            type="text"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">CPF</label>
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">RG</label>
          <input
            type="text"
            value={rg}
            onChange={(e) => setRg(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-2 bg-gray-500 text-white rounded-full w-24 mr-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="p-2 bg-blue-500 text-white rounded-full w-24"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditContacts;

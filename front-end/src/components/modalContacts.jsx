  import React, { useState } from 'react';
  import axios from 'axios';

  const ModalContacts = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('55');
    const [tags, setTags] = useState('');
    const [observation, setObservation] = useState('');
    const [cpf, setCpf] = useState('');
    const [rg, setRg] = useState('');
    const [email, setEmail] = useState('');

    const handleSave = async () => {
      const newContact = {
        name,
        phone,
        tag: tags,
        note: observation,
        cpf,
        rg,
        email
      };

      try {
        await axios.post('https://tetochat-8m0r.onrender.com/contacts', newContact);
        onSave(); // Atualizar a lista de contatos no componente pai
        onClose();
      } catch (error) {
        console.error('Erro ao salvar contato:', error);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-4 rounded-lg w-1/2">
          <h2 className="text-xl mb-4">Adicionar Contato</h2>
          <div className="mb-2">
            <label className="block mb-1">Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Número</label>
            <input type="text" value={phone} placeholder='O código do país é obrigatório' onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Tags</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Observação</label>
            <input type="text" value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">CPF</label>
            <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">RG</label>
            <input type="text" value={rg} onChange={(e) => setRg(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Email</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="p-2 bg-gray-500 text-white rounded-full w-24 mr-2">Cancelar</button>
            <button onClick={handleSave} className="p-2 bg-blue-500 text-white rounded-full w-24">Salvar</button>
          </div>
        </div>
      </div>
    );
  };

  export default ModalContacts;

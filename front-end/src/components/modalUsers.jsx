import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModalUsers = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch departments only when the modal is open
      const fetchDepartments = async () => {
        try {
          const response = await axios.get('https://tetochat-8m0r.onrender.com/departments');
          setDepartments(response.data);
        } catch (error) {
          console.error('Erro ao buscar departamentos:', error);
        }
      };
      fetchDepartments();
    }
  }, [isOpen]);

  const handleSave = async () => {
    const newUser = { name, email, password, position, department };

    try {
      const response = await axios.post('https://tetochat-8m0r.onrender.com/users', newUser);
      onSave(response.data);
      setName('');
      setEmail('');
      setPassword('');
      setPosition('');
      setDepartment('');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl mb-2">Novo Usuário</h2>
        <input
          type="text"
          className="border p-2 mb-4 w-full"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          className="border p-2 mb-4 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border p-2 mb-4 w-full"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="text"
          className="border p-2 mb-4 w-full"
          placeholder="Cargo"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
        <select
          className="border p-2 mb-4 w-full"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Selecione o Departamento</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
        <div className="flex justify-end">
          <button
            className="bg-gray-200 px-4 py-2 mr-2"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 mr-3"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalUsers;

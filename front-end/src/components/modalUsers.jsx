import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModalUsers = ({ isOpen, onClose, onSave, user }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(''); // Campo de senha para edição e criação
  const [confirmPassword, setConfirmPassword] = useState(''); // Campo para confirmar a senha
  const [positionId, setPositionId] = useState(user?.position_id || ''); // Alterado para position_id
  const [departmentId, setDepartmentId] = useState(user?.department_id || ''); // Alterado para department_id
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]); // Para armazenar posições

  useEffect(() => {
    if (isOpen) {
      const fetchDepartments = async () => {
        try {
          const response = await axios.get('https://tetochat-pgus.onrender.com/departments');
          setDepartments(response.data);
        } catch (error) {
          console.error('Erro ao buscar departamentos:', error);
        }
      };

      const fetchPositions = async () => {
        try {
          const response = await axios.get('https://tetochat-pgus.onrender.com/positions'); // Endpoint para posições
          setPositions(response.data);
        } catch (error) {
          console.error('Erro ao buscar posições:', error);
        }
      };

      fetchDepartments();
      fetchPositions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPositionId(user.position_id); // Atualizado para position_id
      setDepartmentId(user.department_id); // Atualizado para department_id
    }
  }, [user]);

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    const updatedUser = {
      id: user?.id,
      name,
      email,
      password,
      position_id: positionId, // Alterado para position_id
      department_id: departmentId // Alterado para department_id
    };

    try {
      if (user) {
        // Atualizar usuário existente
        await axios.put(`https://tetochat-pgus.onrender.com/users/${user.id}`, updatedUser);
      } else {
        // Criar novo usuário
        const response = await axios.post('https://tetochat-pgus.onrender.com/users', updatedUser);
        updatedUser.id = response.data.id;
      }
      onSave(updatedUser);
      // Limpar campos
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPositionId('');
      setDepartmentId('');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl mb-2">{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
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
          type="password"
          className="border p-2 mb-4 w-full"
          placeholder="Confirme a Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <select
          className="border p-2 mb-4 w-full"
          value={positionId}
          onChange={(e) => setPositionId(e.target.value)}
        >
          <option value="">Selecione o Cargo</option>
          {positions.map((pos) => (
            <option key={pos.id} value={pos.id}>
              {pos.name} {/* Supondo que você tenha um campo name na tabela positions */}
            </option>
          ))}
        </select>
        <select
          className="border p-2 mb-4 w-full"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Selecione o Departamento</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <div className="flex justify-end">
          <button
            className="bg-gray-200 rounded-full px-4 py-2 mr-2"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="bg-blue-500 rounded-full text-white px-4 py-2 mr-3"
            onClick={handleSave}
          >
            {user ? 'Salvar Alterações' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalUsers;

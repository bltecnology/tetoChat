import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransferModal = ({ isOpen, onClose, onTransfer, contactId }) => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('https://tetochat-8m0r.onrender.com/departments');
        setDepartments(response.data);
      } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
      }
    };

    fetchDepartments();
  }, []);

  const handleTransfer = async () => {
    if (selectedDepartment && contactId) {
      try {
        await axios.post('https://tetochat-8m0r.onrender.com/transfer', {
          contactId: contactId,
          departmentId: selectedDepartment,
        });
        onTransfer(); // Chama a função de callback para atualizar a lista de contatos no componente pai
        onClose(); // Fecha o modal após a transferência
      } catch (error) {
        console.error('Erro ao transferir atendimento:', error);
      }
    }
  };

  if (!isOpen) return null; // Verifique isOpen em vez de show

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg w-1/2">
        <h2 className="text-xl mb-4">Transferir Atendimento</h2>
        <div className="mb-2">
          <label className="block mb-1">Selecione o Departamento</label>
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Selecione</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="p-2 bg-gray-500 text-white rounded mr-2">Cancelar</button>
          <button onClick={handleTransfer} className="p-2 bg-blue-500 text-white rounded">Transferir</button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;

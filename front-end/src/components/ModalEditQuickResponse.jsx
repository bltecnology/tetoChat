import React, { useState, useEffect } from "react";
import axios from "axios";

const ModalEditQuickResponse = ({ isOpen, onClose, onSave, quickResponse }) => {
  const [text, setText] = useState(quickResponse?.text || "");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(
    quickResponse?.department || ""
  );

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(
          "https://tetochat-backend.onrender.com/departments"
        );
        setDepartments(response.data);
      } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
      }
    };

    if (isOpen) {
      fetchDepartments();
      setText(quickResponse?.text || "");
      setSelectedDepartment(quickResponse?.department || "");
    }
  }, [isOpen, quickResponse]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      await axios.put(
        `https://tetochat-backend.onrender.com/quickResponses/${quickResponse.id}`,
        { text, department: selectedDepartment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      onSave();
    } catch (error) {
      console.error("Erro ao atualizar resposta rápida:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl mb-2">Editar Resposta Rápida</h2>
        <input
          type="text"
          className="border p-2 mb-4 w-full"
          placeholder="Digite a mensagem"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <select
          className="border p-2 mb-4 w-full"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          <option value="">Selecione o departamento</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
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
            className="bg-blue-500 rounded-full text-white px-4 py-2"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditQuickResponse;

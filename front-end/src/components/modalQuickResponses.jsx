import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModalQuickResponses = ({ isOpen, onClose, onSave }) => {
    const [text, setText] = useState('');
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

        if (isOpen) {
            fetchDepartments();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(text, selectedDepartment);
        setText('');
        setSelectedDepartment('');
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white p-4 rounded shadow-lg">
                <h2 className="text-xl mb-2">Nova Resposta Rápida</h2>
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
                        <option key={department.id} value={department.name}>
                            {department.name}
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

export default ModalQuickResponses;

import React, { useState } from 'react';

const ModalDepartments = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white p-4 rounded shadow-lg w-80 h-60">
                <h2 className="text-xl mb-2">Novo Departamento</h2>
                <input
                    type="text"
                    className="border p-2 mb-4 w-full mt-6"
                    placeholder="Digite o nome do departamento"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <div className="flex items-bottom justify-center mt-10">
                    <button
                        className="bg-gray-200 rounded-full px-4 py-2 mr-2"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="bg-blue-500 text-white rounded-full px-4 py-2 mr-3"
                        onClick={handleSave}
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalDepartments;

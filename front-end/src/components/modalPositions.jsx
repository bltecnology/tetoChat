import React, { useState } from 'react';

const Modal = ({ isOpen, onClose, onSave }) => {
    const [text, setText] = useState('');
    const [permissions, setPermissions] = useState({
        accessChat: false,
        createContacts: false,
        accessDepartments: false,
        accessStats: false,
        accessDevices: false,
        accessUsers: false,
        accessPositions: false,
        accessBots: false,
        accessQuickResponses: false
    });

    const handlePermissionChange = (perm) => {
        setPermissions(prev => ({ ...prev, [perm]: !prev[perm] }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch('/positions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: text, permissions }),
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar a posição');
            }

            const result = await response.text(); // ou `await response.json();` se você retornar um JSON
            console.log(result); // Exibe o resultado no console

            // Chama a função onSave para atualizar o estado no componente pai, se necessário
            onSave({ name: text, permissions });

            // Limpa os campos do modal
            setText('');
            setPermissions({
                accessChat: false,
                createContacts: false,
                accessDepartments: false,
                accessStats: false,
                accessDevices: false,
                accessUsers: false,
                accessPositions: false,
                accessBots: false,
                accessQuickResponses: false
            });

            onClose(); // Fecha o modal após salvar
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar a posição. Tente novamente.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white p-4 rounded shadow-lg">
                <h2 className="text-xl mb-2">Novo Cargo</h2>
                <input
                    type="text"
                    className="border p-2 mb-4 w-full"
                    placeholder="Digite o nome do cargo"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <label><input type="checkbox" checked={permissions.accessChat} onChange={() => handlePermissionChange('accessChat')} /> Acessar Chat</label>
                    <label><input type="checkbox" checked={permissions.createContacts} onChange={() => handlePermissionChange('createContacts')} /> Criar Contatos</label>
                    <label><input type="checkbox" checked={permissions.accessDepartments} onChange={() => handlePermissionChange('accessDepartments')} /> Acessar Departamentos</label>
                    <label><input type="checkbox" checked={permissions.accessStats} onChange={() => handlePermissionChange('accessStats')} /> Acessar Estatísticas</label>
                    <label><input type="checkbox" checked={permissions.accessDevices} onChange={() => handlePermissionChange('accessDevices')} /> Dispositivos Conectados</label>
                    <label><input type="checkbox" checked={permissions.accessUsers} onChange={() => handlePermissionChange('accessUsers')} /> Usuários</label>
                    <label><input type="checkbox" checked={permissions.accessPositions} onChange={() => handlePermissionChange('accessPositions')} /> Cargos</label>
                    <label><input type="checkbox" checked={permissions.accessBots} onChange={() => handlePermissionChange('accessBots')} /> Robôs</label>
                    <label><input type="checkbox" checked={permissions.accessQuickResponses} onChange={() => handlePermissionChange('accessQuickResponses')} /> Respostas Rápidas</label>
                </div>
                <div className="flex justify-end">
                    <button
                        className="bg-gray-200 rounded-full px-4 py-2 mr-2"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="bg-blue-500 rounded-full text-white px-4 py-2"
                        onClick={handleSave} // Chama a função handleSave ao clicar
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;

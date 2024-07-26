import React, { useState } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (text: string) => void;
}

const ModalUsers: React.FC<ModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [position, setPosition] = useState('');
    const [department, setDepartment] = useState('');

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
                    type="password"
                    className="border p-2 mb-4 w-full"
                    placeholder="Confirme a senha"
                    value={password}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="text"
                    className="border p-2 mb-4 w-full"
                    placeholder="Cargo"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                />
                <input
                    type="text"
                    className="border p-2 mb-4 w-full"
                    placeholder="Departamento"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                />
                <div className="flex justify-end">
                    <button
                        className="bg-gray-200 px-4 py-2 mr-2"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 mr-3"
                        onClick={() => {
                            onSave(`${name} (${email})`);
                            setName('');
                            setEmail('');
                        }}
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalUsers;

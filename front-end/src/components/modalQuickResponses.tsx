import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (text: string) => void;
}

const ModalQuickResponses: React.FC<ModalProps> = ({ isOpen, onClose, onSave }) => {
    const [text, setText] = React.useState('');

    if (!isOpen) return null;

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
                            onSave(text);
                            setText('');
                        }}
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalQuickResponses;

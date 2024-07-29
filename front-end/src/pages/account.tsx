import React, { useState, useEffect } from "react";
import axios from 'axios';
import Header from '../components/header';
import Background from '../components/background';
import MainContainer from "../components/mainContainer";

const Account: React.FC = () => {
    const [user, setUser] = useState({ name: '', email: '' });
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token'); // Supondo que você armazene o token no localStorage
                const response = await axios.get('http://localhost:3005/me', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error);
            }
        };

        fetchUserData();
    }, []);

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setMessage('As senhas não coincidem');
            return;
        }

        try {
            const token = localStorage.getItem('token'); // Supondo que você armazene o token no localStorage
            await axios.put('http://localhost:3005/update-password', {
                password: newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage('Senha alterada com sucesso');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Erro ao alterar a senha:', error);
            setMessage('Erro ao alterar a senha');
        }
    };

    return(
        <div>
            <Header />
            <Background text="Conta">
                <MainContainer
                    content = {
                        <div>
                            <div>
                                <label>Email</label>
                                <input type="email" value={user.email} readOnly className="border p-2 mb-4 w-full" />
                            </div>
                            <div>
                                <label>Nome</label>
                                <input type="text" value={user.name} readOnly className="border p-2 mb-4 w-full" />
                            </div>
                            <div>
                                <label>Senha</label>
                                <input 
                                    type="password" 
                                    placeholder="Senha" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    className="border p-2 mb-4 w-full" 
                                />
                            </div>
                            <div>
                                <label>Repita a senha</label>
                                <input 
                                    type="password" 
                                    placeholder="Repita a senha" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="border p-2 mb-4 w-full" 
                                />
                            </div>
                            <div>
                                <button 
                                    onClick={handlePasswordChange} 
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    Salvar
                                </button>
                            </div>
                            {message && <p>{message}</p>}
                        </div>
                    }
                ></MainContainer>
            </Background>
        </div>
    )
}

export default Account;

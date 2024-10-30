import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar a visibilidade da senha
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post('https://tetochat-nje1.onrender.com/login', { email, password: senha });
      const { token } = response.data;
      const { department } = response.data;
      console.log(response.data);
      
      // Armazena o token no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('department', department);

      // Configura o token em todas as requisições Axios

      navigate('/home');
    } catch (error) {
      console.error('Erro ao tentar fazer login:', error);
      setError('Email ou senha inválidos.');
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <h1 className="absolute top-4 left-14 text-2xl font-bold text-red-800">
        TetoChat
      </h1>
      <div className="flex justify-center items-center flex-1">
        <div className="bg-white rounded-lg p-8 w-96" style={{ boxShadow: '10px 10px 20px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.25)' }}>
          <h2 className="text-center text-2xl font-semibold text-red-700 mb-6">Olá novamente!</h2>
          <form onSubmit={handleLogin}>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email"></label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="senha"></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} // Alterna entre texto e senha
                  id="senha"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 py-2 text-blue-500 text-sm focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)} // Alterna o estado de exibição da senha
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Alterna entre os ícones */}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <a href="#" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                Esqueceu a senha?
              </a>
            </div>
            <div className="mt-6 flex justify-center">
              <button type='submit'
               className='bg-red-700 text-white
               rounded-full w-60 h-12 hover:bg-red-900
               '>
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
      <p className="absolute bottom-0 w-full text-center mb-4">BL Comunicações © 2024</p>
    </div>
  );
};

export default LoginPage;

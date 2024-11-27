import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar a visibilidade da senha
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(); // Estado para controlar a renderização
  const navigate = useNavigate();
  const checkToken = async () => {
    if (localStorage.token) {
      try {
    
        await axios.get('https://tetochat-backend.onrender.com/confirm-token', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        navigate('/home');
        
      } catch (error) {
        console.error('Token inválido ou não encontrado:', error);
      } finally {
        setLoading(false); // Finaliza o carregamento após a verificação
      }
    }else{
      console.log("teste");
      
      setLoading(false);
      
    }
    }
  useEffect(() => {
    checkToken();
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('https://tetochat-backend.onrender.com/login', { email, password: senha });

      const { token, department } = response.data;

      // Armazena o token no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('department', department);
      localStorage.setItem('email', email);

      navigate('/home');
    } catch (error) {
      console.error('Erro ao tentar fazer login:', error);
      setError('Email ou senha inválidos.');
    }
  };

  // Renderiza um indicador de carregamento enquanto o useEffect não termina
  if (loading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <p className="text-red-700 text-xl font-semibold">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
    
      <div className="flex justify-center items-center flex-1">
        <div className="bg-white rounded-lg p-8 w-96" style={{ boxShadow: '10px 10px 20px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.25)' }}>
          <h2 className="text-center text-2xl font-semibold text-red-700 mb-6">TetoChat</h2>
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
                  type={showPassword ? 'text' : 'password'}
                  id="senha"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 py-2 text-blue-500 text-sm focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
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
                className='bg-red-700 text-white rounded-full w-60 h-12 hover:bg-red-900'>
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

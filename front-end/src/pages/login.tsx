import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/users');
      const users = await response.json();

      const user = users.find((user: { email: string; senha: string | number }) => user.email === email && user.senha === senha);

      if (user) {
        // Login bem-sucedido, redireciona para a página Home
        navigate('/home');
      } else {
        // Credenciais inválidas
        setError('Email ou senha inválidos.');
      }
    } catch (error) {
      console.error('Erro ao tentar fazer login:', error);
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
    }
  };

  return (
    <div
      className="flex h-screen"
      style={{ background: 'linear-gradient(to bottom, rgba(238, 4, 48, 0.5), rgba(255, 92, 123, 0.5))' }}
    >
      <div className="flex justify-center items-center flex-1">
        <div className="bg-white rounded-lg p-8 w-96" style={{ boxShadow: '10px 10px 20px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.25)' }}>
          <h2 className="text-center text-2xl font-semibold text-red-700 mb-6">Login</h2>
          <form onSubmit={handleLogin}>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              </label>
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
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="senha">
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="senha"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 py-2 text-blue-500 text-sm focus:outline-none"
                >
                  Exibir
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <a href="#" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                Esqueceu a senha?
              </a>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Iniciar sessão
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

/**
 * ============================================================================
 * TELA DE LOGIN - DESIGN MODERNO COM IDENTIDADE IOGAR
 * ============================================================================
 * Descrição: Tela de login responsiva com gradiente verde/rosa
 * Animações suaves, validações em tempo real, experiência premium
 * Data: 17/10/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import iogarLogo from '../image/iogar_logo.png';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const Login: React.FC = () => {
  // States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();

  // ============================================================================
  // FUNÇÃO: HANDLE SUBMIT
  // ============================================================================

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações básicas
    if (!username.trim()) {
      setError('Por favor, informe o usuário');
      return;
    }

    if (!password) {
      setError('Por favor, informe a senha');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await login({ username: username.trim(), password });
      
      // Redirecionar para dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Usuário ou senha incorretos');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-500 to-pink-500 p-4 relative overflow-hidden">
      
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Card do Login */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Card principal com efeito glassmorphism */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
          
          {/* Logo e Header */}
          <div className="text-center mb-8">
            {/* Logo IOGAR */}
            <div className="mb-6 flex justify-center">
              <img 
                src={iogarLogo} 
                alt="IOGAR Logo" 
                className="w-24 h-24 object-contain transform hover:scale-110 transition-transform duration-300 drop-shadow-lg"
                onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2310b981" width="100" height="100" rx="20"/><text x="50" y="65" font-size="40" font-weight="bold" fill="white" text-anchor="middle">IO</text></svg>';
                }}
                />
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Food Cost System
            </h1>
            <p className="text-gray-600 text-sm">
              Sistema de Controle de Custos
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campo Usuário */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Usuário ou Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Digite seu usuário"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Lembrar-me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                  Lembrar-me
                </span>
              </label>

              <a 
                href="#" 
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                Esqueci minha senha
              </a>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start animate-shake">
                <svg className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-emerald-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Versão 2.0 | © 2025 IOGAR
            </p>
          </div>
        </div>

        {/* Informação de ajuda */}
        <div className="mt-6 text-center">
          <p className="text-white text-sm drop-shadow-lg">
            Problemas para acessar?{' '}
            <a href="#" className="font-semibold hover:underline" onClick={(e) => e.preventDefault()}>
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
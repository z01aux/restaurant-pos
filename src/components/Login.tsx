import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: () => void;
  isDarkMode: boolean;
  toggleTheme?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const CORRECT_PIN = '1234'; // PIN por defecto - CAMBIAR ESTO

  // Temporizador de bloqueo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleKeyPadClick = (num: string) => {
    if (pin.length < 4 && !isLocked) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = () => {
    if (isLocked) {
      setError(`Demasiados intentos. Espera ${lockTimer} segundos`);
      return;
    }

    if (pin.length !== 4) {
      setError('Ingresa los 4 dígitos del PIN');
      return;
    }

    if (pin === CORRECT_PIN) {
      onLogin();
      setError('');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`PIN incorrecto. Intentos restantes: ${4 - newAttempts}`);
      setPin('');
      
      if (newAttempts >= 4) {
        setIsLocked(true);
        setLockTimer(30);
        setError('Demasiados intentos. Espera 30 segundos');
      }
    }
  };

  // Estilos condicionales
  const bgStyles = isDarkMode ? 'bg-gray-950' : 'bg-white';
  const gridStyles = isDarkMode 
    ? 'bg-[linear-gradient(#1f2937_1px,transparent_1px),linear-gradient(90deg,#1f2937_1px,transparent_1px)]' 
    : 'bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)]';
  const cardBgStyles = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const textPrimaryStyles = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondaryStyles = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderStyles = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const buttonStyles = isDarkMode 
    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 active:bg-gray-600' 
    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100';
  const buttonPrimaryStyles = isDarkMode 
    ? 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700' 
    : 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700';

  return (
    <div className={`min-h-screen ${bgStyles} flex items-center justify-center p-4 transition-colors duration-300`}>
      {/* Cuadrícula de fondo */}
      <div className={`fixed inset-0 ${gridStyles} bg-[size:24px_24px] pointer-events-none opacity-30 transition-colors duration-300`} />
      
      {/* Botón toggle tema */}
      {toggleTheme && (
        <button
          onClick={toggleTheme}
          className={`fixed top-4 right-4 z-20 w-10 h-5 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
        >
          <div className={`w-4 h-4 rounded-full transition-all duration-300 mt-0.5 ${isDarkMode ? 'translate-x-5 bg-gray-300' : 'translate-x-0.5 bg-gray-700'}`} />
        </button>
      )}
      
      <div className={`relative ${cardBgStyles} rounded-2xl border ${borderStyles} p-6 sm:p-8 w-full max-w-sm shadow-xl transition-colors duration-300`}>
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">$</span>
          </div>
          <h1 className={`text-2xl font-bold ${textPrimaryStyles}`}>REG VEN.</h1>
          <p className={`text-sm ${textSecondaryStyles} mt-1`}>Sistema de Punto de Venta</p>
          <p className={`text-xs ${textSecondaryStyles} mt-2`}>Acceso autorizado</p>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center animate-fadeIn">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        
        {/* Display PIN */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${textSecondaryStyles} mb-2 text-center`}>
            PIN de acceso
          </label>
          <div className={`flex justify-center gap-2 ${isLocked ? 'opacity-50' : ''}`}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-mono font-bold transition-all ${
                  pin[i] 
                    ? isDarkMode 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                      : 'border-emerald-500 bg-emerald-50 text-emerald-600'
                    : isDarkMode 
                      ? 'border-gray-700 bg-gray-800 text-gray-400' 
                      : 'border-gray-200 bg-gray-100 text-gray-400'
                }`}
              >
                {pin[i] || '•'}
              </div>
            ))}
          </div>
          {isLocked && (
            <p className={`text-center text-sm ${textSecondaryStyles} mt-2`}>
              Bloqueado por seguridad. Espera {lockTimer} segundos.
            </p>
          )}
        </div>
        
        {/* Teclado numérico */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPadClick(num)}
                disabled={isLocked || pin.length >= 4}
                className={`py-4 rounded-xl text-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${buttonStyles}`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={isLocked}
              className={`py-4 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${buttonStyles}`}
            >
              LIMPIAR
            </button>
            <button
              onClick={() => handleKeyPadClick('0')}
              disabled={isLocked || pin.length >= 4}
              className={`py-4 rounded-xl text-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${buttonStyles}`}
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={isLocked || pin.length === 0}
              className={`py-4 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${buttonStyles}`}
            >
              ⌫
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4 || isLocked}
            className={`w-full py-3 rounded-xl text-lg font-semibold transition-all active:scale-98 disabled:opacity-50 disabled:active:scale-100 ${buttonPrimaryStyles}`}
          >
            ACCEDER
          </button>
        </div>
        
        {/* Info de seguridad */}
        <div className="mt-6 text-center">
          <p className={`text-[10px] ${textSecondaryStyles}`}>
            Sistema privado • Acceso restringido
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;

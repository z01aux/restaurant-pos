import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: () => void;
  isDarkMode: boolean;
  toggleTheme?: () => void;
}

interface CredentialInfo {
  id: string;
  name: string;
  registeredAt: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricRegistered, setIsBiometricRegistered] = useState(false);
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const CORRECT_PIN = '1234'; // PIN por defecto

  // Detectar soporte WebAuthn
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if (window.PublicKeyCredential) {
        setIsBiometricSupported(true);
        // Verificar si ya hay credenciales registradas
        const savedCredentialId = localStorage.getItem('webauthn_credential_id');
        if (savedCredentialId) {
          setIsBiometricRegistered(true);
        }
      }
    };
    checkBiometricSupport();
  }, []);

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

  // Registrar huella digital / biometría
  const registerBiometric = async () => {
    if (!window.PublicKeyCredential) {
      setError('Tu navegador no soporta autenticación biométrica');
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      // Generar challenge aleatorio
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Crear credencial
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: "REG VEN. POS System",
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16),
          name: "usuario@regven.com",
          displayName: "Usuario REG VEN.",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Usar biometría del dispositivo
          userVerification: "required",
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        const pubKeyCred = credential as PublicKeyCredential;
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(pubKeyCred.rawId)));
        
        // Guardar ID de la credencial
        localStorage.setItem('webauthn_credential_id', credentialId);
        localStorage.setItem('webauthn_registered_at', new Date().toISOString());
        
        setIsBiometricRegistered(true);
        setError('');
        alert('✅ ¡Biometría registrada con éxito! Ahora puedes usar tu huella digital para acceder.');
      }
    } catch (err: any) {
      console.error('Error al registrar biometría:', err);
      if (err.name === 'NotAllowedError') {
        setError('Cancelaste la autenticación biométrica');
      } else if (err.name === 'NotSupportedError') {
        setError('Tu dispositivo no soporta autenticación biométrica');
      } else {
        setError('Error al registrar biometría: ' + err.message);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Autenticar con huella digital / biometría
  const authenticateWithBiometric = async () => {
    if (!window.PublicKeyCredential) {
      setError('Tu navegador no soporta autenticación biométrica');
      return;
    }

    const savedCredentialId = localStorage.getItem('webauthn_credential_id');
    if (!savedCredentialId) {
      setError('No hay biometría registrada. Usa PIN o registra tu huella primero.');
      return;
    }

    setError('');

    try {
      // Decodificar credential ID
      const credentialIdBuffer = Uint8Array.from(atob(savedCredentialId), c => c.charCodeAt(0));
      
      // Generar challenge aleatorio
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [{
          id: credentialIdBuffer,
          type: "public-key",
        }],
        timeout: 60000,
        userVerification: "required",
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (assertion) {
        // Autenticación exitosa
        onLogin();
      }
    } catch (err: any) {
      console.error('Error en autenticación biométrica:', err);
      if (err.name === 'NotAllowedError') {
        setError('Cancelaste la autenticación biométrica');
      } else if (err.name === 'NotFoundError') {
        setError('Credencial biométrica no encontrada. Re-registra tu huella.');
        localStorage.removeItem('webauthn_credential_id');
        setIsBiometricRegistered(false);
      } else {
        setError('Error en autenticación: ' + err.message);
      }
    }
  };

  // Eliminar biometría registrada
  const removeBiometric = () => {
    if (confirm('¿Eliminar la biometría registrada?')) {
      localStorage.removeItem('webauthn_credential_id');
      localStorage.removeItem('webauthn_registered_at');
      setIsBiometricRegistered(false);
      setError('Biometría eliminada');
    }
  };

  // Métodos PIN
  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`Demasiados intentos. Espera ${lockTimer} segundos`);
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

  const handleKeyPadClick = (num: string) => {
    if (pin.length < 4) {
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
  const buttonBiometricStyles = isDarkMode 
    ? 'bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700' 
    : 'bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700';

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
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">$</span>
          </div>
          <h1 className={`text-2xl font-bold ${textPrimaryStyles}`}>REG VEN.</h1>
          <p className={`text-sm ${textSecondaryStyles} mt-1`}>Sistema de Punto de Venta</p>
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        
        {/* Botón de acceso biométrico */}
        {isBiometricSupported && (
          <div className="mb-6 space-y-3">
            {isBiometricRegistered ? (
              <>
                <button
                  onClick={authenticateWithBiometric}
                  className={`w-full py-4 rounded-xl text-lg font-semibold transition-all active:scale-98 flex items-center justify-center gap-3 ${buttonBiometricStyles}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  🔐 Acceder con huella digital
                </button>
                <button
                  onClick={removeBiometric}
                  className={`w-full py-2 text-sm ${textSecondaryStyles} hover:text-red-500 transition-colors`}
                >
                  Eliminar biometría registrada
                </button>
              </>
            ) : (
              <button
                onClick={registerBiometric}
                disabled={isRegistering}
                className={`w-full py-4 rounded-xl text-lg font-semibold transition-all active:scale-98 flex items-center justify-center gap-3 ${buttonBiometricStyles} disabled:opacity-50`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                {isRegistering ? 'Registrando...' : '📱 Registrar huella digital'}
              </button>
            )}
            
            {/* Separador */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${borderStyles}`} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className={`px-2 ${cardBgStyles} ${textSecondaryStyles}`}>O ingresa con PIN</span>
              </div>
            </div>
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
            ACCEDER CON PIN
          </button>
        </div>
        
        {/* Info de seguridad */}
        <div className="mt-6 text-center">
          <p className={`text-xs ${textSecondaryStyles}`}>
            {isBiometricSupported 
              ? '🔒 Autenticación biométrica disponible' 
              : '🔒 Tu navegador no soporta biometría'}
          </p>
          <p className={`text-[10px] ${textSecondaryStyles} mt-2`}>
            Sistema seguro • @jozzymar
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
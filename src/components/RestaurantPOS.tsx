import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

interface Client {
  id: number;
  name: string;
  paymentMethod: 'efectivo' | 'yape' | '';
  amount: string;
}

interface PaymentOptionProps {
  value: 'efectivo' | 'yape';
  label: string;
  selected: boolean;
  onSelect: () => void;
  isDarkMode: boolean;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const PaymentOption: React.FC<PaymentOptionProps> = ({ value, label, selected, onSelect, isDarkMode }) => {
  const isEfectivo = value === 'efectivo';
  
  const lightStyles = selected 
    ? isEfectivo 
      ? 'bg-green-600 text-white' 
      : 'bg-purple-600 text-white'
    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200';
  
  const darkStyles = selected 
    ? isEfectivo 
      ? 'bg-emerald-600 text-white' 
      : 'bg-purple-600 text-white'
    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700';
  
  return (
    <button
      type="button"
      className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-none ${isDarkMode ? darkStyles : lightStyles}`}
      onClick={onSelect}
    >
      {label}
    </button>
  );
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel, isDarkMode }) => {
  if (!isOpen) return null;

  const bgStyles = isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textStyles = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryStyles = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const buttonCancelStyles = isDarkMode 
    ? 'text-gray-400 hover:bg-gray-800 border-gray-700' 
    : 'text-gray-600 hover:bg-gray-100 border-gray-200';
  const buttonConfirmStyles = isDarkMode 
    ? 'bg-gray-700 text-white hover:bg-gray-600' 
    : 'bg-gray-800 text-white hover:bg-gray-900';
  const gridStyles = isDarkMode 
    ? 'bg-[linear-gradient(#1f2937_1px,transparent_1px),linear-gradient(90deg,#1f2937_1px,transparent_1px)]' 
    : 'bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)]';

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-black/40'}`} onClick={onCancel} />
      <div className={`relative ${bgStyles} ${isMobile ? 'rounded-t-2xl w-full' : 'rounded-lg w-80'} max-w-[95%] border overflow-hidden`}>
        {/* Cuadrícula de fondo en el modal */}
        <div className={`absolute inset-0 ${gridStyles} bg-[size:20px_20px] pointer-events-none opacity-20`} />
        
        <div className="relative p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${textStyles}`}>{title}</h3>
          </div>
          
          <p className={`${textSecondaryStyles} text-sm mb-6`}>{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`flex-1 py-2.5 text-sm rounded-xl border transition-all active:scale-95 ${buttonCancelStyles}`}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 text-sm rounded-xl transition-all active:scale-95 ${buttonConfirmStyles}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RestaurantPOS: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: '', paymentMethod: '', amount: '' },
  ]);
  const [total, setTotal] = useState<number>(0);
  const [alertMessage, setAlertMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<{ date: string, time: string }>({ date: '', time: '' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; onConfirm: () => void }>({
    isOpen: false,
    onConfirm: () => {},
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const updateDateTime = useCallback(() => {
    const now = new Date();
    setCurrentDateTime({
      date: now.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    });
  }, []);

  const showAlert = useCallback((message: string, type: 'success' | 'error') => {
    setAlertMessage({ text: message, type });
    setTimeout(() => setAlertMessage(null), 2000);
  }, []);

  const calculateTotal = useCallback(() => {
    const newTotal = clients.reduce((sum, client) => {
      const amountValue = client.amount.replace(/[^\d.]/g, '');
      return amountValue && parseFloat(amountValue) > 0 ? sum + parseFloat(amountValue) : sum;
    }, 0);
    setTotal(newTotal);
  }, [clients]);

  useEffect(() => { calculateTotal(); }, [calculateTotal]);
  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [updateDateTime]);

  const handleNameChange = (id: number, value: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, name: value.toUpperCase() } : c));
  };

  const handlePaymentChange = (id: number, method: 'efectivo' | 'yape') => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, paymentMethod: method } : c));
  };

  const handleAmountChange = (id: number, value: string) => {
    let formattedValue = value.replace(/[^\d.]/g, '');
    const parts = formattedValue.split('.');
    if (parts.length > 2) formattedValue = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1] && parts[1].length > 2) formattedValue = parts[0] + '.' + parts[1].substring(0, 2);
    setClients(prev => prev.map(c => c.id === id ? { ...c, amount: formattedValue } : c));
  };

  const handleAmountBlur = (id: number, value: string) => {
    let formattedValue = value.replace(/[^\d.]/g, '');
    formattedValue = (formattedValue && parseFloat(formattedValue) > 0) 
      ? parseFloat(formattedValue).toFixed(2) 
      : '';
    setClients(prev => prev.map(c => c.id === id ? { ...c, amount: formattedValue } : c));
  };

  const addRow = () => {
    const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    setClients(prev => [...prev, { id: newId, name: '', paymentMethod: '', amount: '' }]);
    showAlert('Item agregado', 'success');
  };

  const deleteRow = (id: number) => {
    if (clients.length <= 1) {
      showAlert('Debe haber al menos un item', 'error');
      return;
    }
    setClients(prev => prev.filter(c => c.id !== id));
    showAlert('Item eliminado', 'success');
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      onConfirm: () => {
        setClients([{ id: 1, name: '', paymentMethod: '', amount: '' }]);
        showAlert('Datos limpiados', 'success');
        setConfirmModal({ isOpen: false, onConfirm: () => {} });
      }
    });
  };

  const getValidClients = () => {
    return clients.filter(c => c.name.trim() && c.amount && parseFloat(c.amount) > 0);
  };

  const generatePDF = () => {
    const validClients = getValidClients();
    if (validClients.length === 0) {
      showAlert('No hay datos para generar', 'error');
      return;
    }
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297]
      });
      
      let yPos = 10;
      const margin = 5;
      const lineHeight = 5;
      const pageWidth = 80;

      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text('MARYS RESTAURANT', pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight;
      
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text('RUC: 20505262086', pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight;
      doc.text(`Fecha: ${currentDateTime.date} | Hora: ${currentDateTime.time}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight * 1.5;

      doc.setLineWidth(0.2);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += lineHeight;

      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.text('#', margin, yPos);
      doc.text('CLIENTE', margin + 8, yPos);
      doc.text('PAGO', margin + 38, yPos);
      doc.text('MONTO', margin + 58, yPos);
      yPos += lineHeight;
      
      doc.setFont('courier', 'normal');
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += lineHeight;

      validClients.forEach((client, index) => {
        const amount = parseFloat(client.amount).toFixed(2);
        const payment = client.paymentMethod === 'efectivo' ? 'EFEC' : 'YAPE';
        const name = client.name.substring(0, 14);
        
        doc.setFont('courier', 'normal');
        doc.text(String(index + 1), margin, yPos);
        
        doc.setFont('courier', 'bold');
        doc.text(name, margin + 8, yPos);
        doc.text(payment, margin + 38, yPos);
        doc.text(`S/ ${amount}`, margin + 58, yPos);
        
        yPos += lineHeight;
      });

      yPos += lineHeight / 2;
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += lineHeight;
      
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.text(`TOTAL: S/ ${total.toFixed(2)}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += lineHeight * 2;
      doc.setFont('courier', 'normal');
      doc.setFontSize(6);
      doc.text('*** REGISTRO DE VENTAS ***', pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight;
      doc.text('generado por @jozzymar', pageWidth / 2, yPos, { align: 'center' });

      doc.save(`ticket-${currentDateTime.date.replace(/\//g, '-')}.pdf`);
      showAlert('Ticket generado', 'success');
    } catch (error) {
      showAlert('Error al generar', 'error');
    }
  };

  const efectivoTotal = clients.filter(c => c.paymentMethod === 'efectivo').reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const yapeTotal = clients.filter(c => c.paymentMethod === 'yape').reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  // Estilos condicionales
  const bgStyles = isDarkMode ? 'bg-gray-950' : 'bg-white';
  const gridStyles = isDarkMode 
    ? 'bg-[linear-gradient(#1f2937_1px,transparent_1px),linear-gradient(90deg,#1f2937_1px,transparent_1px)]' 
    : 'bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)]';
  const textPrimaryStyles = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondaryStyles = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderStyles = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const tableBgStyles = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const tableHeaderStyles = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
  const inputStyles = isDarkMode 
    ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-gray-500' 
    : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400';
  const buttonStyles = isDarkMode 
    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';
  const buttonPrimaryStyles = isDarkMode 
    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
    : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-900';
  const summaryBgStyles = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const iconBgStyles = isDarkMode ? 'bg-gray-800' : 'bg-gray-200';
  const iconTextStyles = isDarkMode ? 'text-gray-500' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${bgStyles} py-3 px-2 sm:py-4 sm:px-4 transition-colors duration-300`}>
      {/* Cuadrícula de fondo - visible en móvil y desktop */}
      <div className={`fixed inset-0 ${gridStyles} bg-[size:24px_24px] pointer-events-none opacity-30 transition-colors duration-300`} />
      
      <div className="max-w-6xl mx-auto space-y-3 relative z-10">
        
        {/* Modal de confirmación */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title="Limpiar datos"
          message="¿Estás seguro de que deseas limpiar todos los datos? Esta acción no se puede deshacer."
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({ isOpen: false, onConfirm: () => {} })}
          isDarkMode={isDarkMode}
        />
        
        {/* Alertas - móvil abajo, desktop arriba */}
        {alertMessage && (
          <div className={`fixed z-40 px-4 py-3 rounded-xl text-sm text-center shadow-lg transition-all duration-200 ${
            alertMessage.type === 'success' 
              ? isDarkMode 
                ? 'bg-emerald-900 text-emerald-300 border border-emerald-700' 
                : 'bg-green-100 text-green-800 border border-green-200'
              : isDarkMode 
                ? 'bg-red-900 text-red-300 border border-red-700' 
                : 'bg-red-100 text-red-800 border border-red-200'
          } ${window.innerWidth < 640 ? 'bottom-4 left-4 right-4' : 'top-4 left-1/2 transform -translate-x-1/2'}`}>
            {alertMessage.text}
          </div>
        )}

        {/* Header - responsive con switch en esquina superior derecha en móvil */}
        <div className={`border-b ${borderStyles} pb-3 transition-colors duration-300`}>
          {/* Desktop layout */}
          <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 bg-gray-800 rounded flex items-center justify-center transition-colors duration-300`}>
                <span className="text-sm font-bold text-white">$</span>
              </div>
              <div>
                <h1 className={`text-lg font-bold ${textPrimaryStyles} transition-colors duration-300`}>REG VEN.</h1>
                <p className={`text-xs ${textSecondaryStyles} transition-colors duration-300`}>@jozzymar</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`w-10 h-5 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full transition-all duration-300 mt-0.5 ${isDarkMode ? 'translate-x-5 bg-gray-300' : 'translate-x-0.5 bg-gray-700'}`} />
              </button>
              
              <div className="text-right">
                <div className={`text-xs ${textSecondaryStyles} transition-colors duration-300`}>{currentDateTime.date}</div>
                <div className={`text-sm font-mono font-semibold ${textPrimaryStyles} transition-colors duration-300`}>{currentDateTime.time}</div>
              </div>
            </div>
          </div>

          {/* Mobile layout - switch en esquina superior derecha junto al reloj */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 bg-gray-800 rounded flex items-center justify-center transition-colors duration-300`}>
                  <span className="text-base font-bold text-white">$</span>
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${textPrimaryStyles} transition-colors duration-300`}>REG VEN.</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className={`w-10 h-5 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 mt-0.5 ${isDarkMode ? 'translate-x-5 bg-gray-300' : 'translate-x-0.5 bg-gray-700'}`} />
                </button>
                
                <div className="text-right">
                  <div className={`text-[10px] ${textSecondaryStyles} transition-colors duration-300`}>{currentDateTime.date}</div>
                  <div className={`text-xs font-mono font-semibold ${textPrimaryStyles} transition-colors duration-300`}>{currentDateTime.time}</div>
                </div>
              </div>
            </div>
            <p className={`text-xs ${textSecondaryStyles} mt-2 text-center transition-colors duration-300`}>2026</p>
          </div>
        </div>

        {/* VISTA DESKTOP - Tabla */}
        <div className="hidden lg:block">
          <div className={`${tableBgStyles} border ${borderStyles} rounded overflow-hidden transition-colors duration-300`}>
            <div className={`${tableHeaderStyles} px-3 py-2 border-b ${borderStyles} transition-colors duration-300`}>
              <h2 className={`text-xs font-semibold ${textSecondaryStyles} transition-colors duration-300`}>REGISTRO</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={tableHeaderStyles}>
                  <tr className="transition-colors duration-300">
                    <th className={`px-3 py-2 text-left text-xs font-semibold ${textSecondaryStyles} w-12 transition-colors duration-300`}>#</th>
                    <th className={`px-3 py-2 text-left text-xs font-semibold ${textSecondaryStyles} transition-colors duration-300`}>Cliente</th>
                    <th className={`px-3 py-2 text-left text-xs font-semibold ${textSecondaryStyles} w-48 transition-colors duration-300`}>Pago</th>
                    <th className={`px-3 py-2 text-left text-xs font-semibold ${textSecondaryStyles} w-24 transition-colors duration-300`}>Monto</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                  {clients.map((client, index) => (
                    <tr key={client.id} className={`${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-3 py-2">
                        <div className={`w-6 h-6 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'} rounded flex items-center justify-center text-xs font-semibold transition-colors duration-300`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          className={`w-full px-2 py-1 border rounded text-sm focus:outline-none transition-colors duration-300 ${inputStyles}`}
                          placeholder="nombre"
                          value={client.name}
                          onChange={(e) => handleNameChange(client.id, e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <PaymentOption value="efectivo" label="Efectivo" selected={client.paymentMethod === 'efectivo'} onSelect={() => handlePaymentChange(client.id, 'efectivo')} isDarkMode={isDarkMode} />
                          <PaymentOption value="yape" label="Yape" selected={client.paymentMethod === 'yape'} onSelect={() => handlePaymentChange(client.id, 'yape')} isDarkMode={isDarkMode} />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          className={`w-full px-2 py-1 border rounded text-sm text-right font-semibold focus:outline-none transition-colors duration-300 ${inputStyles}`}
                          placeholder="0.00"
                          value={client.amount}
                          onChange={(e) => handleAmountChange(client.id, e.target.value)}
                          onBlur={(e) => handleAmountBlur(client.id, e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => deleteRow(client.id)}
                          className={`${isDarkMode ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* VISTA MÓVIL - Tarjetas estilo app */}
        <div className="lg:hidden space-y-3">
          {clients.map((client, index) => (
            <div key={client.id} className={`${tableBgStyles} rounded-2xl border ${borderStyles} p-4 shadow-sm transition-all active:scale-[0.98]`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    {index + 1}
                  </div>
                  <span className={`text-xs ${textSecondaryStyles}`}>item #{index + 1}</span>
                </div>
                <button
                  onClick={() => deleteRow(client.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'text-gray-600 active:bg-gray-800' : 'text-gray-400 active:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium ${textSecondaryStyles} mb-1`}>Cliente</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border text-base focus:outline-none transition-all ${inputStyles}`}
                    placeholder="Nombre del cliente"
                    value={client.name}
                    onChange={(e) => handleNameChange(client.id, e.target.value)}
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${textSecondaryStyles} mb-1`}>Método de pago</label>
                  <div className="flex gap-2">
                    <PaymentOption value="efectivo" label="Efectivo" selected={client.paymentMethod === 'efectivo'} onSelect={() => handlePaymentChange(client.id, 'efectivo')} isDarkMode={isDarkMode} />
                    <PaymentOption value="yape" label="Yape" selected={client.paymentMethod === 'yape'} onSelect={() => handlePaymentChange(client.id, 'yape')} isDarkMode={isDarkMode} />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${textSecondaryStyles} mb-1`}>Monto (S/)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    className={`w-full px-4 py-3 rounded-xl border text-base text-right font-semibold focus:outline-none transition-all ${inputStyles}`}
                    placeholder="0.00"
                    value={client.amount}
                    onChange={(e) => handleAmountChange(client.id, e.target.value)}
                    onBlur={(e) => handleAmountBlur(client.id, e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botones - responsive */}
        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          <button onClick={addRow} className={`px-3 py-2 lg:py-1.5 border rounded-lg lg:rounded text-sm font-medium transition-all lg:transition-none active:scale-95 lg:active:scale-100 ${buttonStyles}`}>
            + Agregar
          </button>
          <button onClick={handleClearAll} className={`px-3 py-2 lg:py-1.5 border rounded-lg lg:rounded text-sm font-medium transition-all lg:transition-none active:scale-95 lg:active:scale-100 ${buttonStyles}`}>
            Limpiar
          </button>
          <button 
            onClick={generatePDF} 
            disabled={getValidClients().length === 0}
            className={`px-3 py-2 lg:py-1.5 border rounded-lg lg:rounded text-sm font-medium transition-all lg:transition-none active:scale-95 lg:active:scale-100 disabled:opacity-50 disabled:active:scale-100 ${buttonPrimaryStyles}`}
          >
            Ticket
          </button>
        </div>

        {/* Resumen - responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className={`lg:col-span-2 ${summaryBgStyles} border ${borderStyles} rounded-xl lg:rounded p-4 lg:p-3 transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${textSecondaryStyles} transition-colors duration-300`}>Total</p>
                <p className={`text-2xl lg:text-xl font-bold ${textPrimaryStyles} transition-colors duration-300`}>S/ {total.toFixed(2)}</p>
                <p className={`text-xs ${textSecondaryStyles} mt-1 transition-colors duration-300`}>{getValidClients().length} items</p>
              </div>
              <div className={`w-12 h-12 lg:w-10 lg:h-10 ${iconBgStyles} rounded-full lg:rounded flex items-center justify-center transition-colors duration-300`}>
                <span className={`text-lg lg:text-base font-bold ${iconTextStyles} transition-colors duration-300`}>S/</span>
              </div>
            </div>
          </div>
          
          <div className={`${summaryBgStyles} border ${borderStyles} rounded-xl lg:rounded p-4 lg:p-3 transition-colors duration-300`}>
            <h3 className={`text-sm lg:text-xs font-semibold ${textSecondaryStyles} mb-3 lg:mb-2 transition-colors duration-300`}>Desglose</h3>
            <div className="space-y-2 lg:space-y-1.5">
              <div className="flex justify-between items-center py-1">
                <span className={`text-sm lg:text-xs ${isDarkMode ? 'text-emerald-400' : 'text-green-700'} transition-colors duration-300`}>Efectivo</span>
                <span className={`text-base lg:text-sm font-semibold ${textPrimaryStyles} transition-colors duration-300`}>S/ {efectivoTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className={`text-sm lg:text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-700'} transition-colors duration-300`}>Yape</span>
                <span className={`text-base lg:text-sm font-semibold ${textPrimaryStyles} transition-colors duration-300`}>S/ {yapeTotal.toFixed(2)}</span>
              </div>
              <div className={`pt-2 border-t ${borderStyles} flex justify-between`}>
                <span className={`text-sm lg:text-xs ${textSecondaryStyles} transition-colors duration-300`}>Filas</span>
                <span className={`text-sm lg:text-xs font-semibold ${textPrimaryStyles} transition-colors duration-300`}>{clients.length}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center py-2 lg:py-4">
          <p className={`text-[10px] lg:text-xs ${textSecondaryStyles} transition-colors duration-300`}>EST 89</p>
          <p className={`text-[10px] lg:text-xs ${textSecondaryStyles} transition-colors duration-300`}>v.1.1</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RestaurantPOS;
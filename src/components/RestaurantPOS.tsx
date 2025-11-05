import React, { useState, useEffect, useCallback } from 'react';

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
}

const PaymentOption: React.FC<PaymentOptionProps> = ({ value, label, selected, onSelect }) => {
  const baseClasses = "px-4 py-2 border-2 rounded-lg cursor-pointer text-xs font-semibold uppercase transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg";
  const selectedClasses = selected 
    ? value === 'yape' 
      ? "border-purple-600 bg-purple-600 text-white" 
      : "border-green-600 bg-green-600 text-white"
    : "border-gray-300 text-gray-700";

  return (
    <div 
      className={`${baseClasses} ${selectedClasses}`}
      onClick={onSelect}
    >
      {label}
    </div>
  );
};

const RestaurantPOS: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: '', paymentMethod: '', amount: '' },
    { id: 2, name: '', paymentMethod: '', amount: '' }
  ]);
  
  const [total, setTotal] = useState<number>(0);
  const [alertMessage, setAlertMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<{ date: string, time: string }>({ date: '', time: '' });

  const updateDateTime = useCallback(() => {
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    
    setCurrentDateTime({
      date: now.toLocaleDateString('es-PE', dateOptions),
      time: now.toLocaleTimeString('es-PE', timeOptions)
    });
  }, []);

  const showAlert = useCallback((message: string, type: 'success' | 'error') => {
    setAlertMessage({ text: message, type });
    setTimeout(() => setAlertMessage(null), 3000);
  }, []);

  const calculateTotal = useCallback(() => {
    const newTotal = clients.reduce((sum, client) => {
      const amountValue = client.amount.replace(/[^\d.]/g, '');
      return amountValue && parseFloat(amountValue) > 0 ? sum + parseFloat(amountValue) : sum;
    }, 0);
    
    setTotal(newTotal);
  }, [clients]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  useEffect(() => {
    updateDateTime();
  }, [updateDateTime]);

  const handleNameChange = (id: number, value: string) => {
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, name: value } : client
      )
    );
  };

  const handlePaymentChange = (id: number, method: 'efectivo' | 'yape') => {
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, paymentMethod: method } : client
      )
    );
  };

  const handleAmountChange = (id: number, value: string) => {
    let formattedValue = value.replace(/[^\d.]/g, '');
    const parts = formattedValue.split('.');
    
    if (parts.length > 2) {
      formattedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts[1] && parts[1].length > 2) {
      formattedValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, amount: formattedValue } : client
      )
    );
  };

  const handleAmountBlur = (id: number, value: string) => {
    let formattedValue = value.replace(/[^\d.]/g, '');
    
    if (formattedValue && parseFloat(formattedValue) > 0) {
      formattedValue = parseFloat(formattedValue).toFixed(2);
    } else {
      formattedValue = '';
    }
    
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, amount: formattedValue } : client
      )
    );
  };

  const addRow = () => {
    const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    setClients(prev => [
      ...prev,
      { id: newId, name: '', paymentMethod: '', amount: '' }
    ]);
    showAlert('✓ Nueva fila agregada correctamente', 'success');
  };

  const deleteRow = (id: number) => {
    if (clients.length <= 1) {
      showAlert('⚠ Debe haber al menos una fila en la tabla', 'error');
      return;
    }
    
    setClients(prev => prev.filter(client => client.id !== id));
    showAlert('✓ Fila eliminada correctamente', 'success');
  };

  const clearAll = () => {
    if (window.confirm('¿Está seguro de que desea limpiar todos los datos? Esta acción no se puede deshacer.')) {
      setClients([{ id: 1, name: '', paymentMethod: '', amount: '' }]);
      showAlert('✓ Todos los datos han sido limpiados', 'success');
    }
  };

  const handlePrint = () => {
    updateDateTime();
    
    const hasValidData = clients.some(client => 
      client.name.trim() && client.amount && parseFloat(client.amount) > 0
    );
    
    if (!hasValidData && !window.confirm('No hay datos completos para imprimir. ¿Desea continuar con la impresión?')) {
      return;
    }
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        sendCutCommand();
      }, 1000);
    }, 300);
  };

  const sendCutCommand = () => {
    try {
      console.log('Comando de corte enviado');
    } catch (error) {
      console.log('No se pudo enviar comando de corte automático');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addRow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 py-5 px-4">
      {/* VISTA EN PANTALLA */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 mb-6">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2 font-playfair">RESTAURANT MARY'S</h1>
        <div className="text-center text-gray-600 text-sm mb-6">Sistema de Punto de Venta - Complete la información para impresión POS</div>
        
        {alertMessage && (
          <div className={`p-4 rounded-lg mb-4 border-l-4 ${
            alertMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 border-green-500' 
              : 'bg-red-100 text-red-800 border-red-500'
          }`}>
            {alertMessage.text}
          </div>
        )}
        
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="w-12 py-3 px-2 text-center text-xs font-semibold uppercase">Nº</th>
                <th className="py-3 px-2 text-center text-xs font-semibold uppercase">Nombre del Cliente</th>
                <th className="py-3 px-2 text-center text-xs font-semibold uppercase">Método de Pago</th>
                <th className="py-3 px-2 text-center text-xs font-semibold uppercase">Monto (S/)</th>
                <th className="w-20 py-3 px-2 text-center text-xs font-semibold uppercase">Acción</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr key={client.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 text-center text-sm font-medium">{index + 1}</td>
                  <td className="py-3 px-2">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center uppercase focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Escriba el nombre"
                      value={client.name}
                      onChange={(e) => handleNameChange(client.id, e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex justify-center gap-2">
                      <PaymentOption 
                        value="efectivo"
                        label="Efectivo"
                        selected={client.paymentMethod === 'efectivo'}
                        onSelect={() => handlePaymentChange(client.id, 'efectivo')}
                      />
                      <PaymentOption 
                        value="yape"
                        label="Yape"
                        selected={client.paymentMethod === 'yape'}
                        onSelect={() => handlePaymentChange(client.id, 'yape')}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="0.00"
                      value={client.amount}
                      onChange={(e) => handleAmountChange(client.id, e.target.value)}
                      onBlur={(e) => handleAmountBlur(client.id, e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button 
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105"
                      onClick={() => deleteRow(client.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button 
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-center gap-2"
            onClick={addRow}
          >
            ➕ Agregar Cliente
          </button>
          <button 
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-center gap-2"
            onClick={clearAll}
          >
            🗑️ Limpiar Todo
          </button>
          <button 
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-center gap-2"
            onClick={handlePrint}
          >
            🖨️ Imprimir Recibo
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-gray-200 text-right">
          <div className="text-lg font-semibold text-gray-800 mb-2 uppercase font-playfair">Total Vendido:</div>
          <div className="text-3xl font-bold text-green-600 font-playfair">S/ {total.toFixed(2)}</div>
        </div>
        
        <div className="mt-6 bg-yellow-50 p-5 rounded-lg border-l-4 border-yellow-400 text-sm text-yellow-800">
          <strong className="text-base">📋 Instrucciones de Uso:</strong><br />
          1. Complete el nombre del cliente y el monto de compra<br />
          2. Seleccione el método de pago (Efectivo o Yape)<br />
          3. Agregue más clientes con el botón "Agregar Cliente"<br />
          4. Presione "Imprimir Recibo" para generar el ticket POS<br />
          <strong className="text-base mt-2 block">⚠️ Configuración del Corte Automático:</strong><br />
          • <strong>Windows:</strong> Panel de Control → Dispositivos e Impresoras → Clic derecho en su impresora → Preferencias de impresión → Busque "Auto-cut" o "Corte automático" y actívelo<br />
          • <strong>Drivers específicos:</strong> Algunas impresoras requieren instalar drivers oficiales del fabricante (Epson TM, Star Micronics, etc.) que incluyen la opción de corte automático<br />
          • <strong>Alternativa:</strong> Si no puede activar el corte automático, agregué espacio extra al final del ticket para facilitar el corte manual
        </div>
      </div>

      {/* VISTA PARA IMPRESIÓN POS */}
      <div className="pos-container hidden print:block w-[80mm] bg-white p-[5mm] mx-auto font-mono text-[11px] leading-tight">
        <div className="pos-header text-center border-b-2 border-black py-3 mb-2">
          <div className="pos-title text-lg font-bold mb-2 tracking-widest">MARY'S RESTAURANT</div>
          <div className="pos-subtitle text-[10px]">RUC: 20505262086</div>
          <div className="pos-subtitle text-[10px]">Fecha: {currentDateTime.date}</div>
          <div className="pos-subtitle text-[10px]">Hora: {currentDateTime.time}</div>
        </div>
        
        <div className="client-row header-row flex border-b-2 border-black py-2 font-bold">
          <div className="client-number w-1/10 text-center">N°</div>
          <div className="client-name w-[45%] px-1">CLIENTE</div>
          <div className="client-payment w-1/5 text-center">PAGO</div>
          <div className="client-amount w-1/4 text-right pr-1">MONTO</div>
        </div>
        
        <div id="posContent">
          {clients.map((client, index) => {
            const amountValue = client.amount.replace(/[^\d.]/g, '');
            const amount = amountValue && parseFloat(amountValue) > 0 
              ? 'S/ ' + parseFloat(amountValue).toFixed(2) 
              : 'S/ 0.00';
              
            return (
              <div className="client-row flex border-b border-dotted border-gray-400 py-2 text-[10px] min-h-8 items-center" key={client.id}>
                <div className="client-number w-1/10 text-center font-bold">{index + 1}</div>
                <div className="client-name w-[45%] px-1 break-words leading-tight font-bold">
                  {client.name.trim().toUpperCase() || '(SIN NOMBRE)'}
                </div>
                <div className="client-payment w-1/5 text-center leading-tight">
                  <span className={`payment-option-print border-2 border-black px-2 py-1 text-[8px] font-bold inline-block min-w-[45px] ${client.paymentMethod}`}>
                    {client.paymentMethod ? client.paymentMethod.toUpperCase() : '---'}
                  </span>
                </div>
                <div className="client-amount w-1/4 text-right pr-1 font-bold leading-tight">{amount}</div>
              </div>
            );
          })}
        </div>
        
        <div className="pos-total text-right mt-3 pt-2 border-t-2 border-black text-xs font-bold">
          <div className="pos-total-label text-[11px] mb-1">======════════════════</div>
          <div className="pos-total-amount text-base">TOTAL: S/ {total.toFixed(2)}</div>
          <div className="pos-total-label text-[11px] mt-1">======════════════════</div>
        </div>
        
        <div className="pos-footer text-center mt-5 pt-3 border-t-2 border-dashed border-black text-[10px] leading-relaxed">
          <div className="font-bold text-[11px]">*** REGISTRO DE VENTAS ***</div>
          <div className="my-2">generado por @jozzymar</div>
          <div>@restaurantmarys</div>
          <div className="h-[15mm]"></div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantPOS;
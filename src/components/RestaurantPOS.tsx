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
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 ${
        selected
          ? value === 'efectivo'
            ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
            : 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      {label}
    </button>
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
    showAlert('Nueva fila agregada correctamente', 'success');
  };

  const deleteRow = (id: number) => {
    if (clients.length <= 1) {
      showAlert('Debe haber al menos una fila en la tabla', 'error');
      return;
    }
    
    setClients(prev => prev.filter(client => client.id !== id));
    showAlert('Fila eliminada correctamente', 'success');
  };

  const clearAll = () => {
    if (window.confirm('¿Está seguro de que desea limpiar todos los datos? Esta acción no se puede deshacer.')) {
      setClients([{ id: 1, name: '', paymentMethod: '', amount: '' }]);
      showAlert('Todos los datos han sido limpiados', 'success');
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
    }, 300);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">🍽️</span>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Mary's</h1>
            <p className="text-gray-600 text-sm">Sistema de Punto de Venta</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Alert */}
        {alertMessage && (
          <div className={`mb-6 p-4 rounded-xl border-l-4 ${
            alertMessage.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <span>{alertMessage.type === 'success' ? '✅' : '⚠️'}</span>
              <span className="font-medium">{alertMessage.text}</span>
            </div>
          </div>
        )}

        {/* Client Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Registro de Ventas</h2>
            <p className="text-gray-600 text-sm">Complete la información de los clientes</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Método de Pago</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto (S/)</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client, index) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="py-4 px-4">
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nombre del cliente"
                        value={client.name}
                        onChange={(e) => handleNameChange(client.id, e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
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
                    <td className="py-4 px-4">
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                        value={client.amount}
                        onChange={(e) => handleAmountChange(client.id, e.target.value)}
                        onBlur={(e) => handleAmountBlur(client.id, e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => deleteRow(client.id)}
                        title="Eliminar fila"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
            onClick={addRow}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Cliente
          </button>
          
          <button 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
            onClick={clearAll}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpiar Todo
          </button>
          
          <button 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/25"
            onClick={handlePrint}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Recibo
          </button>
        </div>

        {/* Total Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Vendido</h3>
              <p className="text-gray-600 text-sm">Suma total de todas las ventas</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-700">S/ {total.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mt-1">{clients.length} cliente(s)</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Instrucciones de Uso</h4>
              <ul className="text-amber-800 text-sm space-y-1">
                <li>• Complete el nombre del cliente y el monto de compra</li>
                <li>• Seleccione el método de pago (Efectivo o Yape)</li>
                <li>• Agregue más clientes con el botón "Agregar Cliente"</li>
                <li>• Presione "Imprimir Recibo" para generar el ticket POS</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Vista para Impresión POS (se mantiene igual) */}
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

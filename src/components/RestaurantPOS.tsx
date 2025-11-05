import React, { useState, useEffect, useCallback, useRef } from 'react';

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
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${
        selected
          ? value === 'efectivo'
            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
            : 'border-violet-500 bg-violet-500 text-white shadow-sm'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
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

  const posContentRef = useRef<HTMLDivElement>(null);
  const posTotalAmountRef = useRef<HTMLDivElement>(null);

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
    
    if (posContentRef.current && posTotalAmountRef.current) {
      let printTotal = 0;
      const printContent = clients.map((client, index) => {
        const amountValue = client.amount.replace(/[^\d.]/g, '');
        const amount = amountValue && parseFloat(amountValue) > 0 ? parseFloat(amountValue) : 0;
        
        if (amount > 0) {
          printTotal += amount;
        }
        
        return {
          number: index + 1,
          name: client.name.trim().toUpperCase() || '(SIN NOMBRE)',
          payment: client.paymentMethod ? client.paymentMethod.toUpperCase() : '---',
          paymentClass: client.paymentMethod,
          amount: amount > 0 ? `S/ ${amount.toFixed(2)}` : 'S/ 0.00',
          amountValue: amount
        };
      });

      posContentRef.current.innerHTML = printContent.map(client => `
        <div class="client-row">
          <div class="client-number">${client.number}</div>
          <div class="client-name">${client.name}</div>
          <div class="client-payment">
            <span class="payment-option-print ${client.paymentClass}">${client.payment}</span>
          </div>
          <div class="client-amount">${client.amount}</div>
        </div>
      `).join('');

      posTotalAmountRef.current.textContent = `TOTAL: S/ ${printTotal.toFixed(2)}`;
    }

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
    <>
      {/* VISTA EN PANTALLA - SE OCULTA AL IMPRIMIR */}
      <div className="screen-container min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8 px-4 print:hidden">
        {/* Header Mejorado */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-3 bg-white rounded-2xl px-8 py-6 shadow-sm border border-gray-200 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-playfair">MARY'S RESTAURANT</h1>
                <p className="text-gray-600 text-sm mt-1">Sistema de Punto de Venta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Alert Mejorado */}
          {alertMessage && (
            <div className={`mb-6 p-4 rounded-xl border ${
              alertMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  alertMessage.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}></span>
                <span className="font-medium">{alertMessage.text}</span>
              </div>
            </div>
          )}

          {/* Client Table Mejorada */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 text-center">Registro de Ventas</h2>
              <p className="text-gray-600 text-sm text-center mt-1">Complete la información de los clientes</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b border-gray-300">
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider w-12">#</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Cliente</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider w-32">Método de Pago</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider w-28">Monto (S/)</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client, index) => (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900 text-center">{index + 1}</td>
                      <td className="py-4 px-4">
                        <input 
                          type="text" 
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-center"
                          placeholder="Nombre del cliente"
                          value={client.name}
                          onChange={(e) => handleNameChange(client.id, e.target.value)}
                        />
                      </td>
                      <td className="py-4 px-4">
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
                      <td className="py-4 px-4 text-center w-28">
                        <input 
                          type="text" 
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                          placeholder="0.00"
                          value={client.amount}
                          onChange={(e) => handleAmountChange(client.id, e.target.value)}
                          onBlur={(e) => handleAmountBlur(client.id, e.target.value)}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          onClick={() => deleteRow(client.id)}
                          title="Eliminar fila"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Action Buttons Mejorados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button 
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
              onClick={addRow}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Cliente
            </button>
            
            <button 
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
              onClick={clearAll}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar Todo
            </button>
            
            <button 
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl text-white font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-lg shadow-slate-500/25"
              onClick={handlePrint}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Recibo
            </button>
          </div>

          {/* Total Section Mejorado */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl p-8 border border-slate-300 mb-8">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">Total Vendido</h3>
              <p className="text-slate-600 text-sm mb-4">Suma total de todas las ventas</p>
              <div className="text-4xl font-bold text-slate-900">S/ {total.toFixed(2)}</div>
              <div className="text-sm text-slate-600 mt-3 bg-white px-3 py-1 rounded-full border border-slate-300">
                {clients.length} cliente(s) registrado(s)
              </div>
            </div>
          </div>

          {/* Instructions Mejorado */}
          <div className="bg-slate-100 rounded-2xl p-6 border border-slate-300">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 text-lg mb-3">Instrucciones de Uso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Complete el nombre del cliente y el monto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Seleccione el método de pago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Agregue más clientes si es necesario</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span>Presione "Imprimir Recibo" para el ticket</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VISTA PARA IMPRESIÓN POS - SOLO SE MUESTRA AL IMPRIMIR */}
      <div className="pos-container hidden print:block w-[80mm] bg-white p-[5mm] mx-auto font-mono text-[11px] leading-tight box-border">
        <div className="pos-header text-center border-b-2 border-black py-3 mb-2">
          <div className="pos-title text-lg font-bold mb-2 tracking-widest">MARY'S RESTAURANT </div>
          <div className="pos-subtitle text-[10px]">RUC: 20505262086</div>
          <div className="pos-subtitle text-[10px]">Fecha: {currentDateTime.date}</div>
          <div className="pos-subtitle text-[10px]">Hora: {currentDateTime.time}</div>
        </div>
        
        <div className="client-row header-row flex border-b-2 border-black py-2 font-bold">
          <div className="client-number w-[12%] text-center">N°</div>
          <div className="client-name w-[48%] px-1 text-center">CLIENTE</div>
          <div className="client-payment w-[20%] text-center">PAGO</div>
          <div className="client-amount w-[20%] text-right pr-1">MONTO</div>
        </div>
        
        <div id="posContent" ref={posContentRef}>
          {/* Aquí se inserta el contenido dinámicamente */}
        </div>
        
        <div className="pos-total text-right mt-3 pt-2 border-t-2 border-black text-xs font-bold">
          <div className="pos-total-label text-[11px] mb-1">═══════════════════════</div>
          <div className="pos-total-amount text-base" id="posTotalAmount" ref={posTotalAmountRef}>TOTAL: S/ 0.00</div>
          <div className="pos-total-label text-[11px] mt-1">═══════════════════════</div>
        </div>
        
        <div className="pos-footer text-center mt-5 pt-3 border-t-2 border-dashed border-black text-[10px] leading-relaxed">
          <div className="font-bold text-[11px]">*** REGISTRO DE VENTAS ***</div>
          <div style={{ margin: '8px 0' }}>generado por @jozzymar</div>
          <div>@restaurantmarys</div>
          
          {/* ESPACIO EXTRA PARA CORTE MANUAL */}
          <div style={{ 
            height: '25mm', 
            borderTop: '2px dashed #000',
            marginTop: '10px',
            textAlign: 'center',
            fontSize: '8px',
            color: '#666',
            paddingTop: '5px'
          }}>
            --- CORTAR AQUÍ ---
          </div>
        </div>
      </div>

      {/* ESTILOS DE IMPRESIÓN EN COMPONENTE */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 80mm !important;
            min-height: auto !important;
            height: auto !important;
          }
          .screen-container {
            display: none !important;
          }
          .pos-container {
            display: block !important;
            width: 80mm !important;
            padding: 5mm !important;
            padding-bottom: 0 !important;
            margin: 0 !important;
            font-family: 'Courier New', monospace !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
            box-sizing: border-box !important;
          }
          .pos-header {
            page-break-inside: avoid !important;
          }
          .client-row {
            page-break-inside: avoid !important;
          }
          .pos-footer {
            page-break-inside: avoid !important;
            margin-top: 15px !important;
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
          }
          .pos-footer::after {
            content: "";
            display: block;
            page-break-after: always !important;
          }
        }
        
        @page {
          size: 80mm auto;
          margin: 0;
          margin-bottom: 0;
        }

        .pos-container {
          display: none;
        }

        .client-row {
          display: flex;
          border-bottom: 1px dotted #999;
          padding: 8px 0;
          font-size: 10px;
          line-height: 1.5;
          min-height: 32px;
          align-items: center;
        }
        .client-number {
          width: 12%;
          text-align: center;
          font-weight: bold;
          font-size: 10px;
        }
        .client-name {
          width: 48%;
          padding: 0 5px;
          word-break: break-word;
          line-height: 1.4;
          font-weight: bold;
          font-size: 12px;
        }
        .client-payment {
          width: 20%;
          text-align: center;
          line-height: 1.4;
          font-size: 10px;
        }
        .client-amount {
          width: 20%;
          text-align: right;
          padding-right: 5px;
          font-weight: bold;
          line-height: 1.4;
          font-size: 10px;
          word-break: keep-all;
        }
        .payment-option-print {
          border: 1.5px solid #000;
          padding: 3px 6px;
          font-size: 8px;
          display: inline-block;
          min-width: 45px;
          font-weight: bold;
        }
        .payment-option-print.yape {
          border: 2px solid #000;
        }
        .payment-option-print.efectivo {
          border: 2px solid #000;
        }
        .header-row {
          font-weight: bold;
          border-bottom: 2px solid #000 !important;
          background: none !important;
          padding: 10px 0 !important;
        }
      `}</style>
    </>
  );
};

export default RestaurantPOS;



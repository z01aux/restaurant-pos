import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Registro de fuentes para PDF
Font.register({
  family: 'Courier',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/courierprime/v9/u-450q2lgwslOqpF_6gQ8kELaw9pWt_-.ttf' }
  ]
});

// Estilos para PDF
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 11,
    fontFamily: 'Courier'
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 10
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 3
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    borderBottomStyle: 'dotted',
    paddingVertical: 6,
    alignItems: 'center'
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingVertical: 8,
    fontWeight: 'bold'
  },
  colNumber: {
    width: '12%',
    textAlign: 'center'
  },
  colName: {
    width: '48%',
    paddingHorizontal: 5
  },
  colPayment: {
    width: '20%',
    textAlign: 'center'
  },
  colAmount: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 5
  },
  total: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#000',
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold'
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 10,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#000',
    borderTopStyle: 'dashed'
  },
  paymentBadge: {
    borderWidth: 1.5,
    borderColor: '#000',
    padding: '3 6',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    display: 'inline'
  }
});

// Componente PDF
const POSPDF = ({ clients, total, dateTime }: any) => (
  <Document>
    <Page size={[226, 'auto']} style={styles.page} wrap>
      <View style={styles.header} fixed>
        <Text style={styles.title}>MARY'S RESTAURANT</Text>
        <Text style={styles.subtitle}>RUC: 20505262086</Text>
        <Text style={styles.subtitle}>Fecha: {dateTime.date}</Text>
        <Text style={styles.subtitle}>Hora: {dateTime.time}</Text>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.colNumber}>N°</Text>
        <Text style={styles.colName}>CLIENTE</Text>
        <Text style={styles.colPayment}>PAGO</Text>
        <Text style={styles.colAmount}>MONTO</Text>
      </View>

      {clients.map((client: any, index: number) => {
        const amount = parseFloat(client.amount) || 0;
        return (
          <View style={styles.row} key={client.id} wrap={false}>
            <Text style={styles.colNumber}>{index + 1}</Text>
            <Text style={styles.colName}>{client.name.toUpperCase() || '(SIN NOMBRE)'}</Text>
            <Text style={styles.colPayment}>
              {client.paymentMethod ? client.paymentMethod.toUpperCase() : '---'}
            </Text>
            <Text style={styles.colAmount}>S/ {amount.toFixed(2)}</Text>
          </View>
        );
      })}

      <View style={styles.total}>
        <Text>TOTAL: S/ {total.toFixed(2)}</Text>
      </View>

      <View style={styles.footer}>
        <Text>*** REGISTRO DE VENTAS ***</Text>
        <Text style={{ marginTop: 5 }}>generado por @jozzymar</Text>
        <Text>@restaurantmarys</Text>
        <Text style={{ marginTop: 10, fontSize: 8, color: '#666' }}>--- CORTAR AQUÍ ---</Text>
      </View>
    </Page>
  </Document>
);

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
  compact?: boolean;
}

const PaymentOption: React.FC<PaymentOptionProps> = ({ value, label, selected, onSelect }) => {
  return (
    <button
      className={`flex-1 sm:flex-none px-4 py-3 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-lg font-medium transition-all duration-200 border-2 ${
        selected
          ? value === 'efectivo'
            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200'
            : 'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-200'
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
  const [showPDFPreview, setShowPDFPreview] = useState(false);

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
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [updateDateTime]);

  const handleNameChange = (id: number, value: string) => {
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, name: value.toUpperCase() } : client
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

  const getValidClients = () => {
    return clients.filter(client => 
      client.name.trim() && client.amount && parseFloat(client.amount) > 0
    );
  };

  return (
    <>
      {/* VISTA EN PANTALLA - DISEÑO MEJORADO */}
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 py-3 sm:py-6 px-3 sm:px-4">
        {/* Header Premium */}
        <div className="max-w-5xl mx-auto mb-4 sm:mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/80 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
                  <span className="text-2xl sm:text-3xl">🍽️</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    MARY'S RESTAURANT
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Sistema de registro de ventas delivery
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl">
                <div className="text-right">
                  <div className="text-xs text-gray-600">{currentDateTime.date}</div>
                  <div className="font-mono font-bold text-slate-800">{currentDateTime.time}</div>
                </div>
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {alertMessage && (
          <div className="max-w-5xl mx-auto mb-4">
            <div className={`p-4 rounded-xl border ${
              alertMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  alertMessage.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}></span>
                <span className="font-medium text-sm">{alertMessage.text}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Clientes */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Registro de Ventas</h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">Complete la información de los clientes</p>
            </div>

            {/* Vista Mobile Cards */}
            <div className="sm:hidden p-4 space-y-4">
              {clients.map((client, index) => (
                <div key={client.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">Cliente #{index + 1}</span>
                    </div>
                    <button 
                      className="w-10 h-10 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      onClick={() => deleteRow(client.id)}
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Nombre del Cliente</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                        placeholder="Ingrese nombre completo"
                        value={client.name}
                        onChange={(e) => handleNameChange(client.id, e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Método de Pago</label>
                      <div className="flex gap-3">
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
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Monto (S/)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
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

            {/* Vista Desktop Tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">#</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">Pago</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Monto (S/)</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client, index) => (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900 text-center">{index + 1}</td>
                      <td className="py-4 px-4">
                        <input 
                          type="text" 
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-gray-50"
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
                      <td className="py-4 px-4">
                        <input 
                          type="text" 
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all bg-gray-50"
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

          {/* Barra de Acciones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <button 
              className="col-span-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm"
              onClick={addRow}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Agregar</span>
            </button>
            
            <button 
              className="col-span-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-rose-400 hover:bg-rose-50 transition-all shadow-sm"
              onClick={clearAll}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Limpiar</span>
            </button>

            <button 
              className="col-span-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white font-medium hover:from-slate-900 hover:to-slate-950 transition-all shadow-lg shadow-slate-500/25"
              onClick={() => window.print()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir</span>
            </button>

            <PDFDownloadLink
              document={<POSPDF clients={getValidClients()} total={total} dateTime={currentDateTime} />}
              fileName={`venta-${currentDateTime.date.replace(/\//g, '-')}.pdf`}
              className="col-span-1"
            >
              {({ loading }) => (
                <button 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl text-white font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/25"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{loading ? 'Generando...' : 'PDF'}</span>
                </button>
              )}
            </PDFDownloadLink>
          </div>

          {/* Total y Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm mb-1">Total Vendido</p>
                  <p className="text-4xl font-bold">S/ {total.toFixed(2)}</p>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-slate-300 text-sm">
                  {getValidClients().length} cliente(s) con ventas registradas
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Efectivo</span>
                  <span className="font-medium">
                    S/ {clients.filter(c => c.paymentMethod === 'efectivo' && c.amount)
                      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Yape</span>
                  <span className="font-medium">
                    S/ {clients.filter(c => c.paymentMethod === 'yape' && c.amount)
                      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between font-semibold">
                    <span>Total filas</span>
                    <span>{clients.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .screen-container, .min-h-screen {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default RestaurantPOS;

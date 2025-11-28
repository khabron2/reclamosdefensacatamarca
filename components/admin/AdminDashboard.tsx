
import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, CalendarDays, Printer, ChevronLeft, ChevronRight, Users, Building2, FileText, ExternalLink, Clock } from 'lucide-react';
import { fetchComplaints } from '../../services/sheetService';
import { Complaint, HearingSlot } from '../../types';

interface AdminDashboardProps {
  onBack: () => void;
}

// Configuración de Feriados (Formato YYYY-MM-DD)
const HOLIDAYS_2025 = [
  '2025-01-01', // Año Nuevo
  '2025-03-03', // Carnaval
  '2025-03-04', // Carnaval
  '2025-03-24', // Memoria
  '2025-04-02', // Malvinas
  '2025-04-18', // Viernes Santo
  '2025-05-01', // Trabajador
  '2025-05-25', // Revolución Mayo
  '2025-06-17', // Güemes
  '2025-06-20', // Bandera
  '2025-07-09', // Independencia
  '2025-08-17', // San Martín
  '2025-10-12', // Diversidad
  '2025-11-20', // Soberanía
  '2025-12-08', // Inmaculada
  '2025-12-25', // Navidad
];

// Configuración Horaria
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00'];
const CAPACITY_PER_SLOT = 2; // 2 audiencias por hora

// Helper para formatear fecha localmente
const formatDateKey = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [scheduleMap, setScheduleMap] = useState<Record<string, HearingSlot[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, users: 0, companies: 0 });
  
  // Fecha que se está visualizando en la tabla
  const [viewDate, setViewDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateKey(tomorrow);
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchComplaints();
      setComplaints(data);
      
      const uniqueUsers = new Set(data.map(c => c.email)).size;
      const uniqueCompanies = new Set(data.map(c => c.denouncedCompany)).size;
      
      setStats({
        total: data.length,
        users: uniqueUsers,
        companies: uniqueCompanies
      });
      
      calculateFullSchedule(data);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isBusinessDay = (date: Date) => {
    const day = date.getDay();
    const dateString = formatDateKey(date);
    return day !== 0 && day !== 6 && !HOLIDAYS_2025.includes(dateString);
  };

  const getDayStatus = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); 
    if (HOLIDAYS_2025.includes(dateString)) return 'Feriado';
    if (date.getDay() === 0 || date.getDay() === 6) return 'Fin de Semana';
    return 'Hábil';
  };

  const calculateFullSchedule = (allComplaints: Complaint[]) => {
    // Ordenar reclamos: Los más viejos primero (FIFO) para darles prioridad en la agenda.
    // fetchComplaints devuelve del más nuevo al más viejo (índice 0 = hoy).
    // Invertimos para asignar primero los reclamos viejos.
    const pendingComplaints = [...allComplaints].reverse();

    const map: Record<string, HearingSlot[]> = {};
    let currentComplaintIndex = 0;
    
    // Empezamos a calcular desde "Mañana"
    const calculationDate = new Date();
    calculationDate.setDate(calculationDate.getDate() + 1); 

    let daysProcessed = 0;

    // Calculamos hasta 365 días o hasta que se acaben los reclamos
    while (currentComplaintIndex < pendingComplaints.length && daysProcessed < 365) {
      if (isBusinessDay(calculationDate)) {
        const dateKey = formatDateKey(calculationDate);
        const dailySlots: HearingSlot[] = [];
        
        for (const time of TIME_SLOTS) {
          for (let i = 0; i < CAPACITY_PER_SLOT; i++) {
            if (currentComplaintIndex < pendingComplaints.length) {
              const comp = pendingComplaints[currentComplaintIndex];
              dailySlots.push({
                time: time,
                complaintId: comp.id,
                claimant: comp.fullName,
                defendant: comp.denouncedCompany
              });
              currentComplaintIndex++;
            }
          }
        }

        if (dailySlots.length > 0) {
          map[dateKey] = dailySlots;
        }
      }
      calculationDate.setDate(calculationDate.getDate() + 1);
      daysProcessed++;
    }

    setScheduleMap(map);
  };

  const changeDay = (days: number) => {
    const date = new Date(viewDate + 'T00:00:00');
    date.setDate(date.getDate() + days);
    setViewDate(formatDateKey(date));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dailySlots = scheduleMap[viewDate] || [];
    const dateObj = new Date(viewDate + 'T00:00:00');
    
    let printRows = [];
    for (const time of TIME_SLOTS) {
      const slotsForTime = dailySlots.filter(s => s.time === time);
      for (let i = 0; i < CAPACITY_PER_SLOT; i++) {
        printRows.push({
          time: i === 0 ? time : '', 
          slot: slotsForTime[i] || null
        });
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audiencias - ${viewDate}</title>
          <style>
            body { font-family: "Courier New", Courier, monospace; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            h1 { font-size: 20px; margin: 0; text-transform: uppercase; }
            h2 { font-size: 16px; margin: 5px 0; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: middle; height: 35px; }
            th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
            .time-col { width: 80px; text-align: center; font-weight: bold; font-size: 16px; }
            @media print { button { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Defensa del Consumidor Catamarca</h1>
            <h2>LISTADO DE AUDIENCIAS</h2>
            <h2 style="font-weight: bold; margin-top: 10px; text-transform: uppercase;">
              FECHA: ${dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <table>
            <thead><tr><th class="time-col">HORARIO</th><th>EXPEDIENTE / PARTES</th></tr></thead>
            <tbody>
              ${printRows.map(row => `
                <tr>
                  <td class="time-col">${row.time}</td>
                  <td>${row.slot ? `<div style="font-weight: bold;">${row.slot.claimant}</div><div>C/ ${row.slot.defendant}</div>` : ``}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const renderTableRows = () => {
    const dailySlots = scheduleMap[viewDate] || [];
    const rows = [];
    const dayStatus = getDayStatus(viewDate);

    if (dayStatus !== 'Hábil') {
      return (
        <tr>
          <td colSpan={3} className="px-6 py-12 text-center bg-slate-50">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <CalendarDays className="w-12 h-12 mb-2 opacity-20" />
              <span className="text-lg font-medium text-slate-500">No se programan audiencias</span>
              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full mt-2 border border-orange-200">
                Es {dayStatus}
              </span>
            </div>
          </td>
        </tr>
      );
    }

    for (const time of TIME_SLOTS) {
      const slotsForTime = dailySlots.filter(s => s.time === time);
      for (let i = 0; i < CAPACITY_PER_SLOT; i++) {
        const slot = slotsForTime[i];
        rows.push(
          <tr key={`${time}-${i}`} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
            <td className={`px-6 py-4 text-center font-bold text-slate-700 border-r border-slate-100 ${i === 0 ? '' : 'text-transparent'}`}>
              {time}
            </td>
            <td className="px-6 py-4">
              {slot ? (
                <div>
                  <div className="font-bold text-slate-800 uppercase flex items-center gap-2">
                    {slot.claimant}
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-normal normal-case">
                      Exp: {slot.complaintId.split('-').pop()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mt-1 pl-4 border-l-2 border-institutional/30">
                    <span className="text-xs text-slate-400 mr-1">C/</span>
                    <span className="uppercase font-medium">{slot.defendant}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-300 text-sm italic flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                  Espacio disponible
                </div>
              )}
            </td>
          </tr>
        );
      }
    }
    return rows;
  };

  // Obtain last 5 complaints
  const recentComplaints = complaints.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Volver">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Panel Administrativo</h1>
          </div>
          <button onClick={loadData} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* 1. SECCIÓN DE ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Reclamos</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Usuarios Únicos</p>
              <p className="text-2xl font-bold text-slate-800">{stats.users}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-full text-purple-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Empresas Denunciadas</p>
              <p className="text-2xl font-bold text-slate-800">{stats.companies}</p>
            </div>
          </div>
        </div>

        {/* 2. ÚLTIMOS RECLAMOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Últimos Ingresos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3">ID / Fecha</th>
                  <th className="px-6 py-3">Denunciante</th>
                  <th className="px-6 py-3">Empresa</th>
                  <th className="px-6 py-3">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentComplaints.length > 0 ? (
                  recentComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {c.id}
                        <div className="text-xs text-slate-500 font-normal">
                          {new Date(c.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-3">{c.fullName}</td>
                      <td className="px-6 py-3 text-slate-600">{c.denouncedCompany}</td>
                      <td className="px-6 py-3">
                        {c.pdfUrl ? (
                          <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                            Ver <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No disponible</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No hay reclamos registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. GESTIÓN DE AUDIENCIAS (CALENDARIO) */}
        <div className="border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-institutional" />
            Cronograma de Audiencias Automáticas
          </h2>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
               <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                 <ChevronLeft className="w-5 h-5" />
               </button>
               
               <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-slate-50">
                 <input 
                    type="date" 
                    value={viewDate}
                    onChange={(e) => setViewDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-800 font-bold text-sm uppercase cursor-pointer"
                  />
               </div>

               <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                 <ChevronRight className="w-5 h-5" />
               </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
               <span className={`text-xs px-3 py-1 rounded-full border font-medium hidden sm:inline-block
                  ${getDayStatus(viewDate) === 'Hábil' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                  }`}
               >
                  {getDayStatus(viewDate)}
               </span>
               <button 
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
               >
                 <Printer className="w-4 h-4" />
                 <span className="sm:hidden">Imprimir</span>
                 <span className="hidden sm:inline">Imprimir Día</span>
               </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
             <div className="bg-yellow-200/50 border-b border-slate-300 p-4 text-center">
                <h2 className="text-slate-800 font-bold uppercase tracking-wider text-sm sm:text-base">
                   {new Date(viewDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 text-xs uppercase">
                     <th className="px-6 py-3 text-center w-24 border-r border-slate-200">Horario</th>
                     <th className="px-6 py-3">Denunciante C/ Denunciado</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                   {renderTableRows()}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

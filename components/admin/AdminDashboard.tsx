import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Users, Loader2, RefreshCw, ExternalLink, Image as ImageIcon, FileCheck } from 'lucide-react';
import { fetchComplaints } from '../../services/sheetService';
import { Complaint } from '../../types';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, users: 0 });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchComplaints();
      setComplaints(data);
      
      // Calculate Stats
      const uniqueUsers = new Set(data.map(c => c.email)).size;
      setStats({
        total: data.length,
        users: uniqueUsers
      });
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Volver al formulario público"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold leading-tight">Panel Administrativo</h1>
              <p className="text-xs text-slate-400">Defensa del Consumidor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadData}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-institutional flex items-center justify-center font-bold text-sm">
                DC
              </div>
              <span className="text-sm font-medium hidden sm:block">Administrador</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard 
            title="Total Reclamos" 
            value={isLoading ? "..." : stats.total.toString()} 
            icon={<FileText className="w-6 h-6 text-blue-600" />} 
          />
          <StatCard 
            title="Usuarios Únicos" 
            value={isLoading ? "..." : stats.users.toString()} 
            icon={<Users className="w-6 h-6 text-purple-500" />} 
          />
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Últimos Reclamos</h2>
            <span className="text-xs text-slate-500">Mostrando {complaints.length} registros</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium">Denunciante</th>
                  <th className="px-6 py-3 font-medium">Denunciado</th>
                  <th className="px-6 py-3 font-medium text-center">Evidencia</th>
                  <th className="px-6 py-3 font-medium text-center">Constancia</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-institutional" />
                        <span>Cargando datos...</span>
                      </div>
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No hay reclamos registrados aún.
                    </td>
                  </tr>
                ) : (
                  complaints.map((complaint) => (
                    <tr key={complaint.id} className="bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        {complaint.id}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(complaint.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{complaint.fullName}</div>
                        <div className="text-xs text-slate-500">{complaint.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                         {complaint.denouncedCompany}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {complaint.filesUrl ? (
                          <div className="flex flex-col gap-1 items-center">
                            {complaint.filesUrl.split('\n').map((url, idx) => (
                              <a 
                                key={idx}
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded text-xs transition-colors"
                                title="Ver archivo adjunto"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>Ver {idx + 1}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {complaint.pdfUrl && complaint.pdfUrl !== "Error generando PDF" ? (
                           <a 
                             href={complaint.pdfUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded text-xs transition-colors"
                             title="Ver constancia PDF"
                           >
                             <FileCheck className="w-3 h-3" />
                             <span>PDF</span>
                           </a>
                        ) : (
                           <span className="text-xs text-gray-400">No disponible</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Component for Stats
const StatCard = ({ title, value, icon }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-lg">
      {icon}
    </div>
    <div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);
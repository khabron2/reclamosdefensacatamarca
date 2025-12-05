
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, MapPin, FileText, Upload, Building2, Send, 
  Plus, Trash2, CheckCircle2, Wand2, Settings, Loader2, FileBadge, Image as ImageIcon, Link
} from 'lucide-react';
import { SectionCard } from './components/ui/SectionCard';
import { ComplaintFormState, INITIAL_STATE, INITIAL_COMPANY, Company } from './types';
import { fetchCompanies, submitComplaint } from './services/sheetService';
import { refineComplaintText } from './services/geminiService';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';

type ViewState = 'form' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('form');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [formData, setFormData] = useState<ComplaintFormState>(INITIAL_STATE);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    fetchCompanies().then(setAvailableCompanies);
  }, []);

  const handleInputChange = (field: keyof ComplaintFormState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResolutionChange = (key: keyof typeof formData.resolutions) => {
    setFormData(prev => ({
      ...prev,
      resolutions: { ...prev.resolutions, [key]: !prev.resolutions[key] }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const addCompany = () => {
    if (formData.companies.length < 4) {
      setFormData(prev => ({
        ...prev,
        companies: [...prev.companies, { ...INITIAL_COMPANY, id: Date.now().toString() }]
      }));
    }
  };

  const removeCompany = (id: string) => {
    setFormData(prev => ({
      ...prev,
      companies: prev.companies.filter(c => c.id !== id)
    }));
  };

  const updateCompany = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      companies: prev.companies.map(c => {
        if (c.id === id) {
          if (field === 'companyName') {
            const found = availableCompanies.find(ac => ac.name === value);
            if (found && found.address) {
               return { ...c, [field]: value, street: found.address };
            }
          }
          return { ...c, [field]: value };
        }
        return c;
      })
    }));
  };

  const handleRefineText = async () => {
    if (!formData.problemDescription) return;
    setIsRefining(true);
    const polished = await refineComplaintText(formData.problemDescription);
    setFormData(prev => ({ ...prev, problemDescription: polished }));
    setIsRefining(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const serverId = await submitComplaint(formData);
      setFormData(prev => ({ ...prev, formId: serverId }));
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      alert(`Error al enviar: ${error.message || "Hubo un problema desconocido."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...INITIAL_STATE });
    setIsSuccess(false);
    setIsSubmitting(false);
  };

  if (currentView === 'admin') {
    if (isAdminAuthenticated) {
      return <AdminDashboard onBack={() => setCurrentView('form')} />;
    } else {
      return (
        <AdminLogin 
          onLogin={() => setIsAdminAuthenticated(true)} 
          onBack={() => setCurrentView('form')} 
        />
      );
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Reclamo Enviado!</h2>
          <p className="text-2xl font-mono text-institutional font-bold mb-4 tracking-tight">{formData.formId}</p>
          <p className="text-gray-600 mb-2">
            Hemos recibido su denuncia correctamente. Se ha enviado una copia en PDF con las evidencias adjuntas a su correo electrónico.
          </p>
          <p className="text-sm text-gray-500 mb-6 bg-yellow-50 p-2 rounded border border-yellow-100">
            ⚠️ Por favor revise su carpeta de <strong>SPAM o Correo No Deseado</strong> si no lo recibe en unos minutos.
          </p>
          <button 
            onClick={handleReset}
            className="bg-institutional hover:bg-institutional-dark text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-institutional/10 rounded-lg flex items-center justify-center text-institutional shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  Ventanilla Única de Reclamos
                </h1>
                <p className="text-sm text-institutional font-medium">Defensa del Consumidor Catamarca</p>
              </div>
            </div>
            
            <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-3 border border-gray-200 self-start md:self-auto">
              <FileBadge className="w-5 h-5 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Formulario N°</span>
                <span className="text-lg font-mono font-bold text-gray-400 leading-none">
                   {formData.formId || `Cat-Def-${new Date().getFullYear()}-####`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          
          <SectionCard title="Datos Personales" icon={<User className="w-5 h-5" />}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Sos el titular del producto o servicio?
                </label>
                <div className="flex gap-4">
                  {['yes', 'no'].map((option) => (
                    <label key={option} className={`
                      flex-1 border rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer transition-all
                      ${formData.isOwner === option 
                        ? 'border-institutional bg-institutional/5 text-institutional font-medium' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'}
                    `}>
                      <input 
                        type="radio" 
                        name="isOwner" 
                        value={option}
                        checked={formData.isOwner === option}
                        onChange={() => handleInputChange('isOwner', option)}
                        className="hidden" 
                      />
                      {option === 'yes' ? 'Sí, soy titular' : 'No, soy gestor/familiar'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                  <input 
                    type="text" 
                    required
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    placeholder="Sin puntos ni guiones"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio de Reclamo</label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+54 383 ..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Ubicación y Domicilio" icon={<MapPin className="w-5 h-5" />}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                <input 
                  type="text" 
                  value={formData.userNeighborhood}
                  onChange={(e) => handleInputChange('userNeighborhood', e.target.value)}
                  placeholder="Nombre del barrio"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calle</label>
                  <input 
                    type="text" 
                    value={formData.userStreet}
                    onChange={(e) => handleInputChange('userStreet', e.target.value)}
                    placeholder="Nombre de la calle"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Altura / Nro / Manzana</label>
                  <input 
                    type="text" 
                    value={formData.userNumber}
                    onChange={(e) => handleInputChange('userNumber', e.target.value)}
                    placeholder="1234 o Mz C Lote 4"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entre calle</label>
                  <input 
                    type="text" 
                    value={formData.userCrossStreet1}
                    onChange={(e) => handleInputChange('userCrossStreet1', e.target.value)}
                    placeholder="Primera calle transversal"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y calle</label>
                  <input 
                    type="text" 
                    value={formData.userCrossStreet2}
                    onChange={(e) => handleInputChange('userCrossStreet2', e.target.value)}
                    placeholder="Segunda calle transversal"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Datos del Reclamo" subtitle="Detalle su situación" icon={<FileText className="w-5 h-5" />}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                  <span>¿Cuál es el problema?</span>
                  <button
                    type="button"
                    onClick={handleRefineText}
                    disabled={isRefining || !formData.problemDescription}
                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {isRefining ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3" />}
                    Mejorar redacción con IA
                  </button>
                </label>
                <textarea 
                  rows={5}
                  value={formData.problemDescription}
                  onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                  placeholder="Describa los hechos y motivos de su reclamo..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all resize-y text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">¿Cómo esperas que se resuelva?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'changeProduct', label: 'Cambio del producto' },
                    { id: 'bonus', label: 'Bonificación en el abono' },
                    { id: 'refund', label: 'Devolución del dinero' },
                    { id: 'repair', label: 'Reparación / Servicio técnico' },
                    { id: 'annulment', label: 'Anulación del contrato' },
                    { id: 'other', label: 'Otro' },
                  ].map((item) => (
                    <div key={item.id} className={item.id === 'other' && formData.resolutions.other ? "col-span-1 sm:col-span-2" : ""}>
                      <label className={`flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${item.id === 'other' && formData.resolutions.other ? 'bg-gray-50 border-institutional/30' : ''}`}>
                        <input 
                          type="checkbox"
                          checked={formData.resolutions[item.id as keyof typeof formData.resolutions]}
                          onChange={() => handleResolutionChange(item.id as keyof typeof formData.resolutions)}
                          className="w-4 h-4 text-institutional border-gray-300 rounded focus:ring-institutional" 
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                      
                      {item.id === 'other' && formData.resolutions.other && (
                        <div className="mt-2 ml-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          <input
                            type="text"
                            value={formData.otherResolutionDetail}
                            onChange={(e) => handleInputChange('otherResolutionDetail', e.target.value)}
                            placeholder="Especifique cuál es la solución esperada..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-institutional focus:border-transparent outline-none bg-white"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peticiones</label>
                <textarea 
                  rows={5}
                  value={formData.specificPetitions}
                  onChange={(e) => handleInputChange('specificPetitions', e.target.value)}
                  placeholder="Ej: Devolución del monto de $15.000, reparación del equipo, etc."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all resize-y text-sm leading-relaxed"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Documentación" icon={<Upload className="w-5 h-5" />}>
            <div className="border-2 border-dashed border-institutional/30 bg-institutional/5 rounded-xl p-8 text-center hover:bg-institutional/10 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                multiple 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2 text-institutional">
                <Upload className="w-8 h-8 mb-2" />
                <span className="font-semibold">Seleccione un archivo o arrastre y suelte</span>
                <span className="text-xs text-gray-500">PDF, WORD, JPG, PNG (hasta 10 MB, máx 10 archivos)</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <p className="text-sm text-blue-600 font-medium">ℹ️ Las imágenes (JPG/PNG) se incluirán dentro del PDF de constancia. Otros archivos (PDF/Word) se guardarán como adjuntos.</p>
              
              {formData.files.length > 0 && (
                <ul className="space-y-2 mt-4">
                  {formData.files.map((file, idx) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <li key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm">
                        <div className="flex items-center gap-2 truncate">
                          {isImage ? (
                            <ImageIcon className="w-4 h-4 text-purple-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-gray-700 truncate max-w-[200px]">{file.name}</span>
                          <span className="text-gray-400 text-xs ml-1">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          {isImage ? (
                             <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded ml-2 hidden sm:inline-block">Se verá en PDF</span>
                          ) : (
                             <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-2 hidden sm:inline-block">Adjunto</span>
                          )}
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Datos del Denunciado" icon={<Building2 className="w-5 h-5" />}>
            <div className="space-y-8">
              {formData.companies.map((company, index) => (
                <div key={company.id} className="relative bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-700">Empresa #{index + 1}</h3>
                    {formData.companies.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeCompany(company.id)}
                        className="text-red-500 text-xs hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                      <input 
                        list={`companies-list-${company.id}`}
                        value={company.companyName}
                        onChange={(e) => updateCompany(company.id, 'companyName', e.target.value)}
                        placeholder="Buscar o escribir nombre..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                      />
                      <datalist id={`companies-list-${company.id}`}>
                        {availableCompanies.map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <input 
                        type="text" 
                        value={company.street}
                        onChange={(e) => updateCompany(company.id, 'street', e.target.value)}
                        placeholder="Ej: Av. Belgrano 123"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-institutional focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formData.companies.length < 4 && (
                <button
                  type="button"
                  onClick={addCompany}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-institutional hover:text-institutional transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar otra empresa denunciada
                </button>
              )}
            </div>
          </SectionCard>

          <div className="flex justify-center mt-8">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-institutional hover:bg-institutional-dark text-white font-semibold text-lg px-12 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Enviar Reclamo
                </>
              )}
            </button>
          </div>

        </form>
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setCurrentView('admin')}
          className="group bg-slate-800 text-white p-4 rounded-full shadow-lg hover:bg-slate-700 hover:scale-110 transition-all duration-300 relative"
          title="Ir a la Parte Administrativa"
        >
          <Settings className="w-6 h-6" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Administración
          </span>
        </button>
      </div>

    </div>
  );
}

export default App;

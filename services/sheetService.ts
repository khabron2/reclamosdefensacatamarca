
import { Company, ComplaintFormState, Complaint, HearingSlot } from '../types';

// PEGA AQUÍ TU NUEVA URL OBTENIDA DE "GESTIONAR IMPLEMENTACIONES"
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyifX7p3SbW-PeMxMRdbcy2ONCsDtCQLvxS0dM_6NhOi8U7Fr-olw4ry3WZdQFLpoQ/exec"; 

// Helper to convert file to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Using readAsDataURL and manually stripping prefix to get raw base64
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/png;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const fetchCompanies = async (): Promise<Company[]> => {
  try {
    if (SCRIPT_URL.includes("INSERT_YOUR") || SCRIPT_URL.includes("PEGAR_TU")) {
      console.warn("SCRIPT_URL no configurada en sheetService.ts. Usando datos de prueba.");
      return [
        { id: '1', name: 'Supermercado Vea', address: 'Av. Belgrano 123' },
        { id: '2', name: 'Telecom Personal', address: 'Calle San Martín 456' },
      ];
    }

    const cleanUrl = SCRIPT_URL.trim();
    const response = await fetch(`${cleanUrl}?action=getCompanies`);
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      // Silently fail or warn, but don't crash
      console.warn("Recibido HTML en getCompanies. Backend podría no estar actualizado.");
      return [];
    }

    if (!response.ok) throw new Error('Error fetching companies');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error cargando empresas:", error);
    return [];
  }
};

export const fetchComplaints = async (): Promise<Complaint[]> => {
  try {
    const cleanUrl = SCRIPT_URL.trim();
    if (cleanUrl.includes("INSERT_YOUR")) return [];

    const response = await fetch(`${cleanUrl}?action=getComplaints`);
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      console.error("Error: Recibido HTML en fetchComplaints. Posiblemente falta configurar permisos en el Script.");
      return [];
    }

    if (!response.ok) throw new Error('Error fetching complaints');
    const data = await response.json();
    
    // Asegurar que sea un array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error cargando reclamos:", error);
    return [];
  }
};

// --- GESTIÓN DE AUDIENCIAS ---

export const fetchHearings = async (): Promise<HearingSlot[]> => {
  try {
    const cleanUrl = SCRIPT_URL.trim();
    const response = await fetch(`${cleanUrl}?action=getHearings`);
    
    // VALIDACIÓN: Verificar si es JSON antes de parsear para evitar el error "Unexpected token 'S'"
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      console.warn("El Backend devolvió HTML/Texto en getHearings. Se asume que no hay audiencias manuales o el script es antiguo.");
      return []; // Retorna vacío para no romper la UI
    }

    if (!response.ok) throw new Error('Error fetching hearings');
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error cargando audiencias manuales:", error);
    return [];
  }
};

export const saveHearing = async (hearing: HearingSlot): Promise<any> => {
  try {
    const cleanUrl = SCRIPT_URL.trim();
    const payload = {
      action: 'saveHearing',
      ...hearing
    };
    
    const response = await fetch(cleanUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
       throw new Error("El Backend no respondió con JSON. Verifica haber implementado la nueva versión del Script.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error guardando audiencia:", error);
    throw error;
  }
};

export const deleteHearing = async (id: string): Promise<any> => {
  try {
    const cleanUrl = SCRIPT_URL.trim();
    const payload = {
      action: 'deleteHearing',
      id: id
    };
    
    const response = await fetch(cleanUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
       throw new Error("El Backend no respondió con JSON.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error eliminando audiencia:", error);
    throw error;
  }
};

// -----------------------------

export const submitComplaint = async (formData: ComplaintFormState): Promise<string> => {
  try {
    if (SCRIPT_URL.includes("INSERT_YOUR") || SCRIPT_URL.includes("PEGAR_TU")) {
      console.warn("SCRIPT_URL no configurada. Simulando envío.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return "Cat-Def-TEST-0000";
    }

    const cleanUrl = SCRIPT_URL.trim();

    // Convert Files to Base64 to send content
    const filesData = await Promise.all(formData.files.map(async (file) => {
      const base64 = await fileToBase64(file);
      return {
        name: file.name,
        mimeType: file.type,
        data: base64
      };
    }));

    // Preparar payload
    const payload = {
      ...formData,
      formId: formData.formId || undefined, 
      filesData: filesData // Enviar datos reales del archivo
    };

    const response = await fetch(cleanUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      }
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      const text = await response.text();
      if (text.includes("moved") || text.includes("deleted") || text.includes("movido") || text.includes("eliminado")) {
        throw new Error("La URL del Script ya no es válida. Genere una Nueva Implementación.");
      }
      if (text.includes("DriveApp") || text.includes("DocumentApp") || text.includes("permisos")) {
         throw new Error("Error de Permisos en Google Script: El script no tiene autorización para crear Docs o guardar archivos. El dueño debe re-autorizar en el editor.");
      }
      console.error("Respuesta HTML del servidor:", text);
      throw new Error("Error técnico en el servidor. Revise la consola.");
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      return result.id;
    } else {
      // Manejo específico de errores de Google Script devueltos como JSON
      let msg = result.message || 'Error en el servidor';
      if (msg.includes("Permisos necesarios") || msg.includes("auth/documents")) {
        msg = "Error de Permisos Google: Falta autorización para crear PDFs (DocumentApp). El administrador debe actualizar 'appsscript.json' y re-autorizar.";
      }
      throw new Error(msg);
    }

  } catch (error: any) {
    console.error("Error enviando reclamo:", error);
    throw new Error(error.message || "Error de conexión con el servidor");
  }
};

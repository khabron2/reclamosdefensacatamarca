import { Company, ComplaintFormState, Complaint } from '../types';

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
      throw new Error("URL del Script inválida o no publicada correctamente (Recibido HTML en vez de JSON).");
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
      if (text.includes("DriveApp")) {
         throw new Error("Error de Permisos en Google Script: El dueño debe autorizar el acceso a Drive en el editor de Scripts.");
      }
      console.error("Respuesta HTML del servidor:", text);
      throw new Error("Error técnico en el servidor. Revise la consola.");
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      return result.id;
    } else {
      throw new Error(result.message || 'Error en el servidor');
    }

  } catch (error: any) {
    console.error("Error enviando reclamo:", error);
    throw new Error(error.message || "Error de conexión con el servidor");
  }
};
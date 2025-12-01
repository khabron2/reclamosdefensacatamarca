
export interface Company {
  id: string;
  name: string;
  address?: string;
}

export interface DenouncedCompanyData {
  id: string; // internal unique id for the form array
  companyName: string;
  street: string;
}

export interface Complaint {
  id: string;
  date: string;
  fullName: string;
  phone: string;
  email: string;
  problem: string;
  denouncedCompany: string; // Replaces status in the table view
  filesUrl?: string; // URL(s) to view attached files
  pdfUrl?: string;   // URL to view the generated PDF
  status: string;
}

export interface ComplaintFormState {
  // Form Metadata
  formId: string;

  // Personal Data
  isOwner: 'yes' | 'no' | null;
  fullName: string;
  startDate: string;
  phone: string;
  email: string;

  // Location
  userStreet: string;
  userNumber: string;
  userNeighborhood: string;
  userCrossStreet1: string;
  userCrossStreet2: string;

  // Complaint Details
  problemDescription: string;
  resolutions: {
    changeProduct: boolean;
    bonus: boolean;
    refund: boolean;
    repair: boolean;
    annulment: boolean;
    other: boolean;
  };
  otherResolutionDetail: string; // Detail for "Other" resolution
  specificPetitions: string;

  // Documentation
  files: File[];

  // Denounced Companies
  companies: DenouncedCompanyData[];
}

export const INITIAL_COMPANY: DenouncedCompanyData = {
  id: '1',
  companyName: '',
  street: '',
};

export const INITIAL_STATE: ComplaintFormState = {
  formId: '',
  isOwner: null,
  fullName: '',
  startDate: new Date().toISOString().split('T')[0],
  phone: '',
  email: '',
  userStreet: '',
  userNumber: '',
  userNeighborhood: '',
  userCrossStreet1: '',
  userCrossStreet2: '',
  problemDescription: '',
  resolutions: {
    changeProduct: false,
    bonus: false,
    refund: false,
    repair: false,
    annulment: false,
    other: false
  },
  otherResolutionDetail: '',
  specificPetitions: '',
  files: [],
  companies: [INITIAL_COMPANY]
};

// New Types for Hearings
export interface HearingSlot {
  id?: string; // ID único para audiencias manuales
  time: string;
  complaintId: string;
  claimant: string;
  defendant: string;
  date?: string; // Fecha asignada (YYYY-MM-DD)
  isManual?: boolean; // Flag para distinguir manuales de automáticas
}

export interface DaySchedule {
  date: Date;
  slots: HearingSlot[];
}

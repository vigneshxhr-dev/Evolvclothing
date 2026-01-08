
export interface Candidate {
  name: string;
  phone: string;
  status: string;
  interviewDate?: string;
  position?: string;
  notes?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SheetData {
  headers: string[];
  rows: string[][];
}

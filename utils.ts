
import { SheetData, Candidate } from './types';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRepxomgRBDE_pqjpyVhc9oFs9usT02D8CkJRAvdX0hGpZkd2EnXgVRrK1iZFza3yXUGCOtgLTzXt3j/pub?output=csv';

/**
 * Fetches the published Google Sheet as CSV and parses it.
 */
export async function fetchSheetData(): Promise<Candidate[]> {
  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error('Failed to fetch spreadsheet data');
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    return dataRows.map(row => {
      const candidate: any = {};
      headers.forEach((header, index) => {
        const value = row[index]?.trim() || '';
        // Map common header names to our candidate object
        if (header.includes('name')) candidate.name = value;
        else if (header.includes('phone') || header.includes('mobile') || header.includes('contact')) candidate.phone = value.replace(/\D/g, '');
        else if (header.includes('status')) candidate.status = value;
        else if (header.includes('date')) candidate.interviewDate = value;
        else if (header.includes('position') || header.includes('role')) candidate.position = value;
        else candidate[header] = value;
      });
      return candidate as Candidate;
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}

/**
 * Simple CSV parser that handles basic quoted values
 */
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      curr += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(curr);
      curr = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(curr);
      result.push(row);
      row = [];
      curr = '';
    } else if (char !== '\r') {
      curr += char;
    }
  }
  
  if (curr || row.length > 0) {
    row.push(curr);
    result.push(row);
  }

  return result;
}

/**
 * Formats a phone number for comparison by removing non-numeric characters
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Checks if a string looks like a phone number (contains 7-15 digits)
 */
export function isLikelyPhoneNumber(text: string): boolean {
  const digits = text.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

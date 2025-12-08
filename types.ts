
export interface Term {
  id: number;
  name: string;
  dates: string;
  spotsTotal: number;
  spotsTaken: number;
  price: number;
}

export interface ChildData {
  fullName: string; // Imię (imiona) i nazwisko razem
  parentsNames: string; // Imiona i nazwiska rodziców
  contractSigner: string; // Osoba podpisująca umowę (edytowalne w kroku 4)
  birthYear: string;
  pesel: string;
  address: string; // Adres zamieszkania
  parentAddress: string; // Adres rodziców (if different, otherwise same)
  parentPhone: string;
  specialNeeds: string; // Specjalne potrzeby edukacyjne/niepełnosprawność
  healthInfo: string; // Uczulenia, choroba lokomocyjna, leki
  vaccinations: string; // Szczepienia (tężec, błonica, inne)
  idSeries: string; // Seria dowodu
  idNumber: string; // Numer dowodu
  mediaConsent: boolean | null; // Zgoda na wizerunek (true = tak, false = nie, null = brak wyboru)
}

export interface AppState {
  step: number;
  isStaffMode: boolean;
  selectedTermId: number | null;
  childData: ChildData;
  regulationsAccepted: boolean;
  kartaSignatureData: string | null; // Signature for Qualification Card (Step 3)
  contractSignatureData: string | null; // Signature for Contract (Step 4)
  paymentStatus: 'pending' | 'paid' | 'manual';
  signingMethod: 'online' | 'offline'; // Choice of signing method
}

export const INITIAL_CHILD_DATA: ChildData = {
  fullName: '',
  parentsNames: '',
  contractSigner: '',
  birthYear: '',
  pesel: '',
  address: '',
  parentAddress: '',
  parentPhone: '',
  specialNeeds: '',     
  healthInfo: '',       
  vaccinations: '',     
  idSeries: '',
  idNumber: '',
  mediaConsent: null,
};

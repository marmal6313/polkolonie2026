import React, { useState, useRef, useEffect } from 'react';
import { Settings, Printer, Download, User, CheckCircle, Info, PenTool, CreditCard, ChevronRight, ChevronLeft, AlertTriangle, Copy, CheckSquare, Snowflake, Calendar, CreditCard as IdCard, Building, ShieldCheck, Loader2, FileSpreadsheet, Mail, Lock, Trash2, RotateCcw, Camera, X, ArrowRight, MapPin, Trophy, Activity, Timer } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { StepIndicator } from './components/StepIndicator';
import { PrintableDocument } from './components/PrintableDocument';
import { AppState, ChildData, INITIAL_CHILD_DATA, Term } from './types';
import * as XLSX from 'xlsx';

// Updated Data for Winter 2026 with 36 spots
const AVAILABLE_TERMS: Term[] = [
  { id: 1, name: 'Turnus I (Ferie zimowe)', dates: '19.01.2026 - 23.01.2026', spotsTotal: 36, spotsTaken: 36, price: 630 }, 
  { id: 2, name: 'Turnus II (Ferie zimowe)', dates: '26.01.2026 - 31.01.2026', spotsTotal: 36, spotsTaken: 5, price: 630 },
];

const MIN_AGE = 6;
const MAX_AGE = 13;
const CURRENT_YEAR = 2026; 
const STORAGE_KEY = 'mosir_polkolonie_db_2026';

export default function App() {
  const [state, setState] = useState<AppState>({
    step: 1,
    isStaffMode: false,
    selectedTermId: null,
    childData: INITIAL_CHILD_DATA,
    regulationsAccepted: false,
    kartaSignatureData: null,
    contractSignatureData: null,
    paymentStatus: 'pending',
    signingMethod: 'online', // Default to online (Trusted Profile)
  });

  const [ageError, setAgeError] = useState<string | null>(null);
  const [isSigningLoading, setIsSigningLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Printing State
  const [printMode, setPrintMode] = useState<'all' | 'contract'>('all');

  // Admin Panel States
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [savedRecords, setSavedRecords] = useState<AppState[]>([]);
  const [recordToPrint, setRecordToPrint] = useState<AppState | null>(null);

  // Load records on mount
  useEffect(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
          try {
              setSavedRecords(JSON.parse(stored));
          } catch (e) {
              console.error("Failed to load DB", e);
          }
      }
  }, []);

  // Save new record
  const saveRegistration = (finalState: AppState) => {
      const newRecord = { ...finalState, timestamp: new Date().toISOString() };
      const updatedRecords = [...savedRecords, newRecord];
      setSavedRecords(updatedRecords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
  };

  const deleteRecord = (index: number) => {
      if (confirm("Czy na pewno chcesz trwale usunąć ten wpis z bazy?")) {
          const updated = savedRecords.filter((_, i) => i !== index);
          setSavedRecords(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
  };

  const handleAdminLoginSubmit = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (adminPasswordInput === 'mosir') {
          setIsAdminPanelOpen(true);
          setShowAdminLogin(false);
          setAdminPasswordInput('');
      } else {
          alert("Nieprawidłowe hasło");
      }
  };

  // Helpers for checkboxes in Step 3
  const isAddressSame = state.childData.address && state.childData.address === state.childData.parentAddress;
  const isNeedsNone = state.childData.specialNeeds === 'Brak specjalnych potrzeb';
  const isHealthNone = state.childData.healthInfo === 'Brak uwag / Stan zdrowia dobry';
  const isVaccineStandard = state.childData.vaccinations === 'Zgodnie z kalendarzem szczepień';

  // --- Validation Logic ---
  
  const getStep3Errors = (): string[] => {
      const errors: string[] = [];
      const d = state.childData;
      
      if (!d.fullName.trim()) errors.push("- Imię i nazwisko dziecka");
      if (!d.parentsNames.trim()) errors.push("- Imiona i nazwiska rodziców");
      if (d.pesel.length !== 11) errors.push("- Numer PESEL (musi mieć 11 cyfr)");
      if (!d.address.trim()) errors.push("- Adres zamieszkania");
      if (!d.parentPhone.trim()) errors.push("- Numer telefonu (min. 9 cyfr)");
      else {
           const digits = d.parentPhone.replace(/\D/g, '');
           if (digits.length < 9) errors.push("- Numer telefonu (za krótki)");
      }
      if (!d.specialNeeds.trim()) errors.push("- Informacja o specjalnych potrzebach");
      if (!d.healthInfo.trim()) errors.push("- Informacja o stanie zdrowia");
      if (!d.vaccinations.trim()) errors.push("- Informacja o szczepieniach");
      
      return errors;
  };

  const getStep4Errors = (): string[] => {
      const errors: string[] = [];
      const d = state.childData;

      if (!d.contractSigner.trim()) errors.push("- Osoba podpisująca umowę");
      if (!d.idSeries.trim()) errors.push("- Seria dowodu");
      if (!d.idNumber.trim()) errors.push("- Numer dowodu");
      
      return errors;
  };

  // --- Handlers ---

  const handleNext = () => {
    // Strict Validation for Step 1
    if (state.step === 1) {
        if (!state.regulationsAccepted || !state.childData.birthYear || ageError) return;
    }
    // Validation for Step 2
    if (state.step === 2) {
        if (!state.selectedTermId) return;
        const term = AVAILABLE_TERMS.find(t => t.id === state.selectedTermId);
        if (term && term.spotsTaken >= term.spotsTotal) return;
    }
    // Step 3 Validation
    if (state.step === 3) {
        const errors = getStep3Errors();
        if (errors.length > 0) {
            alert("Proszę uzupełnić brakujące dane:\n" + errors.join("\n"));
            return; 
        }
        if (state.signingMethod === 'online' && !state.kartaSignatureData) {
            alert("Proszę podpisać Kartę Kwalifikacyjną przed przejściem dalej.");
            return;
        }
    }
    // Step 4 Validation
    if (state.step === 4) {
        const errors = getStep4Errors();
        if (errors.length > 0) {
            alert("Proszę uzupełnić brakujące dane do umowy:\n" + errors.join("\n"));
            return;
        }
        if (state.signingMethod === 'online' && !state.contractSignatureData) {
            alert("Proszę podpisać Umowę przed przejściem dalej.");
            return;
        }
    }
    
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: prev.step - 1 }));
  };

  const toggleStaffMode = () => {
    setState(prev => ({ ...prev, isStaffMode: !prev.isStaffMode }));
  };

  const handleAgeVerify = (val: string) => {
    if (!val) {
        setAgeError(null);
        setState(prev => ({ ...prev, childData: { ...prev.childData, birthYear: '' } }));
        return;
    }

    if (val.length !== 4) {
        setAgeError(null); 
    } else {
        const year = parseInt(val);
        const age = CURRENT_YEAR - year;
        if (age < MIN_AGE || age > MAX_AGE) {
            setAgeError(`Wiek 6-13 lat.`);
        } else {
            setAgeError(null);
        }
    }
    setState(prev => ({ ...prev, childData: { ...prev.childData, birthYear: val } }));
  };

  // Generate Digital Stamp for Trusted Profile
  const generateTrustedProfileStamp = (docName: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Frame
    ctx.strokeStyle = '#1d4ed8'; // Blue-700
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 390, 90);

    // Icon Placeholder
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(35, 35, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('✓', 28, 42);

    // Text
    ctx.fillStyle = '#1e3a8a'; // Blue-900
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`PODPISANO: ${docName}`, 60, 30);
    
    // Name Logic: Try contractSigner first, then fallback to split parentsNames
    let nameToUse = state.childData.contractSigner;
    if (!nameToUse) {
         // Fallback logic just in case
         const pNames = state.childData.parentsNames;
         if (pNames.includes(' i ')) {
             nameToUse = pNames.split(' i ')[0];
         } else if (pNames.includes(',')) {
             nameToUse = pNames.split(',')[0];
         } else {
             nameToUse = pNames;
         }
    }
    if (!nameToUse) nameToUse = "Rodzic/Opiekun";

    ctx.fillStyle = '#000000';
    ctx.font = '14px sans-serif';
    ctx.fillText(nameToUse.toUpperCase(), 60, 55);
    
    ctx.fillStyle = '#4b5563'; // Gray-600
    ctx.font = '12px sans-serif';
    const dateStr = new Date().toLocaleDateString('pl-PL'); // Ensure DD.MM.YYYY format
    ctx.fillText(`Data podpisu: ${dateStr}`, 60, 80);

    return canvas.toDataURL();
  };

  const handleKartaSign = () => {
      setIsSigningLoading(true);
      setTimeout(() => {
          const stamp = generateTrustedProfileStamp("KARTA KWALIFIKACYJNA");
          if (stamp) {
              setState(prev => ({ ...prev, kartaSignatureData: stamp }));
          }
          setIsSigningLoading(false);
      }, 1500);
  };

  const handleContractSign = () => {
      setIsSigningLoading(true);
      setTimeout(() => {
          const stamp = generateTrustedProfileStamp("UMOWA");
          if (stamp) {
              setState(prev => ({ ...prev, contractSignatureData: stamp }));
          }
          setIsSigningLoading(false);
      }, 1500);
  };

  const handlePay = () => {
    // Simulate Payment
    setTimeout(() => {
        const nextState = { ...state, paymentStatus: 'paid' as const, step: 6 };
        setState(nextState);
        saveRegistration(nextState);
    }, 1500);
  };

  const handleManualPay = () => {
      const nextState = { ...state, paymentStatus: 'manual' as const, step: 6 };
      setState(nextState);
      saveRegistration(nextState);
  };

  const printDocuments = () => {
    // Client printing: Only Contract
    setIsPrinting(true);
    setPrintMode('contract');
    // Ensure state updates before printing
    setTimeout(() => {
        window.print();
        setIsPrinting(false);
    }, 800);
  };
  
  const handleReprint = (record: AppState) => {
      // Admin printing: All Documents
      setIsPrinting(true);
      setRecordToPrint(record);
      setPrintMode('all');
      setTimeout(() => {
          window.print();
          setIsPrinting(false);
      }, 800);
  };

  const prepareExcelData = (record: AppState) => {
    const term = AVAILABLE_TERMS.find(t => t.id === record.selectedTermId);
    let consentText = 'Brak wyboru';
    if (record.childData.mediaConsent === true) consentText = 'TAK';
    if (record.childData.mediaConsent === false) consentText = 'NIE';

    return {
        "Turnus": term?.name || "N/A",
        "Termin": term?.dates || "N/A",
        "Imię i Nazwisko Dziecka": record.childData.fullName,
        "Rok Urodzenia": record.childData.birthYear,
        "PESEL": record.childData.pesel,
        "Adres Dziecka": record.childData.address,
        "Rodzice": record.childData.parentsNames,
        "Adres Rodziców": record.childData.parentAddress || record.childData.address,
        "Telefon": record.childData.parentPhone,
        "Specjalne Potrzeby": record.childData.specialNeeds,
        "Zdrowie/Dieta": record.childData.healthInfo,
        "Szczepienia": record.childData.vaccinations,
        "Zgoda na wizerunek": consentText,
        "Osoba Podpisująca Umowę": record.childData.contractSigner,
        "Dowód Seria": record.childData.idSeries,
        "Dowód Numer": record.childData.idNumber,
        "Status Płatności": record.paymentStatus === 'paid' ? 'Opłacono' : 'W kasie',
        "Kwota": term?.price + " zł",
        "Metoda Podpisu": record.signingMethod === 'online' ? 'Profil Zaufany' : 'W biurze'
    };
  };

  const handleExportAllExcel = () => {
      const allData = savedRecords.map(prepareExcelData);
      const ws = XLSX.utils.json_to_sheet(allData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pełna Lista");
      XLSX.writeFile(wb, `PELNA_LISTA_POLKOLONIE_2026.xlsx`);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;
      const allowed = raw.replace(/[^0-9,]/g, '');
      const digitCount = allowed.replace(/,/g, '').length;
      if (digitCount > 27) return; 

      const rawDigits = allowed.replace(/,/g, '');
      let formatted = '';
      let currentNumber = '';
      
      for (let i = 0; i < rawDigits.length; i++) {
          const digit = rawDigits[i];
          currentNumber += digit;
          
          if (currentNumber.length === 9) {
             const g = currentNumber.match(/.{1,3}/g)?.join(' ');
             formatted += g;
             if (i < rawDigits.length - 1) {
                 formatted += ', ';
                 currentNumber = ''; 
             }
          } else if (i === rawDigits.length - 1) {
              const g = currentNumber.match(/.{1,3}/g)?.join(' ');
              formatted += g;
          }
      }
      if (raw.endsWith(',') && !formatted.endsWith(', ')) {
          formatted += ', ';
      }
      
      setState(prev => ({
          ...prev,
          childData: { ...prev.childData, parentPhone: formatted }
      }));
  };

  const VisualBox = ({ checked }: { checked?: boolean }) => (
    <span className="inline-block w-3 h-3 border border-black mr-2 relative align-middle bg-white">
      {checked && <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none font-bold">X</span>}
    </span>
  );

  // --- Render Admin Panel ---
  const renderAdminPanel = () => (
      <div className="max-w-7xl mx-auto p-8">
          <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Lock className="text-brand-600" /> Wewnętrzna Baza Danych (Panel Admina)</h2>
              <button onClick={handleExportAllExcel} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-green-700">
                  <FileSpreadsheet /> EKSPORTUJ PEŁNĄ LISTĘ (EXCEL)
              </button>
          </div>
          
          {savedRecords.length === 0 ? (
              <p className="text-gray-500 italic">Brak zapisanych zgłoszeń.</p>
          ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-gray-700 border-b">
                          <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">Data zapisu</th>
                              <th className="p-3">Turnus</th>
                              <th className="p-3">Dziecko</th>
                              <th className="p-3">Telefon rodzica</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Akcje</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {savedRecords.map((rec, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                  <td className="p-3 text-gray-500">{i + 1}</td>
                                  <td className="p-3">{(rec as any).timestamp ? new Date((rec as any).timestamp).toLocaleString('pl-PL') : '-'}</td>
                                  <td className="p-3">{AVAILABLE_TERMS.find(t => t.id === rec.selectedTermId)?.name}</td>
                                  <td className="p-3 font-bold">{rec.childData.fullName}</td>
                                  <td className="p-3">{rec.childData.parentPhone}</td>
                                  <td className="p-3">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${rec.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                          {rec.paymentStatus === 'paid' ? 'Opłacono' : 'W kasie'}
                                      </span>
                                  </td>
                                  <td className="p-3 flex gap-2">
                                      <button onClick={() => handleReprint(rec)} className="text-blue-600 hover:underline flex items-center gap-1 font-bold">
                                          <Download size={14} /> Drukuj (PDF)
                                      </button>
                                      <button onClick={() => deleteRecord(i)} className="text-red-600 hover:underline flex items-center gap-1 ml-2">
                                          <Trash2 size={14} /> Usuń
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}
          
          <div className="mt-8">
              <button onClick={() => setIsAdminPanelOpen(false)} className="text-gray-500 hover:underline flex items-center gap-1">
                  <ChevronLeft size={16} /> Wróć do formularza
              </button>
          </div>
      </div>
  );

  // --- Render Steps ---

  const renderStep1 = () => (
    <section id="hero" className="relative min-h-[95vh] flex flex-col justify-center pt-10 overflow-hidden w-full">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent skew-x-[-12deg] transform origin-top pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-t from-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Giant Background Outline Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none overflow-hidden opacity-5 z-0">
         <span className="text-[15vw] md:text-[18vw] font-black italic uppercase leading-none text-transparent whitespace-nowrap" style={{ WebkitTextStroke: '2px #0f172a' }}>
            MOSIR
         </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Content (7 cols) */}
        <div className="lg:col-span-7 order-2 lg:order-1 animate-fade-in-up flex flex-col items-start">
          
          <div className="flex items-center gap-3 mb-6">
             <div className="h-1 w-12 bg-primary"></div>
             <span className="text-primary font-bold uppercase tracking-widest text-sm font-display italic">Oficjalny system zapisów</span>
          </div>

          <h1 className="text-4xl md:text-6xl xl:text-7xl font-black text-dark leading-[0.95] mb-8 italic uppercase tracking-tighter">
            FERIE I <br className="md:hidden" /> ZABAWA <br/>
            <span className="relative inline-block px-3 py-1 mt-2">
                <span className="relative z-10 text-white">2026</span>
                <span className="absolute inset-0 bg-primary skew-x-[-12deg] -z-0"></span>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-graytext mb-10 max-w-lg leading-relaxed font-medium border-l-4 border-secondary pl-6">
            Basen, lodowisko, kino i hala sportowa. Profesjonalna opieka i mnóstwo atrakcji dla dzieci w wieku 6-13 lat.
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm p-6 border-l-4 border-brand-500 shadow-xl skew-x-[-2deg] w-full md:max-w-xl">
             <div className="skew-x-[2deg]">
                <h3 className="font-bold text-dark mb-4 flex items-center gap-2 uppercase italic">
                    <User size={18} className="text-primary"/> Weryfikacja uczestnika
                </h3>
                
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Rok urodzenia dziecka</label>
                         <div className="relative">
                            <input
                                type="text"
                                maxLength={4}
                                value={state.childData.birthYear}
                                onChange={(e) => handleAgeVerify(e.target.value.replace(/\D/g, ''))}
                                placeholder="RRRR"
                                className="w-full border-2 border-gray-200 bg-gray-50 px-4 py-3 text-lg font-bold text-dark focus:border-primary focus:ring-0 outline-none transition-all placeholder:font-normal placeholder:text-gray-300"
                            />
                            {state.childData.birthYear && !ageError && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                    <CheckCircle size={20} />
                                </div>
                            )}
                         </div>
                         {ageError && <p className="text-red-600 text-sm font-bold mt-1 animate-pulse">{ageError}</p>}
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group mt-2">
                        <div className={`mt-0.5 w-6 h-6 border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${state.regulationsAccepted ? 'bg-primary border-primary' : 'border-gray-300 bg-white group-hover:border-primary'}`}>
                            {state.regulationsAccepted && <CheckSquare size={14} className="text-white" />}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={state.regulationsAccepted}
                            onChange={e => setState(prev => ({ ...prev, regulationsAccepted: e.target.checked }))}
                        />
                        <span className="text-sm text-gray-600 font-medium leading-tight select-none">
                            Oświadczam, że zapoznałem/am się z <span className="text-primary font-bold hover:underline">Regulaminem Półkolonii</span>
                        </span>
                    </label>

                    <button 
                      onClick={handleNext}
                      disabled={!state.regulationsAccepted || !state.childData.birthYear || !!ageError}
                      className="group relative bg-dark text-white px-8 py-4 font-black uppercase tracking-wider transition-all hover:-translate-y-1 shadow-lg overflow-hidden w-full text-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                      <span className="relative z-10 flex items-center justify-center gap-3 italic">
                        Zapisz Dziecko <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                </div>
             </div>
          </div>

        </div>

        {/* Right Column: Dynamic Image Composition (5 cols) */}
        <div className="lg:col-span-5 order-1 lg:order-2 relative h-[400px] md:h-[600px] w-full flex items-center justify-center">
            
            {/* Image 1 - Main Large */}
            <div className="absolute top-10 left-0 w-3/4 h-[70%] z-20 shadow-2xl transform -skew-x-6 hover:skew-x-0 transition-transform duration-500 overflow-hidden border-4 border-white group">
                <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Sportowiec" className="w-full h-full object-cover scale-110 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark/80 to-transparent p-6">
                    <p className="text-white font-black italic text-2xl uppercase">Aktywny Wypoczynek</p>
                </div>
            </div>

            {/* Image 2 - Accent Top Right */}
            <div className="absolute -top-4 right-4 w-1/2 h-48 z-10 shadow-xl transform skew-x-[-12deg] overflow-hidden border-4 border-primary/30 hidden md:block">
                <img src="https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" alt="Basen" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
            </div>

            {/* Image 3 - Accent Bottom Right */}
            <div className="absolute bottom-12 -right-4 w-2/3 h-56 z-30 shadow-2xl transform skew-x-[-12deg] hover:skew-x-0 transition-transform duration-500 overflow-hidden border-4 border-secondary">
                 <img src="https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" alt="Bieżnia" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-secondary/20 mix-blend-overlay"></div>
                 <div className="absolute top-4 right-4 bg-white text-dark font-black text-xs px-2 py-1 uppercase skew-x-[12deg]">
                    Hala Sportowa
                 </div>
            </div>

             {/* Decorative Elements */}
             <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl -z-10"></div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-white shadow-sm py-6 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
              {[
                  { icon: Trophy, value: "2", label: "Turnusy" },
                  { icon: Activity, value: "6-13", label: "Wiek Dzieci" },
                  { icon: MapPin, value: "MOSiR", label: "Ostrów Maz." },
                  { icon: Timer, value: "5 dni", label: "Zabawy" },
              ].map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-4 group cursor-default">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                          <stat.icon size={24} />
                      </div>
                      <div>
                          <p className="text-2xl font-black text-dark leading-none italic">{stat.value}</p>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                      </div>
                      {idx !== 3 && <div className="h-8 w-px bg-gray-300 ml-12 hidden lg:block"></div>}
                  </div>
              ))}
          </div>
      </div>
    </section>
  );

  const renderStep2 = () => (
    <div className="max-w-4xl mx-auto pt-10">
      <h2 className="text-3xl font-black italic uppercase text-dark mb-8 flex items-center gap-2">
          <Calendar className="text-primary" />
          Wybierz turnus
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        {AVAILABLE_TERMS.map(term => {
          const isFull = term.spotsTaken >= term.spotsTotal;
          const isSelected = state.selectedTermId === term.id;
          
          return (
            <div
              key={term.id}
              onClick={() => !isFull && setState(prev => ({ ...prev, selectedTermId: term.id }))}
              className={`relative group p-8 cursor-pointer transition-all duration-300 transform border-2
                ${isFull ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' : 
                  isSelected ? 'bg-white border-primary shadow-2xl -translate-y-2' : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-xl'}
              `}
            >
               {/* Decorative corner */}
               <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${isSelected ? 'from-primary' : 'from-gray-100'} to-transparent opacity-50`}></div>

              {isSelected && (
                  <div className="absolute top-4 right-4 text-primary">
                      <CheckCircle size={32} />
                  </div>
              )}
              
              <div className="mb-2 uppercase text-xs font-bold tracking-widest text-gray-500">Opcja {term.id}</div>
              <h3 className="text-2xl font-black italic text-dark mb-4">{term.name}</h3>
              <p className="text-gray-600 mb-6 flex items-center gap-2 font-medium"><Calendar size={18} className="text-secondary"/> {term.dates}</p>
              
              <div className="flex justify-between items-end border-t pt-4">
                  <div>
                      <span className="text-3xl font-black text-primary italic">{term.price}</span>
                      <span className="text-sm text-gray-400 font-bold ml-1">PLN</span>
                  </div>
                  <div className={`px-4 py-1 skew-x-[-12deg] text-sm font-black uppercase ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      <span className="skew-x-[12deg] block">
                        {isFull ? 'BRAK MIEJSC' : `Wolne: ${term.spotsTotal - term.spotsTaken}`}
                      </span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
      
       <div className="flex justify-between mt-12">
        <button onClick={handleBack} className="px-8 py-3 rounded-none border-2 border-gray-200 text-gray-500 hover:border-primary hover:text-primary font-bold uppercase tracking-wider transition-colors skew-x-[-12deg]">
            <span className="skew-x-[12deg] block flex gap-2 items-center"><ChevronLeft/> Wróć</span>
        </button>
        <button
            onClick={handleNext}
            disabled={!state.selectedTermId}
            className={`px-10 py-3 rounded-none font-black uppercase tracking-wider transition-all skew-x-[-12deg] flex items-center gap-2 ${
                state.selectedTermId
                ? 'bg-dark text-white hover:bg-primary shadow-lg' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
            <span className="skew-x-[12deg] block flex gap-2 items-center">Dalej <ChevronRight/></span>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-4xl mx-auto pt-10">
       <div className="bg-secondary/10 border-l-4 border-secondary p-6 mb-8 skew-x-[-2deg]">
          <div className="flex skew-x-[2deg]">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-base text-dark font-bold uppercase tracking-wide">
                KLIENT WYPEŁNIA TYLKO I WYŁĄCZNIE 2 ROZDZIAŁ
              </p>
              <p className="text-sm text-gray-600 mt-1">
                  Pozostałe rozdziały (I, III, IV, V, VI) wypełnia organizator i kadra wypoczynku.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Read-Only Section I */}
        <div className="bg-gray-50 border border-gray-200 p-6 mb-8 opacity-60 pointer-events-none select-none grayscale">
            <h3 className="font-bold text-gray-500 mb-4 uppercase text-sm border-b pb-2">I. INFORMACJE DOTYCZĄCE WYPOCZYNKU (WYPEŁNIA ORGANIZATOR)</h3>
            <div className="space-y-4 font-serif text-sm">
                <div className="flex gap-2">
                    <span>1. Forma wypoczynku:</span>
                    <div className="flex flex-col gap-1 ml-4">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border border-black"></div> kolonia</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border border-black"></div> zimowisko</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border border-black flex items-center justify-center font-bold">X</div> półkolonia</div>
                    </div>
                </div>
                <div>
                   2. Termin wypoczynku <span className="font-bold">{AVAILABLE_TERMS.find(t => t.id === state.selectedTermId)?.dates}</span>
                </div>
                <div>
                    3. Adres wypoczynku: <span className="font-bold">Miejski Ośrodek Sportu i Rekreacji, ul. Trębickiego 10, 07-300 Ostrów Mazowiecka</span>
                </div>
            </div>
        </div>

      <div className="bg-white shadow-2xl border-t-4 border-primary overflow-hidden relative">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
             <h2 className="text-2xl font-black italic text-dark uppercase">II. Dane Uczestnika</h2>
             <p className="text-gray-500 text-sm">Proszę wypełnić wszystkie pola oznaczone gwiazdką (*)</p>
        </div>
        
        <div className="p-8 space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">1. Imię (imiona) i nazwisko <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={state.childData.fullName}
                    onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, fullName: e.target.value } }))}
                    placeholder="np. Jan Kowalski"
                    className="w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all font-medium"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">2. Imiona i nazwiska rodziców <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={state.childData.parentsNames}
                    onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, parentsNames: e.target.value } }))}
                    placeholder="np. Anna i Piotr Kowalscy"
                    className="w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all font-medium"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">3. Rok urodzenia <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={state.childData.birthYear}
                        disabled
                        className="w-full border-2 border-gray-200 bg-gray-50 rounded-none px-4 py-3 text-gray-500 cursor-not-allowed font-bold"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">4. Numer PESEL <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        maxLength={11}
                        value={state.childData.pesel}
                        onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, pesel: e.target.value.replace(/\D/g, '') } }))}
                        className="w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all tracking-widest font-bold"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">5. Adres zamieszkania <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={state.childData.address}
                    onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, address: e.target.value } }))}
                    placeholder="Ulica, nr domu lub mieszkania, kod pocztowy, miasto"
                    className="w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">(Ulica, nr domu lub mieszkania, kod pocztowy, miasto)</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">6. Adres rodziców<sup className="text-xs">3)</sup></label>
                <div className="flex items-start gap-2 mb-2">
                    <input 
                        type="checkbox"
                        checked={isAddressSame}
                        onChange={(e) => {
                            if (e.target.checked) {
                                setState(prev => ({ ...prev, childData: { ...prev.childData, parentAddress: prev.childData.address } }));
                            } else {
                                setState(prev => ({ ...prev, childData: { ...prev.childData, parentAddress: '' } }));
                            }
                        }}
                        className="mt-1" 
                    />
                    <span className="text-sm text-gray-600">Taki sam jak adres dziecka</span>
                </div>
                <input
                    type="text"
                    value={state.childData.parentAddress}
                    onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, parentAddress: e.target.value } }))}
                     placeholder="Ulica, nr domu lub mieszkania, kod pocztowy, miasto"
                    disabled={isAddressSame}
                    className={`w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all ${isAddressSame ? 'bg-gray-100 text-gray-500' : ''}`}
                />
                 <p className="text-xs text-gray-500 mt-1">(Ulica, nr domu lub mieszkania, kod pocztowy, miasto)</p>
            </div>

            <div>
                 <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 text-justify">
                    7. Telefon kontaktowy (Rodzic) <span className="text-red-500">*</span>
                 </label>
                 <input
                    type="text"
                    value={state.childData.parentPhone}
                    onChange={handlePhoneChange}
                    placeholder="np. 123 456 789"
                    className="w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all font-bold text-lg"
                />
            </div>

            <div className="bg-gray-50 p-6 border border-gray-200">
                 <div className="flex justify-between items-start mb-4">
                     <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide w-3/4">
                        8. Specjalne potrzeby edukacyjne <span className="text-red-500">*</span>
                     </label>
                     <div className="flex items-center gap-2">
                        <input 
                            type="checkbox"
                            checked={isNeedsNone}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setState(prev => ({ ...prev, childData: { ...prev.childData, specialNeeds: 'Brak specjalnych potrzeb' } }));
                                } else {
                                     setState(prev => ({ ...prev, childData: { ...prev.childData, specialNeeds: '' } }));
                                }
                            }}
                        />
                        <span className="text-xs font-bold text-gray-600">BRAK</span>
                     </div>
                 </div>
                 <textarea
                    rows={3}
                    value={state.childData.specialNeeds}
                    onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, specialNeeds: e.target.value } }))}
                    placeholder={isNeedsNone ? "" : "Wpisz informacje tutaj..."}
                    className="w-full form-dots bg-white border border-gray-300 px-4 py-0 focus:ring-2 focus:ring-primary outline-none leading-8 resize-none"
                    style={{ backgroundAttachment: 'local' }}
                />
            </div>

            <div className="bg-gray-50 p-6 border border-gray-200">
                 <div className="flex justify-between items-start mb-4">
                     <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide w-3/4">
                        9. Stan zdrowia, dieta, alergie <span className="text-red-500">*</span>
                     </label>
                     <div className="flex items-center gap-2">
                        <input 
                            type="checkbox"
                            checked={isHealthNone}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setState(prev => ({ ...prev, childData: { ...prev.childData, healthInfo: 'Brak uwag / Stan zdrowia dobry' } }));
                                } else {
                                     setState(prev => ({ ...prev, childData: { ...prev.childData, healthInfo: '' } }));
                                }
                            }}
                        />
                        <span className="text-xs font-bold text-gray-600">BRAK UWAG</span>
                     </div>
                 </div>
                 <textarea
                    rows={3}
                    value={state.childData.healthInfo}
                    onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, healthInfo: e.target.value } }))}
                    placeholder={isHealthNone ? "" : "Wpisz informacje tutaj..."}
                    className="w-full form-dots bg-white border border-gray-300 px-4 py-0 focus:ring-2 focus:ring-primary outline-none leading-8 resize-none"
                />
            </div>
            
            <div className="bg-gray-50 p-6 border border-gray-200">
                 <div className="flex justify-between items-start mb-4">
                     <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide w-3/4">
                        Szczepienia ochronne (tężec, błonica, inne) <span className="text-red-500">*</span>
                     </label>
                     <div className="flex items-center gap-2">
                        <input 
                            type="checkbox"
                            checked={isVaccineStandard}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setState(prev => ({ ...prev, childData: { ...prev.childData, vaccinations: 'Zgodnie z kalendarzem szczepień' } }));
                                } else {
                                     setState(prev => ({ ...prev, childData: { ...prev.childData, vaccinations: '' } }));
                                }
                            }}
                        />
                        <span className="text-xs font-bold text-gray-600">STANDARD</span>
                     </div>
                 </div>
                 <textarea
                    rows={3}
                    value={state.childData.vaccinations}
                    onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, vaccinations: e.target.value } }))}
                     placeholder={isVaccineStandard ? "" : "Wpisz informacje tutaj..."}
                    className="w-full form-dots bg-white border border-gray-300 px-4 py-0 focus:ring-2 focus:ring-primary outline-none leading-8 resize-none"
                />
            </div>

            {/* Signature Area for Card */}
            <div className="mt-8 border-t-2 border-gray-100 pt-8">
                <h3 className="font-black italic text-dark uppercase mb-6 flex items-center gap-2 text-xl">
                    <PenTool size={24} className="text-primary" />
                    Podpis pod Kartą
                </h3>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                     <label className="flex-1 flex items-center gap-3 cursor-pointer p-4 border-2 rounded-none hover:bg-gray-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-blue-50">
                        <input 
                            type="radio" 
                            name="signingMethod" 
                            className="w-5 h-5 text-primary"
                            checked={state.signingMethod === 'online'} 
                            onChange={() => setState(prev => ({ ...prev, signingMethod: 'online' }))}
                        />
                        <div className="flex flex-col">
                            <span className="font-bold text-dark uppercase tracking-wide">Profil Zaufany (Online)</span>
                            <span className="text-xs text-gray-500">Szybki podpis na ekranie</span>
                        </div>
                    </label>
                    <label className="flex-1 flex items-center gap-3 cursor-pointer p-4 border-2 rounded-none hover:bg-gray-50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-blue-50">
                        <input 
                            type="radio" 
                            name="signingMethod" 
                             className="w-5 h-5 text-primary"
                            checked={state.signingMethod === 'offline'} 
                            onChange={() => setState(prev => ({ ...prev, signingMethod: 'offline' }))}
                        />
                        <div className="flex flex-col">
                            <span className="font-bold text-dark uppercase tracking-wide">Podpis w biurze MOSiR</span>
                            <span className="text-xs text-gray-500">Wypełnij teraz, podpisz osobiście</span>
                        </div>
                    </label>
                </div>

                {state.signingMethod === 'online' ? (
                     <div className="bg-blue-50/50 p-8 text-center border-2 border-dashed border-primary/30">
                        {state.kartaSignatureData ? (
                            <div className="flex flex-col items-center animate-in fade-in duration-500">
                                <img src={state.kartaSignatureData} alt="Podpis" className="h-24 object-contain mb-2 border-2 border-primary bg-white p-2" />
                                <p className="text-green-600 font-bold flex items-center gap-2 uppercase tracking-wider"><CheckCircle size={18}/> Podpisano pomyślnie</p>
                            </div>
                        ) : (
                            <div>
                                <p className="mb-6 text-blue-900 font-medium">Kliknij poniżej, aby wygenerować podpis Profilem Zaufanym</p>
                                <button 
                                    onClick={handleKartaSign}
                                    disabled={isSigningLoading}
                                    className="bg-primary text-white px-8 py-3 font-black uppercase tracking-wider hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 skew-x-[-12deg]"
                                >
                                    <span className="skew-x-[12deg] flex items-center gap-2">
                                        {isSigningLoading ? <Loader2 className="animate-spin" /> : <PenTool size={18} />}
                                        PODPISZ KARTĘ
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                   <div className="bg-secondary/10 border-l-4 border-secondary p-4 text-sm text-dark">
                        <p className="font-bold mb-2 uppercase">Wizyta w biurze:</p>
                        <p>Zapraszamy do pokoju Działu Organizacji Imprez (nr 1-34) przy ul. Trębickiego 10.</p>
                        <p>Pn-Pt 8:00 - 16:00. Tel: 29 64 52 148.</p>
                   </div>
                )}
                
                {/* Visual Footer for Section II */}
                <div className="flex justify-between items-end mt-8 border-t pt-4 opacity-50 select-none">
                    <div className="text-center w-5/12">
                         <div className="border-b-2 border-dotted border-black h-6 font-serif">
                             {state.kartaSignatureData ? new Date().toLocaleDateString('pl-PL') : ''}
                         </div>
                        <div className="text-xs">(data)</div>
                    </div>
                    <div className="text-center w-5/12">
                         <div className="h-6 flex justify-center">
                             {state.kartaSignatureData && <span className="text-[10px] text-blue-600 font-bold">[PODPISANO ELEKTRONICZNIE]</span>}
                         </div>
                        <div className="border-b-2 border-dotted border-black w-full"></div>
                        <div className="text-xs">(podpis rodziców/pełnoletniego uczestnika wypoczynku)</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

       {/* Visual Read-Only Sections III-VI */}
       <div className="bg-gray-50 border border-gray-200 p-6 mt-8 opacity-60 pointer-events-none select-none font-serif text-sm grayscale">
            {/* III */}
            <div className="mb-8 border-b pb-4">
                 <h3 className="font-bold mb-2 uppercase">III. DECYZJA ORGANIZATORA WYPOCZYNKU</h3>
                 <div className="ml-4 space-y-1">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 border border-black"></div> zakwalifikować</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 border border-black"></div> odmówić</div>
                 </div>
            </div>
            {/* ... abbreviated visual sections ... */}
            <div className="text-center text-xs text-gray-400 uppercase tracking-widest">[Sekcje III-VI ukryte dla czytelności - widoczne na wydruku]</div>
       </div>

      <div className="flex justify-between mt-12 mb-20">
        <button onClick={handleBack} className="px-8 py-3 rounded-none border-2 border-gray-200 text-gray-500 hover:border-primary hover:text-primary font-bold uppercase tracking-wider transition-colors skew-x-[-12deg]">
            <span className="skew-x-[12deg] block flex gap-2 items-center"><ChevronLeft/> Wróć</span>
        </button>
        
        {state.step === 3 && (
            <div className="text-center self-center px-4">
                 {getStep3Errors().length > 0 && (
                     <div className="text-xs text-red-500 font-bold bg-red-50 p-2 border border-red-100">
                         {getStep3Errors().length} pustych pól
                     </div>
                 )}
            </div>
        )}

        <button
            onClick={handleNext}
             className={`px-10 py-3 rounded-none font-black uppercase tracking-wider transition-all skew-x-[-12deg] flex items-center gap-2 
                ${getStep3Errors().length > 0 || (state.signingMethod === 'online' && !state.kartaSignatureData)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-dark text-white hover:bg-primary shadow-lg'}`}
        >
             <span className="skew-x-[12deg] block flex gap-2 items-center">Dalej <ChevronRight/></span>
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-7xl mx-auto pt-10 flex gap-12 flex-col lg:flex-row">
       {/* Preview Panel */}
       <div className="flex-1 bg-dark/5 p-4 border border-gray-200 h-[800px] overflow-y-auto no-scrollbar shadow-inner relative">
          <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-2 py-1 z-10">PODGLĄD WYDRUKU</div>
          <div className="bg-white p-8 shadow-sm min-h-[1000px] transform scale-95 origin-top">
              <PrintableDocument data={state} term={AVAILABLE_TERMS.find(t => t.id === state.selectedTermId)} onlyContract={true} />
          </div>
       </div>

       {/* Controls Panel */}
       <div className="w-full lg:w-[450px] flex-shrink-0 space-y-8">
           <div className="bg-white p-8 shadow-xl border-t-4 border-primary">
               <h2 className="text-2xl font-black italic text-dark mb-6 flex items-center gap-2 uppercase">
                   <PenTool className="text-primary" />
                   Dane do umowy
               </h2>
               
               <div className="space-y-6">
                   <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Osoba podpisująca (Rodzic) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={state.childData.contractSigner}
                            onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, contractSigner: e.target.value } }))}
                            placeholder="Imię i Nazwisko"
                            className="w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none transition-all"
                        />
                   </div>
                   
                   <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-xs text-blue-900 mb-2">
                       <Info size={14} className="inline mr-1 mb-0.5"/>
                       Dane dowodu osobistego są wymagane do ważności umowy.
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                       <div className="col-span-1">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Seria <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                maxLength={3}
                                value={state.childData.idSeries}
                                onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, idSeries: e.target.value.toUpperCase() } }))}
                                placeholder="ABC"
                                className="w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none uppercase font-bold text-center"
                            />
                       </div>
                       <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Numer <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                maxLength={10}
                                value={state.childData.idNumber}
                                onChange={e => setState(prev => ({ ...prev, childData: { ...prev.childData, idNumber: e.target.value.replace(/[^0-9]/g, '') } }))}
                                placeholder="123456"
                                className="w-full border-2 border-gray-200 rounded-none px-4 py-3 focus:border-primary focus:ring-0 outline-none font-bold tracking-widest"
                            />
                       </div>
                   </div>
               </div>
           </div>

           <div className="bg-white p-8 shadow-xl border-t-4 border-secondary">
                <h3 className="font-black italic text-dark mb-4 uppercase text-lg">Złóż Podpis</h3>
                
                <div className="mb-6 text-sm text-gray-600 bg-gray-50 p-2 text-center font-medium border border-gray-100">
                    METODA: <strong>{state.signingMethod === 'online' ? 'PROFIL ZAUFANY' : 'W BIURZE'}</strong>
                </div>

                {state.signingMethod === 'online' ? (
                    <div className="text-center">
                         {state.contractSignatureData ? (
                            <div className="bg-green-50 p-6 flex flex-col items-center animate-in fade-in border border-green-200">
                                <img src={state.contractSignatureData} alt="Podpis" className="h-20 object-contain mb-2 bg-white border border-green-200 p-1" />
                                <p className="text-green-700 font-bold flex items-center gap-2 text-sm uppercase"><CheckCircle size={16}/> Umowa podpisana</p>
                            </div>
                        ) : (
                            <button 
                                onClick={handleContractSign}
                                disabled={isSigningLoading || !state.childData.contractSigner}
                                className="w-full bg-primary text-white px-4 py-4 font-black uppercase tracking-wider hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed skew-x-[-12deg]"
                            >
                                <span className="skew-x-[12deg] flex gap-2 items-center">
                                    {isSigningLoading ? <Loader2 className="animate-spin" /> : <PenTool size={18} />}
                                    PODPISZ UMOWĘ
                                </span>
                            </button>
                        )}
                        {!state.childData.contractSigner && (
                            <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">Wpisz dane osoby podpisującej powyżej!</p>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-dark italic text-center">
                        <p>Podpis złożysz osobiście w biurze MOSiR.</p>
                   </div>
                )}
           </div>

           <div className="flex flex-col gap-4">
                {getStep4Errors().length > 0 && (
                     <div className="text-xs text-red-500 font-bold bg-red-50 p-3 text-center border border-red-100">
                         UZUPEŁNIJ BRAKI ABY KONTYNUOWAĆ
                     </div>
                 )}
               <button
                    onClick={handleNext}
                    className={`w-full py-5 font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all skew-x-[-12deg]
                    ${getStep4Errors().length > 0 || (state.signingMethod === 'online' && !state.contractSignatureData)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-xl'}`}
                >
                    <span className="skew-x-[12deg] flex gap-2 items-center">Zatwierdź i Płacę <CheckCircle size={20} /></span>
                </button>
                <button onClick={handleBack} className="w-full py-3 text-gray-400 hover:text-primary font-bold uppercase text-xs tracking-widest transition-colors">
                    Wróć do edycji danych
                </button>
           </div>
       </div>
    </div>
  );

  const renderStep5 = () => (
      <div className="max-w-2xl mx-auto pt-10">
        <h2 className="text-3xl font-black italic text-dark mb-10 text-center uppercase">Płatność i Zgody</h2>
        
        {/* Media Consent moved here */}
        <div className="bg-white p-8 shadow-xl border-t-4 border-primary mb-10">
            <h3 className="font-black text-dark mb-4 flex items-center gap-2 uppercase text-lg">
                <Camera className="text-primary" /> Zgoda na wizerunek
            </h3>
            <p className="text-sm text-gray-600 mb-6 font-medium leading-relaxed">
                Czy wyrażasz zgodę na wykorzystanie przez MOSiR zdjęć i nagrań filmowych z udziałem dziecka do celów promocyjnych (Facebook, strona www)?
            </p>
            <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-4 border-2 transition-all ${state.childData.mediaConsent === true ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <input 
                        type="radio" 
                        name="mediaConsent"
                        className="hidden"
                        checked={state.childData.mediaConsent === true}
                        onChange={() => setState(prev => ({ ...prev, childData: { ...prev.childData, mediaConsent: true } }))}
                    />
                    <span className={`font-black uppercase ${state.childData.mediaConsent === true ? 'text-primary' : 'text-gray-400'}`}>TAK, ZGADZAM SIĘ</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-4 border-2 transition-all ${state.childData.mediaConsent === false ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <input 
                        type="radio" 
                        name="mediaConsent"
                        className="hidden"
                        checked={state.childData.mediaConsent === false}
                        onChange={() => setState(prev => ({ ...prev, childData: { ...prev.childData, mediaConsent: false } }))}
                    />
                    <span className={`font-black uppercase ${state.childData.mediaConsent === false ? 'text-primary' : 'text-gray-400'}`}>NIE WYRAŻAM ZGODY</span>
                </label>
            </div>
        </div>

        {state.childData.mediaConsent === null && (
             <p className="text-red-500 font-bold mb-6 text-center uppercase tracking-wide text-sm animate-pulse">
                 Wymagany wybór zgody powyżej
             </p>
        )}

        <div className={`grid md:grid-cols-2 gap-6 ${state.childData.mediaConsent === null ? 'opacity-40 pointer-events-none' : ''}`}>
             <button 
                onClick={handlePay}
                className="group relative bg-white p-8 shadow-lg border-2 border-transparent hover:border-green-500 transition-all overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <CreditCard size={40} className="text-green-600 mb-4 relative z-10" />
                <h3 className="text-xl font-black italic text-dark mb-1 relative z-10 uppercase">Szybki Przelew</h3>
                <p className="text-sm text-gray-500 font-medium relative z-10">PayU / BLIK</p>
            </button>
            
             <button 
                onClick={handleManualPay}
                className="group relative bg-white p-8 shadow-lg border-2 border-transparent hover:border-blue-500 transition-all overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <Building size={40} className="text-blue-600 mb-4 relative z-10" />
                <h3 className="text-xl font-black italic text-dark mb-1 relative z-10 uppercase">Płatność w Kasie</h3>
                <p className="text-sm text-gray-500 font-medium relative z-10">Gotówka / Karta (Biuro)</p>
            </button>
        </div>
         <button onClick={handleBack} className="mt-12 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-dark w-full text-center">Anuluj i Wróć</button>
      </div>
  );

  const renderStep6 = () => (
    <div className="max-w-3xl mx-auto text-center pt-10">
      <div className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-300">
        <CheckCircle size={64} className="text-green-600" />
      </div>
      <h2 className="text-4xl font-black italic text-dark mb-4 uppercase">Gotowe!</h2>
      <p className="text-xl text-gray-600 mb-10">
          Status: <span className="font-black text-primary uppercase tracking-wide px-2 bg-blue-50">{state.paymentStatus === 'paid' ? 'Opłacono' : 'Płatność w kasie'}</span>
      </p>
      
      <div className="bg-white p-8 shadow-xl border-t-4 border-secondary mb-10 text-left">
          <h3 className="font-black text-dark text-lg mb-4 border-b pb-2 uppercase text-center">Co dalej?</h3>
          <p className="text-dark mb-4 text-center font-medium">
              Udaj się do pokoju <strong className="text-primary">Działu Organizacji Imprez (1-34)</strong> w budynku MOSiR przy ul. Trębickiego 10.
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-500 mb-4">
               <span className="flex items-center gap-1"><Timer size={16}/> Pn-Pt 8:00 - 16:00</span>
               <span className="flex items-center gap-1"><User size={16}/> Tel: 29 64 52 148</span>
          </div>
          <p className="text-center text-xs uppercase tracking-widest text-red-500 font-bold">
              Podpisz umowę osobiście najszybciej jak to możliwe!
          </p>
      </div>

      <div className="space-y-4">
          <button 
            type="button"
            onClick={printDocuments}
            disabled={isPrinting}
            className="group relative bg-dark text-white w-full py-6 font-black uppercase tracking-wider transition-all hover:-translate-y-1 shadow-xl overflow-hidden skew-x-[-12deg] disabled:opacity-70 disabled:cursor-not-allowed"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
            <span className="skew-x-[12deg] flex items-center justify-center gap-3 relative z-10 text-xl">
                 {isPrinting ? <Loader2 className="animate-spin" /> : <Printer size={24} />} 
                 {isPrinting ? 'PRZYGOTOWYWANIE PDF...' : 'POBIERZ DOKUMENTY (PDF)'}
            </span>
          </button>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-4">
              Wybierz "Zapisz jako PDF" w oknie drukowania
          </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-12 font-sans relative">
      {/* Navbar - Only visible if NOT on step 1 (Hero handles its own branding) */}
      {state.step !== 1 && (
          <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <img src="logo.png" alt="MOSiR" className="h-12 object-contain" />
                 <div className="hidden sm:flex flex-col">
                    <span className="font-black text-xl text-dark tracking-tighter italic uppercase leading-none">MOSiR</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Ostrów Maz.</span>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => setShowAdminLogin(true)} className="p-2 text-gray-400 hover:text-primary rounded-full transition-colors" title="Panel Admina">
                     <Lock size={20} />
                 </button>
              </div>
            </div>
          </nav>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 no-print backdrop-blur-sm">
              <div className="bg-white p-10 max-w-sm w-full animate-in fade-in zoom-in duration-200 shadow-2xl border-t-4 border-primary">
                  <h3 className="text-2xl font-black italic text-dark mb-6 flex items-center gap-2 uppercase">
                      <Lock size={24} className="text-primary"/> Admin
                  </h3>
                  <form onSubmit={handleAdminLoginSubmit}>
                      <input 
                        type="password" 
                        autoFocus
                        value={adminPasswordInput}
                        onChange={e => setAdminPasswordInput(e.target.value)}
                        placeholder="Hasło"
                        className="w-full border-2 border-gray-200 px-4 py-3 mb-4 focus:border-primary outline-none font-bold text-center text-lg"
                      />
                      <button type="submit" className="w-full py-3 bg-dark text-white hover:bg-primary font-black uppercase tracking-wider transition-colors">Zaloguj</button>
                      <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full mt-2 py-2 text-gray-400 hover:text-dark text-xs font-bold uppercase tracking-widest">Anuluj</button>
                  </form>
              </div>
          </div>
      )}

      {/* Main Content */}
      <div className={` ${isAdminPanelOpen ? 'hidden' : ''} no-print`}>
        
        {/* Step Indicator - Only show if NOT on Step 1 */}
        {state.step !== 1 && (
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <StepIndicator currentStep={state.step} steps={['Start', 'Termin', 'Dane', 'Umowa', 'Płatność']} />
             </div>
        )}
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {state.step === 1 && renderStep1()}
          
          <div className="px-4 sm:px-6 lg:px-8">
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && renderStep4()}
            {state.step === 5 && renderStep5()}
            {state.step === 6 && renderStep6()}
          </div>
        </div>
      </div>

      {/* Admin Panel View */}
      {isAdminPanelOpen && (
          <div className="pt-6 px-4 sm:px-6 lg:px-8 no-print">
              {renderAdminPanel()}
          </div>
      )}

      {/* Printable Document Container - Visible only during print */}
      <div className="print-only">
         {/* We simplify logic: If we are printing as Admin (recordToPrint exists), use it. Otherwise use current state. */}
         {/* We determine 'onlyContract' based on the printMode state. */}
         <PrintableDocument 
            data={recordToPrint || state} 
            term={AVAILABLE_TERMS.find(t => t.id === (recordToPrint || state).selectedTermId)} 
            onlyContract={printMode === 'contract'} 
         />
      </div>

    </div>
  );
}
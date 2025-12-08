
import React from 'react';
import { AppState, Term } from '../types';

interface Props {
  data: AppState;
  term: Term | undefined;
  onlyContract?: boolean;
}

export const PrintableDocument: React.FC<Props> = ({ data, term, onlyContract }) => {
  const { childData, kartaSignatureData, contractSignatureData } = data;
  
  // Full date for footers (e.g. 19.01.2026)
  const fullDate = new Date().toLocaleDateString('pl-PL');

  // Day and Month only for Contract header (e.g. 19.01) to fit ".... 2026 r."
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayMonth = `${day}.${month}`;

  // Helper for checkboxes
  const Box = ({ checked }: { checked?: boolean }) => (
    <span className="inline-block w-4 h-4 border border-black mr-2 relative align-middle">
      {checked && <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">X</span>}
    </span>
  );

  return (
    <div className="font-serif text-black text-[11pt] leading-tight mx-auto">
      
      {/* Hide Pages 1-3 if only contract is requested */}
      {!onlyContract && (
        <>
      {/* --- PAGE 1 --- */}
      <div className="page-break-after-always min-h-[29.7cm] p-8 relative">
        <div className="text-center font-bold mb-6">
          <p>KARTA KWALIFIKACYJNA UCZESTNIKA WYPOCZYNKU</p>
        </div>

        {/* I. INFORMACJE DOTYCZĄCE WYPOCZYNKU */}
        <div className="mb-6">
            <h3 className="font-bold mb-4">I. INFORMACJE DOTYCZĄCE WYPOCZYNKU</h3>
            
            <div className="mb-2">
                <div className="flex">
                    <span className="mr-2">1.</span>
                    <div className="flex-1">
                        Forma wypoczynku<sup>1)</sup>
                        <div className="ml-6 mt-1 space-y-1">
                            <div><Box />kolonia</div>
                            <div><Box />zimowisko</div>
                            <div><Box />obóz</div>
                            <div><Box />biwak</div>
                            <div><Box checked={true} />półkolonia</div>
                            <div className="flex flex-col">
                                <div className="flex items-end">
                                    <Box />
                                    <span className="whitespace-nowrap mr-1">inna forma wypoczynku</span>
                                    <span className="border-b-2 border-dotted border-black flex-1"></span>
                                </div>
                                <div className="text-right text-xs italic">(proszę podać formę)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-2 flex items-baseline">
                <span className="mr-2">2. Termin wypoczynku</span>
                <span className="font-bold px-2">{term?.dates}</span>
            </div>

            <div className="mb-2">
                <div className="mb-1">3. Adres wypoczynku, miejsce lokalizacji wypoczynku</div>
                <div className="font-bold border-b-2 border-dotted border-black">
                    Miejski Ośrodek Sportu i Rekreacji
                </div>
                <div className="font-bold border-b-2 border-dotted border-black">
                    ul. Trębickiego 10, 07-300 Ostrów Mazowiecka
                </div>
            </div>

            <div className="mb-4">
                 <div className="mb-1">Trasa wypoczynku o charakterze wędrownym<sup>2)</sup></div>
                 <div className="border-b-2 border-dotted border-black h-5"></div>
                 <div className="border-b-2 border-dotted border-black h-5"></div>
            </div>

            <div className="mb-12">
                 <div className="flex items-end">
                     <span className="whitespace-nowrap mr-1">Nazwa kraju w przypadku wypoczynku organizowanego za granicą</span>
                     <div className="border-b-2 border-dotted border-black flex-1 h-5"></div>
                 </div>
            </div>

            <div className="flex justify-between items-end mt-8">
                <div className="text-center w-5/12">
                    <div className="flex items-end">
                        <span className="whitespace-nowrap">Ostrów Mazowiecka, </span>
                        <div className="border-b-2 border-dotted border-black flex-1 h-5"></div>
                    </div>
                    <div className="text-xs text-center relative top-3">(miejscowość, data)</div>
                </div>
                 <div className="text-center w-5/12">
                    <div className="border-b-2 border-dotted border-black h-5 font-bold"></div>
                    <div className="text-xs">(podpis organizatora wypoczynku)</div>
                </div>
            </div>
        </div>

        {/* II. INFORMACJE DOTYCZĄCE UCZESTNIKA WYPOCZYNKU */}
        <div className="border-t-2 border-black pt-2">
            <h3 className="font-bold mb-4">II. INFORMACJE DOTYCZĄCE UCZESTNIKA WYPOCZYNKU</h3>
            
            <div className="space-y-4">
                <div>
                    <div className="mb-1">1. Imię (imiona) i nazwisko</div>
                    <div className="border-b-2 border-dotted border-black font-bold h-6">{childData.fullName}</div>
                </div>

                <div>
                    <div className="mb-1">2. Imiona i nazwiska rodziców</div>
                    <div className="border-b-2 border-dotted border-black font-bold h-6">{childData.parentsNames}</div>
                </div>

                <div>
                    <div className="flex items-baseline gap-2">
                        <span>3. Rok urodzenia</span>
                        <span className="flex-1 border-b-2 border-dotted border-black font-bold px-2">{childData.birthYear}</span>
                    </div>
                </div>

                <div>
                    <div className="mb-1">4. Numer PESEL uczestnika wypoczynku</div>
                    <div className="flex">
                       {childData.pesel.split('').map((char, i) => (
                           <div key={i} className="w-6 h-8 border border-black flex items-center justify-center font-bold mr-1">
                               {char}
                           </div>
                       ))}
                       {Array.from({ length: Math.max(0, 11 - childData.pesel.length) }).map((_, i) => (
                           <div key={`empty-${i}`} className="w-6 h-8 border border-black mr-1"></div>
                       ))}
                    </div>
                </div>

                <div>
                    <div className="mb-1">5. Adres zamieszkania</div>
                    <div className="border-b-2 border-dotted border-black font-bold h-6">{childData.address}</div>
                </div>

                <div>
                    <div className="mb-1">6. Adres zamieszkania lub pobytu rodziców<sup>3)</sup></div>
                     <div className="border-b-2 border-dotted border-black font-bold h-6">{childData.parentAddress || childData.address}</div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                </div>
            </div>
        </div>
      </div>

      {/* --- PAGE 2 --- */}
      <div className="page-break-after-always min-h-[29.7cm] p-8 pt-12 relative">
          
          <div className="space-y-6 mb-8">
                <div>
                    <div className="mb-1 text-justify">
                        7. Numer telefonu rodziców lub numer telefonu osoby wskazanej przez pełnoletniego uczestnika wypoczynku, w czasie trwania wypoczynku
                    </div>
                    <div className="border-b-2 border-dotted border-black font-bold h-6">{childData.parentPhone}</div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                </div>

                <div>
                    <div className="mb-1 text-justify">
                        8. Informacja o specjalnych potrzebach edukacyjnych uczestnika wypoczynku, w szczególności o potrzebach wynikających z niepełnosprawności, niedostosowania społecznego lub zagrożenia niedostosowaniem społecznym
                    </div>
                    <div className="border-b-2 border-dotted border-black h-5 font-bold">{childData.specialNeeds}</div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                </div>

                <div>
                    <div className="mb-1 text-justify">
                        9. Istotne dane o stanie zdrowia uczestnika wypoczynku, rozwoju psychofizycznym i stosowanej diecie (np. na co uczestnik jest uczulony, jak znosi jazdę samochodem, czy przyjmuje stałe leki i w jakich dawkach, czy nosi aparat ortodontyczny lub okulary)
                    </div>
                    <div className="border-b-2 border-dotted border-black h-5 font-bold">{childData.healthInfo}</div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                     <div className="border-b-2 border-dotted border-black h-5"></div>
                </div>

                <div className="mt-4">
                    <div className="mb-2 text-justify">
                        oraz o szczepieniach ochronnych (wraz z podaniem roku lub przedstawienie książeczki zdrowia z aktualnym wpisem szczepień):
                    </div>
                    <div className="flex mb-1">
                        <span className="w-24">tężec</span>
                        <div className="flex-1 border-b-2 border-dotted border-black font-bold">{childData.vaccinations}</div>
                    </div>
                    <div className="flex mb-1">
                        <span className="w-24">błonica</span>
                        <div className="flex-1 border-b-2 border-dotted border-black"></div>
                    </div>
                    <div className="flex mb-1">
                        <span className="w-24">inne</span>
                        <div className="flex-1 border-b-2 border-dotted border-black"></div>
                    </div>
                    <div className="border-b-2 border-dotted border-black h-5 mt-2"></div>
                    <div className="border-b-2 border-dotted border-black h-5"></div>
                </div>
          </div>

          <div className="flex justify-between items-end mb-12">
                <div className="text-center w-5/12">
                    <div className="border-b-2 border-dotted border-black h-5">
                        {kartaSignatureData ? fullDate : ''}
                    </div>
                    <div className="text-xs">(data)</div>
                </div>
                 <div className="text-center w-5/12 flex flex-col items-center">
                    {kartaSignatureData ? (
                        <img src={kartaSignatureData} className="h-12 mb-[-10px] object-contain" alt="Podpis" />
                    ) : <div className="h-8"></div>}
                    <div className="border-b-2 border-dotted border-black w-full"></div>
                    <div className="text-xs">(podpis rodziców/pełnoletniego uczestnika wypoczynku)</div>
                </div>
            </div>

            {/* III. DECYZJA ORGANIZATORA */}
            <div className="border-t-2 border-black pt-2">
                 <h3 className="font-bold mb-4 uppercase">III. DECYZJA ORGANIZATORA WYPOCZYNKU O ZAKWALIFIKOWANIU UCZESTNIKA WYPOCZYNKU DO UDZIAŁU W WYPOCZYNKU</h3>
                 
                 <div className="mb-4">
                     <p>Postanawia się<sup>1)</sup>:</p>
                     <div className="ml-0 mt-2">
                        <div className="flex items-start mb-2">
                            <Box />
                            <span>zakwalifikować i skierować uczestnika na wypoczynek</span>
                        </div>
                         <div className="flex items-start">
                            <Box />
                            <span>odmówić skierowania uczestnika na wypoczynek ze względu</span>
                        </div>
                        <div className="border-b-2 border-dotted border-black h-5 mt-1 ml-6"></div>
                        <div className="border-b-2 border-dotted border-black h-5 mt-1 ml-6"></div>
                     </div>
                 </div>

                 <div className="flex justify-between items-end mt-12">
                    <div className="text-center w-5/12">
                        <div className="border-b-2 border-dotted border-black h-5"></div>
                        <div className="text-xs">(data)</div>
                    </div>
                    <div className="text-center w-5/12">
                        <div className="border-b-2 border-dotted border-black h-5"></div>
                        <div className="text-xs">(podpis organizatora wypoczynku)</div>
                    </div>
                </div>
            </div>
      </div>

      {/* --- PAGE 3 --- */}
      <div className="page-break-after-always min-h-[29.7cm] p-8 pt-12 relative">
          
          {/* IV */}
          <div className="mb-8">
               <h3 className="font-bold mb-4 uppercase border-b-2 border-black pb-1">IV. POTWIERDZENIE PRZEZ KIEROWNIKA WYPOCZYNKU POBYTU UCZESTNIKA WYPOCZYNKU W MIEJSCU WYPOCZYNKU</h3>
               
               <div className="mb-2">
                   Uczestnik przebywał ........................................................................................................................................................
               </div>
               <div className="text-center text-xs mb-4">(adres miejsca wypoczynku)</div>

               <div className="flex justify-between mb-8">
                   <div className="w-5/12">od dnia (dzień, miesiąc, rok) ........................</div>
                   <div className="w-5/12">do dnia (dzień, miesiąc, rok) ........................</div>
               </div>

                <div className="flex justify-between items-end mt-12">
                    <div className="text-center w-5/12">
                        <div className="border-b-2 border-dotted border-black h-5"></div>
                        <div className="text-xs">(data)</div>
                    </div>
                    <div className="text-center w-5/12">
                        <div className="border-b-2 border-dotted border-black h-5"></div>
                        <div className="text-xs">(podpis kierownika wypoczynku)</div>
                    </div>
                </div>
          </div>

          {/* V */}
          <div className="mb-8">
              <h3 className="font-bold mb-4 uppercase border-b-2 border-black pb-1 text-justify">V. INFORMACJA KIEROWNIKA WYPOCZYNKU O STANIE ZDROWIA UCZESTNIKA WYPOCZYNKU W CZASIE TRWANIA WYPOCZYNKU ORAZ O CHOROBACH PRZEBYTYCH W JEGO TRAKCIE</h3>
              <div className="space-y-2">
                  <div className="border-b-2 border-dotted border-black h-5"></div>
                  <div className="border-b-2 border-dotted border-black h-5"></div>
                  <div className="border-b-2 border-dotted border-black h-5"></div>
                  <div className="border-b-2 border-dotted border-black h-5"></div>
              </div>

               <div className="flex justify-between items-end mt-8">
                    <div className="text-center w-5/12">
                        <div className="border-b-2 border-dotted border-black h-5"></div>
                        <div className="text-xs">(miejscowość, data)</div>
                    </div>
                    <div className="text-center w-5/12">
                        <div className="border-b-2 border-dotted border-black h-5"></div>
                        <div className="text-xs">(podpis kierownika wypoczynku)</div>
                    </div>
                </div>
          </div>

          {/* VI */}
          <div className="mb-8">
               <h3 className="font-bold mb-4 uppercase border-b-2 border-black pb-1">VI. INFORMACJA I SPOSTRZEŻENIA WYCHOWAWCY WYPOCZYNKU DOTYCZĄCE POBYTU UCZESTNIKA WYPOCZYNKU</h3>
               <div className="space-y-2">
                  <div className="border-b-2 border-dotted border-black h-5"></div>
                  <div className="border-b-2 border-dotted border-black h-5"></div>
                  <div className="border-b-2 border-dotted border-black h-5"></div>
                  <div className="border-b-2 border-dotted border-black h-5"></div>
                  <div className="border-b-2 border-dotted border-black h-5"></div>
              </div>

               <div className="flex justify-between items-end mt-8 border-b-2 border-gray-400 pb-8">
                    <div className="text-center w-5/12">
                        <div className="border-b-2 border-dotted border-black h-5"></div>
                        <div className="text-xs">(miejscowość, data)</div>
                    </div>
                    <div className="text-center w-5/12">
                        <div className="border-b-2 border-dotted border-black h-5"></div>
                        <div className="text-xs">(podpis wychowawcy wypoczynku)</div>
                    </div>
                </div>
          </div>

          <div className="text-xs space-y-1 pl-4">
              <p className="flex gap-2"><span>1)</span> <span>Właściwe zaznaczyć znakiem „X”.</span></p>
              <p className="flex gap-2"><span>2)</span> <span>W przypadku wypoczynku o charakterze wędrownym.</span></p>
              <p className="flex gap-2"><span>3)</span> <span>W przypadku uczestnika niepełnoletniego.</span></p>
          </div>

      </div>
        </>
      )}

      {/* --- UMOWA --- */}
       <div className={`${onlyContract ? '' : 'break-before-page'} p-8 pt-12 relative min-h-[29.7cm] text-[12pt]`}>
         <div className="font-bold text-center mb-6">
             <p className="uppercase">UMOWA NR DO. ........</p>
             <p>na opiekę nad dziećmi w ramach półkolonii pn. ,,Wakacje z MOSIREM’’</p>
             <p className="font-normal mt-2">
                 zawarta w Ostrowi Mazowieckiej w dniu <span className="font-bold">{contractSignatureData ? dayMonth : '..................'}</span> 2026 r. pomiędzy:
             </p>
         </div>

         <div className="mb-4">
             <p className="mb-2">Organizator:</p>
             <p className="text-justify">
                 Miasto Ostrów Mazowiecka, ul. 3 Maja 66, 07-300 Ostrów Mazowiecka, NIP 7591625088
                 podmiot reprezentujący - Miejski Ośrodek Sportu i Rekreacji, ul. H. Trębickiego 10,
                 07–300 Ostrów Mazowiecka, zwany w dalszej części umowy MOSiR, reprezentowanym przez
                 Marcina Maliszewskiego – Dyrektora,
                 przy udziale Katarzyny Śniadały – Głównego Księgowego,
             </p>
             <p className="mt-2">a:</p>
         </div>
         
         <div className="mb-4 space-y-4">
            <div>
                <p className="mb-1 uppercase">NAZWISKO I IMIĘ RODZICA (OPIEKUNA PRAWNEGO):</p>
                <div className="border-b-2 border-dotted border-black font-bold h-6">
                    {childData.contractSigner}
                </div>
            </div>
            
            <div>
                <p className="mb-1 uppercase">ADRES ZAMIESZKANIA:</p>
                <div className="border-b-2 border-dotted border-black font-bold h-6">
                     {childData.parentAddress || childData.address}
                </div>
            </div>

            <div>
                <p className="mb-1 uppercase">DOWÓD TOŻSAMOŚCI:</p>
                <div className="flex gap-4 items-baseline">
                    <span className="whitespace-nowrap">seria</span>
                    <span className="min-w-[50px] border-b-2 border-dotted border-black text-center font-bold px-1">
                         {childData.idSeries}
                    </span>
                    <span className="whitespace-nowrap">nr</span>
                    <span className="min-w-[80px] border-b-2 border-dotted border-black text-center font-bold px-1">
                         {childData.idNumber}
                    </span>
                    <span className="whitespace-nowrap">telefon</span>
                    <span className="flex-1 border-b-2 border-dotted border-black font-bold px-2">
                        {childData.parentPhone.split(',')[0]}
                    </span>
                </div>
            </div>
         </div>

         <div className="mb-8 space-y-2 mt-8">
             <div className="flex items-end">
                <span className="whitespace-nowrap mr-2">Zgłaszam udział na półkolonii MOSIR - </span>
                <div className="flex-1 border-b-2 border-dotted border-black font-bold px-2 text-center">
                    {childData.fullName}
                </div>
             </div>
             <div className="text-center text-xs">(imię i nazwisko dziecka)</div>
             
             <div className="flex items-end mt-4">
                <span className="whitespace-nowrap mr-2">na turnus</span>
                <span className="w-24 text-center border-b-2 border-dotted border-black font-bold">
                    {term?.id === 1 ? 'I' : 'II'}
                </span>
                <span className="whitespace-nowrap mx-2">w terminie</span>
                <span className="flex-1 border-b-2 border-dotted border-black font-bold px-2">
                     {term?.dates}
                </span>
             </div>
         </div>
         
         <div className="text-center font-bold mb-4">§ 1.</div>
         <div className="text-justify mb-4">
             1. Warunkiem uczestnictwa w półkolonii pn. „Wakacje z MOSIREM” jest uiszczenie opłaty
             za wypoczynek dziecka w wysokości <strong>630 zł</strong> brutto (słownie:sześćset trzydzieści złotych brutto),
             po wcześniejszym zgłoszeniu chęci uczestnictwa i podpisaniu umowy.
             Opłaty należy dokonać w kasie MOSiR.
         </div>

         <div className="text-center font-bold mb-4">§ 2.</div>
         <div className="text-justify mb-4">
             Podpisując niniejszą Umowę rodzic/opiekun oświadcza, że zapoznał się z Regulaminem 
             uczestnictwa w półkoloniach oraz zakresem usług i świadczeń oraz przyjmuje je do wiadomości
             i przestrzegania przez dziecko uczestniczące w zajęciach. Regulamin dostępny jest na stronie 
             internetowej Organizatora.
         </div>

         <div className="text-center font-bold mb-4">§ 3.</div>
         <div className="text-justify mb-4">
            Wszelkie zmiany niniejszej umowy wymagają zachowania formy pisemnej pod rygorem 
            nieważności.
         </div>

         <div className="text-center font-bold mb-4">§ 4.</div>
         <div className="text-justify mb-4">
            W sprawach nieunormowanych niniejszą umową mają zastosowanie przepisy Kodeksu 
            Cywilnego.
         </div>

         <div className="text-center font-bold mb-4">§ 5.</div>
         <div className="text-justify mb-4">
            Za rzeczy wartościowe zagubione, zniszczone, skradzione Organizator nie ponosi 
            odpowiedzialności.
         </div>
         
         <div className="text-center font-bold mb-4">§ 6.</div>
         <div className="text-justify mb-12">
            Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla stron.
         </div>
         
         <div className="mt-12 flex justify-between items-end">
            <div className="text-center w-5/12">
                <div className="whitespace-nowrap overflow-hidden">.............................................…………</div>
                <div>podpis Organizatora</div>
            </div>
            
            <div className="text-center w-5/12 flex flex-col items-center relative">
                {contractSignatureData ? (
                    <img src={contractSignatureData} alt="Podpis" className="absolute bottom-6 h-12 object-contain" />
                ) : null}
                <div className="whitespace-nowrap overflow-hidden">.............................................………...</div>
                <div>podpis rodzica (opiekuna)</div>
            </div>
      </div>
      </div>

    </div>
  );
}

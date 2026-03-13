import React, { useState, useMemo, useRef } from 'react';
import { 
  Car, 
  Receipt, 
  Search, 
  Settings2,
  Cpu,
  Palette,
  Check,
  Zap,
  Printer,
  Download,
  ShieldCheck,
  Disc,
  Wind
} from 'lucide-react';
import { toPng } from 'html-to-image';
import vehiclesDataRaw from './data/cennik.json';

interface Vehicle {
  name: string;
  price: number;
}

const vehiclesData = vehiclesDataRaw as Vehicle[];

const VISUAL_PARTS: Record<string, number> = {
  'Spoiler': 400, 'Zderzak Przedni': 400, 'Zderzak Tylny': 400, 'Klatka Bezpieczeństwa': 400, 
  'Maska Silnika': 400, 'Dach': 400, 'Progi Boczne': 200, 'Błotnik Lewy': 200, 
  'Błotnik Prawy': 200, 'Układ Wydechowy': 150, 'Grill Przedni': 150, 'Reflektory Xenonowe': 150
};

const EXTRA_PARTS: Record<string, number> = {};
for (let i = 24; i <= 45; i++) {
  EXTRA_PARTS[`Element Tuningu #${i}`] = 100;
}

const FIXED_ITEMS: Record<string, number> = {
  'Lakierowanie Główne': 200, 'Lakierowanie Dodatkowe': 50, 'Lakierowanie Felg': 50, 
  'Lakierowanie Wnętrza': 50, 'Lakierowanie Zacisków': 50, 'Przyciemnianie Szyb (S1)': 200, 
  'Przyciemnianie Szyb (S2)': 250, 'Przyciemnianie Szyb (S3)': 300, 
  'Oklejenie Unikalne (Livery)': 500, 'Felgi Akcesoryjne': 400, 'Felgi Street / Lowrider': 600
};

type PerformanceData = Record<number, [number, number, number]>;
const PERFORMANCE: Record<string, PerformanceData> = {
  'Silnik': { 0: [0, 0, 0], 1: [1000, 0.1, 0.05], 2: [1500, 0.14, 0.06], 3: [2000, 0.17, 0.08], 4: [3000, 0.2, 0.1] },
  'Układ Hamulcowy': { 0: [0, 0, 0], 1: [500, 0.06, 0.02], 2: [1500, 0.14, 0.06], 3: [2000, 0.17, 0.08] },
  'Zawieszenie Sportowe': { 0: [0, 0, 0], 1: [500, 0.06, 0.02], 2: [700, 0.1, 0.03], 3: [900, 0.13, 0.05], 4: [1100, 0.15, 0.06] },
  'Turbosprężarka': { 0: [0, 0, 0], 1: [1000, 0.2, 0.1] }
};

const getVisualPercent = (price: number) => {
  if (price <= 10000) return 0;
  if (price <= 30000) return 0.04;
  return 0.02;
};

const App: React.FC = () => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(vehiclesData[0]);
  const [labor, setLabor] = useState(0);
  const [activeTab, setActiveTab] = useState<'visual' | 'perf' | 'extra'>('visual');
  
  const [selectedVisual, setSelectedVisual] = useState<Set<string>>(new Set());
  const [selectedFixed, setSelectedFixed] = useState<Set<string>>(new Set());
  const [perfStages, setPerfStages] = useState<Record<string, number>>({
    'Silnik': 0, 'Układ Hamulcowy': 0, 'Zawieszenie Sportowe': 0, 'Turbosprężarka': 0
  });

  // Document Info State
  const [tunerName, setTunerName] = useState('');
  const [clientName, setClientName] = useState('');
  const [vehicleUid, setVehicleUid] = useState('');

  const filteredVehicles = useMemo(() => 
    vehiclesData.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  const calculateTotal = () => {
    let total = Number(labor);
    const vehiclePrice = selectedVehicle.price;
    const vp = getVisualPercent(vehiclePrice);
    const selectedPartsArr: {name: string, cost: number}[] = [];

    selectedVisual.forEach(name => {
      const base = VISUAL_PARTS[name] || EXTRA_PARTS[name];
      const cost = base + vehiclePrice * vp;
      total += cost;
      selectedPartsArr.push({ name, cost });
    });

    selectedFixed.forEach(name => {
      const cost = FIXED_ITEMS[name];
      total += cost;
      selectedPartsArr.push({ name, cost });
    });

    Object.entries(perfStages).forEach(([part, stage]) => {
      if (stage > 0) {
        const perfData = PERFORMANCE[part];
        if (perfData && perfData[stage]) {
          const [base, mid, high] = perfData[stage];
          const cost = vehiclePrice <= 10000 
            ? base 
            : base + vehiclePrice * (vehiclePrice <= 30000 ? mid : high);
          total += cost;
          selectedPartsArr.push({ name: `${part} (Poz. ${stage})`, cost });
        }
      }
    });

    return { total, selectedPartsArr };
  };

  const { total, selectedPartsArr } = calculateTotal();

  const suggestedLabor = useMemo(() => {
    let suggested = 0;
    
    // Performance parts labor (per category)
    Object.values(perfStages).forEach(stage => {
      if (stage > 0) {
        const scaling = selectedVehicle.price * 0.005;
        const partLabor = 1000 + scaling;
        suggested += Math.min(1500, Math.max(1000, partLabor));
      }
    });
    
    // Visual and other fixed parts labor (per item)
    const visualCount = selectedVisual.size;
    const fixedCount = selectedFixed.size;
    suggested += (visualCount + fixedCount) * 300;

    return Math.round(suggested);
  }, [selectedVehicle, perfStages, selectedVisual, selectedFixed]);

  const exportAsPng = () => {
    if (invoiceRef.current === null) return;
    const originalVisibility = invoiceRef.current.style.visibility;
    invoiceRef.current.style.visibility = 'visible';

    toPng(invoiceRef.current, { 
      cacheBust: true, 
      backgroundColor: '#ffffff',
      pixelRatio: 2 
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Faktura-${selectedVehicle.name}-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
        if (invoiceRef.current) invoiceRef.current.style.visibility = originalVisibility;
      })
      .catch((err) => {
        console.error('Błąd eksportu faktury:', err);
        if (invoiceRef.current) invoiceRef.current.style.visibility = originalVisibility;
      });
  };

  const toggleVisual = (name: string) => {
    const next = new Set(selectedVisual);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedVisual(next);
  };

  const toggleFixed = (name: string) => {
    const next = new Set(selectedFixed);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedFixed(next);
  };

  return (
    <>
      <div className="app-container">
        <header>
          <div className="brand-title">
            <h1>Kalkulator tuningu .devGaming</h1>
            <span>by Allerek</span>
          </div>
          <div className="header-stats" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="stat-box">
              <span className="stat-label">Tuner</span>
              <input 
                type="text" 
                className="input-float"
                placeholder="Imię Tunera"
                value={tunerName} 
                onChange={(e) => setTunerName(e.target.value)}
              />
            </div>
            <div className="stat-box">
              <span className="stat-label">Klient</span>
              <input 
                type="text" 
                className="input-float"
                placeholder="Imię Klienta"
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="stat-box">
              <span className="stat-label">UID Pojazdu</span>
              <input 
                type="text" 
                className="input-float"
                placeholder="np. 45021"
                value={vehicleUid} 
                onChange={(e) => setVehicleUid(e.target.value)}
              />
            </div>
            <div className="stat-box" style={{ position: 'relative' }}>
              <span className="stat-label">Robocizna ($)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  className="input-float"
                  value={labor} 
                  onChange={(e) => setLabor(Number(e.target.value))}
                />
                {suggestedLabor > 0 && (
                  <button 
                    onClick={() => setLabor(suggestedLabor)}
                    style={{ 
                      background: 'var(--accent-gold)', 
                      color: '#000', 
                      border: 'none', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.65rem', 
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    USTAW
                  </button>
                )}
              </div>
              {suggestedLabor > 0 && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', position: 'absolute', bottom: '-15px', left: '0' }}>
                  Sugerowane: ${suggestedLabor.toLocaleString()}
                </span>
              )}
            </div>
            <div className="stat-box" style={{ borderLeft: '2px solid var(--accent-gold)', paddingLeft: '2rem' }}>
              <span className="stat-label" style={{ color: 'var(--accent-gold)' }}>Całkowity Koszt</span>
              <span className="stat-value" style={{ color: 'var(--accent-gold)' }}>${total.toLocaleString()}</span>
            </div>
          </div>
        </header>

        <main className="main-layout">
          <div className="config-card">
            <div className="section-head">
              <Car size={18} color="var(--accent-red)" />
              <h2>Wybierz Pojazd Bazowy</h2>
            </div>
            <div className="search-container">
              <Search style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={20} />
              <input 
                className="search-input"
                placeholder="Szukaj marki lub modelu..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="vehicle-list">
              {filteredVehicles.map(v => (
                <div 
                  key={`${v.name}-${v.price}`} 
                  className={`vehicle-item ${selectedVehicle.name === v.name ? 'selected' : ''}`}
                  onClick={() => setSelectedVehicle(v)}
                >
                  <h4>{v.name}</h4>
                  <p>${v.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="tab-nav">
              <button className={`tab-trigger ${activeTab === 'visual' ? 'active' : ''}`} onClick={() => setActiveTab('visual')}><Palette size={16} /> WIZUALNE</button>
              <button className={`tab-trigger ${activeTab === 'perf' ? 'active' : ''}`} onClick={() => setActiveTab('perf')}><Zap size={16} /> OSIĄGI</button>
              <button className={`tab-trigger ${activeTab === 'extra' ? 'active' : ''}`} onClick={() => setActiveTab('extra')}><Settings2 size={16} /> DODATKI</button>
            </div>
            <div className="tab-content" style={{ animation: 'fadeIn 0.5s' }}>
              {activeTab === 'visual' && (
                <div className="parts-grid">
                  {Object.keys({...VISUAL_PARTS, ...EXTRA_PARTS}).map(name => (
                    <div key={name} className={`part-card ${selectedVisual.has(name) ? 'active' : ''}`} onClick={() => toggleVisual(name)}>
                      <span>{name}</span>
                      <div className="checkbox-visual">{selectedVisual.has(name) && <Check size={12} color="#000" strokeWidth={4} />}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'perf' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {Object.keys(PERFORMANCE).map(part => (
                    <div key={part} className="perf-control">
                      <div className="perf-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          {part.includes('Silnik') ? <Cpu size={18} color="var(--accent-red)" /> : 
                           part.includes('Hamul') ? <ShieldCheck size={18} color="var(--accent-red)" /> :
                           part.includes('Zawie') ? <Disc size={18} color="var(--accent-red)" /> :
                           <Wind size={18} color="var(--accent-red)" />}
                          <span style={{ fontWeight: 600 }}>{part}</span>
                        </div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>Poz. {perfStages[part]}</span>
                      </div>
                      <div className="level-indicator">
                        {Object.keys(PERFORMANCE[part]).map((stageStr) => {
                          const stage = Number(stageStr);
                          return (
                            <div 
                              key={stage} 
                              className={`level-dot ${perfStages[part] >= stage ? 'active' : ''}`}
                              onClick={() => setPerfStages({...perfStages, [part]: stage})}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'extra' && (
                <div className="parts-grid">
                  {Object.keys(FIXED_ITEMS).map(name => (
                    <div key={name} className={`part-card ${selectedFixed.has(name) ? 'active' : ''}`} onClick={() => toggleFixed(name)}>
                      <span>{name}</span>
                      <div className="checkbox-visual">{selectedFixed.has(name) && <Check size={12} color="#000" strokeWidth={4} />}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="invoice-card">
            <div className="invoice-preview-content">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--accent-gold)', paddingBottom: '1rem' }}>
                <Receipt size={28} color="var(--accent-gold)" />
                <h3 style={{ marginTop: '0.5rem' }}>PODGLĄD FAKTURY</h3>
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-dim)' }}>POJAZD:</span><span>{selectedVehicle.name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><span style={{ color: 'var(--text-dim)' }}>ROBOCIZNA:</span><span>${labor.toLocaleString()}</span></div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                  {selectedPartsArr.map((part, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>• {part.name}</span>
                      <span>${part.cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1.5rem', borderTop: '2px solid var(--accent-gold)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800 }}>SUMA CAŁKOWITA:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-gold)' }}>${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="action-buttons">
              <button className="btn-download" onClick={exportAsPng}><Download size={18} /> Pobierz PNG</button>
              <button className="btn-print" onClick={() => window.print()}><Printer size={18} /> Drukuj PDF</button>
            </div>
          </div>
        </main>
      </div>

      <div id="realistic-invoice" ref={invoiceRef}>
        <div className="real-header">
          <div className="real-logo">
            <h2>DEUTSCHE STYLE</h2>
            <p style={{ fontSize: '10pt', color: '#666' }}>Studio Tuningu i Serwisu Pojazdów</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, fontSize: '28pt' }}>KOSZTORYS</h1>
            <p>Data: {new Date().toLocaleDateString('pl-PL')}</p>
          </div>
        </div>

        <div style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <h4 style={{ marginBottom: '10px', textTransform: 'uppercase', fontSize: '10pt' }}>Szczegóły Zlecenia:</h4>
              <p style={{ fontSize: '10pt' }}>Tuner: <strong>{tunerName || '---'}</strong></p>
              <p style={{ fontSize: '10pt' }}>Klient: <strong>{clientName || '---'}</strong></p>
            </div>
            <div>
              <h4 style={{ marginBottom: '10px', textTransform: 'uppercase', fontSize: '10pt' }}>Informacje o pojeździe:</h4>
              <p style={{ fontSize: '12pt' }}>Marka/Model: <strong>{selectedVehicle.name}</strong></p>
              <p style={{ fontSize: '10pt' }}>UID Pojazdu: <strong>{vehicleUid || '---'}</strong></p>
              <p style={{ fontSize: '10pt', color: '#666' }}>Wartość rynkowa: ${selectedVehicle.price.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <table className="real-table">
          <thead>
            <tr>
              <th style={{ width: '70%', textAlign: 'left' }}>Opis modyfikacji / Usługi</th>
              <th style={{ textAlign: 'right' }}>Kwota</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Robocizna warsztatowa i diagnostyka</td>
              <td style={{ textAlign: 'right' }}>${labor.toLocaleString()}</td>
            </tr>
            {selectedPartsArr.map((part, i) => (
              <tr key={i}>
                <td>{part.name}</td>
                <td style={{ textAlign: 'right' }}>${part.cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="real-summary">
          <div className="real-row real-total">
            <span>SUMA DO ZAPŁATY:</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="real-stamp">
              DEUTSCHE STYLE<br />STUDIO<br />LOS SANTOS
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '5px', fontSize: '10pt' }}>
              Zatwierdzono przez serwis
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;

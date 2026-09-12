import React, { useState } from 'react';
import type { MonasterySettings } from '../types';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Sliders,
  Database
} from 'lucide-react';

interface BackupModalProps {
  settings: MonasterySettings;
  setSettings: (updater: MonasterySettings | ((prev: MonasterySettings) => MonasterySettings)) => void;
  exportAllDataJson: () => void;
  importAllDataJson: (jsonString: string) => { success: boolean; error?: string };
  resetToDefaults: () => void;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  settings,
  setSettings,
  exportAllDataJson,
  importAllDataJson,
  resetToDefaults,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'backup'>('settings');

  // Settings form states
  const [monasteryName, setMonasteryName] = useState(settings.monasteryName);
  const [abbotName, setAbbotName] = useState(settings.abbotName);
  const [ecclesiarchName, setEcclesiarchName] = useState(settings.ecclesiarchName);
  const [location, setLocation] = useState(settings.location);
  const [avoidDouble, setAvoidDouble] = useState(settings.autoAvoidDoubleBooking);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings({
      monasteryName: monasteryName.trim() || 'Mănăstirea',
      abbotName: abbotName.trim() || 'Stareț',
      ecclesiarchName: ecclesiarchName.trim() || 'Eclesiarh',
      location: location.trim(),
      weekStartDay: 1,
      autoAvoidDoubleBooking: avoidDouble,
    });
    setFeedbackMsg({ text: 'Setările au fost salvate cu succes!', isError: false });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = importAllDataJson(content);
      if (res.success) {
        setFeedbackMsg({ text: 'Datele au fost restaurate cu succes!', isError: false });
      } else {
        setFeedbackMsg({ text: `Eroare la import: ${res.error}`, isError: true });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Sigur doriți să resetați toate datele la valorile demonstrative inițiale? Toate modificările proprii vor fi înlocuite.')) {
      resetToDefaults();
      setFeedbackMsg({ text: 'Datele au fost resetate la valorile demonstrative inițiale.', isError: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 font-sf">
      <div className="apple-glass rounded-3xl max-w-lg w-full overflow-hidden text-white border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-white">
              Preferințe & Siguranță Date
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - Apple Segmented Control */}
        <div className="p-4 pb-0">
          <div className="apple-segmented flex">
            <button
              onClick={() => setActiveTab('settings')}
              className={`apple-segmented-item flex-1 py-2 text-center text-xs font-semibold rounded-full transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'settings' ? 'active' : 'text-white/60 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Informații Mănăstire</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`apple-segmented-item flex-1 py-2 text-center text-xs font-semibold rounded-full transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'backup' ? 'active' : 'text-white/60 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Backup & PWA Offline</span>
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div className={`mx-4 mt-3 p-3 rounded-xl text-xs flex items-center space-x-2.5 ${
            feedbackMsg.isError 
              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30' 
              : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
          }`}>
            {feedbackMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 max-h-[62vh] overflow-y-auto">
          {activeTab === 'settings' ? (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                  Numele Mănăstirii / Schitului
                </label>
                <input
                  type="text"
                  value={monasteryName}
                  onChange={e => setMonasteryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                    Nume Stareț
                  </label>
                  <input
                    type="text"
                    value={abbotName}
                    onChange={e => setAbbotName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                    Nume Eclesiarh
                  </label>
                  <input
                    type="text"
                    value={ecclesiarchName}
                    onChange={e => setEcclesiarchName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 block">
                  Localitate / Județ
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-white/[0.1] transition-all"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-3 cursor-pointer select-none p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={avoidDouble}
                    onChange={e => setAvoidDouble(e.target.checked)}
                    className="mt-0.5 rounded-lg bg-stone-900 border-white/20 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Evită automat suprapunerea de ascultări
                    </span>
                    <span className="text-[11px] text-white/50 leading-tight block mt-0.5">
                      Algoritmul nu va programa aceeași persoană la două ascultări simultan în aceeași zi (ex: Altar și Șoferie).
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  className="apple-gold-button flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvează Setările</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* PWA Info */}
              <div className="apple-glass rounded-2xl p-4 border border-amber-500/25 bg-amber-500/10 flex items-start space-x-3.5">
                <Smartphone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-amber-200 text-xs block">Aplicație PWA 100% Offline</span>
                  <p className="text-white/70 leading-relaxed text-[11px]">
                    Graphic funcționează complet independent de conexiunea la internet. O puteți adăuga pe ecranul principal al telefonului sau tabletei prin opțiunea „Adaugă la ecranul principal” (Add to Home Screen) din Safari sau Chrome.
                  </p>
                </div>
              </div>

              {/* Export JSON */}
              <div className="apple-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Export Copie de Siguranță</h4>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Descarcă fișierul JSON cu toți slujitorii, ascultările și graficul curent.
                  </p>
                </div>
                <button
                  onClick={exportAllDataJson}
                  className="apple-button flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 text-xs font-medium border border-white/10"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              {/* Import JSON */}
              <div className="apple-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Restaurare din Fișier</h4>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Încarcă un backup JSON salvat anterior pentru a restaura instantaneu datele.
                  </p>
                </div>
                <label className="apple-button flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset to Default */}
              <div className="apple-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Revenire la Datele Inițiale</h4>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    Resetează baza de date la valorile demonstrative inițiale ale mănăstirii.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="apple-button flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium border border-rose-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Resetare</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


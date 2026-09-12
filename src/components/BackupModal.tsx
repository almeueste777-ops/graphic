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
  AlertCircle 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-100">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
          <div className="flex items-center space-x-2">
            <h3 className="font-serif font-bold text-lg text-amber-100">
              Setări & Copie de Siguranță
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === 'settings'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-stone-800/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Informații Mănăstire
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === 'backup'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-stone-800/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Backup & PWA Offline
          </button>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div className={`p-3 text-xs flex items-center space-x-2 ${
            feedbackMsg.isError ? 'bg-rose-950 text-rose-200 border-b border-rose-800' : 'bg-emerald-950 text-emerald-200 border-b border-emerald-800'
          }`}>
            {feedbackMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {activeTab === 'settings' ? (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Numele Mănăstirii / Schitului
                </label>
                <input
                  type="text"
                  value={monasteryName}
                  onChange={e => setMonasteryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                    Nume Stareț
                  </label>
                  <input
                    type="text"
                    value={abbotName}
                    onChange={e => setAbbotName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                    Nume Eclesiarh
                  </label>
                  <input
                    type="text"
                    value={ecclesiarchName}
                    onChange={e => setEcclesiarchName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 block">
                  Localitate / Județ
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={avoidDouble}
                    onChange={e => setAvoidDouble(e.target.checked)}
                    className="mt-0.5 rounded bg-stone-800 border-stone-700 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-200 block">
                      Evită automat suprapunerea de ascultări
                    </span>
                    <span className="text-[11px] text-stone-400 leading-tight block mt-0.5">
                      Algoritmul nu va programa aceeași persoană la două ascultări simultan în aceeași zi (ex: Altar și Șoferie).
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-800 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvează Setările</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {/* PWA Info */}
              <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3.5 text-xs text-amber-200/90 flex items-start space-x-3">
                <Smartphone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-200 block">Aplicație PWA 100% Offline</span>
                  <p className="text-stone-300 leading-relaxed text-[11px]">
                    Graphic funcționează independent de conexiunea la internet. O puteți adăuga pe ecranul principal al telefonului sau tabletei prin opțiunea „Adaugă la ecranul de pornire” (Add to Home Screen) din browser.
                  </p>
                </div>
              </div>

              {/* Export JSON */}
              <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-stone-200">Export Copie de Siguranță</h4>
                  <p className="text-[11px] text-stone-400">
                    Descarcă fișierul JSON cu toți slujitorii, ascultările și graficul.
                  </p>
                </div>
                <button
                  onClick={exportAllDataJson}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* Import JSON */}
              <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-stone-200">Restaurare din Fișier</h4>
                  <p className="text-[11px] text-stone-400">
                    Încarcă un backup JSON salvat anterior.
                  </p>
                </div>
                <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset to Default */}
              <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-stone-200">Revenire la Datele Inițiale</h4>
                  <p className="text-[11px] text-stone-400">
                    Resetează baza de date la valorile demonstrative inițiale.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-red-950/70 text-stone-400 hover:text-red-300 text-xs font-medium transition-colors"
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

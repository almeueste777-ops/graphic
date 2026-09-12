# Graphic — Sistem de Organizare a Obștii și a Ascultărilor Monahale (PWA)

**Graphic** este o aplicație web progresivă (PWA) dedicată comunităților monahale pentru planificarea, rotația și generarea automată a graficului săptămânal al slujbelor și ascultărilor (Altar, Strană, Paracliserie, Șoferie, Trapeză etc.).

---

## ☦️ Caracteristici Principale

- **Evidența Obștii:** Rânduiala rangurilor (*Arhimandrit, Ieromonah, Monah, Frate* etc.), telefon, notițe și atribuirea ascultărilor compatibile pentru fiecare slujitor.
- **Ascultări & Module Extensibile:**
  - *Altar* (Preot de rând, Ajutor/Diacon)
  - *Strană* (Protopsalt, Ajutor/Cititor Ceasuri & Apostol)
  - *Paracliserie* (Paracliser de rând)
  - *Șoferie* (Șofer de serviciu / deplasări)
  - *Trapeză & Bucătărie* (Bucătar de rând)
  - **Module nelimitate noi:** Puteți crea direct din interfață orice modul nou (*Pangar, Grădină, Atelier, Ghidaj pelerini*) cu alegerea culorii, a pictogramei și a tipului de rotație (săptămânal sau zilnic).
- **Algoritm Inteligent de Generare & Rotație:**
  - *Echitate (Fair-Share):* Prioritate pentru cei cu cele mai puține ture efectuate.
  - *Săptămâna de rând:* Menținerea aceluiași slujitor pe parcursul celor 7 zile ale săptămânii de rând.
  - *Compatibilitate:* Verifică automat dacă slujitorul este calificat pentru ascultarea respectivă.
  - *Evitarea suprapunerilor:* Împiedică programarea aceleiași persoane în două locuri simultan în aceeași zi (ex: Altar și Șoferie).
- **Învoiri & Reguli de Înlocuire (X ➔ Y ➔ Z):**
  - Înregistrarea concediilor, deplasărilor sau a perioadelor de chilie cu desemnarea unui **înlocuitor preferat**.
  - Reguli automate de substituție când cineva lipsește.
- **Panou de Afișaj & Tipărire A4 (Avizier):**
  - Format îngrijit pentru tipar direct sau salvare în format PDF.
  - Antet cu numele mănăstirii, casetă pentru rânduieli/anunțuri particulare și loc de semnătură pentru **Stareț** și **Eclesiarh**.
- **100% Offline (PWA) & Backup JSON:**
  - Funcționează fără conexiune la internet prin Service Worker.
  - Poate fi instalată pe telefon sau tabletă ca aplicație nativă (*Add to Home Screen*).
  - Export și restaurare copie de siguranță într-un singur fișier JSON.

---

## 🚀 Tehnologii

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 8
- **Stilizare:** Tailwind CSS v4 + Lucide Icons
- **PWA:** `vite-plugin-pwa` (Service Worker & Manifest offline)
- **Testare:** Vitest

---

## 🛠️ Instalare și Rulare Locală

```bash
# Instalare dependențe
npm install

# Rulare mediu de dezvoltare
npm run dev

# Rulare teste unitare
npm test

# Compilare producție
npm run build
```

---

## 📄 Licență
MIT

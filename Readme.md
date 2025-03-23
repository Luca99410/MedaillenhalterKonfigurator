# Setup-Anleitung

## Backend Setup

Ein einfacher Backend-Server mit FastAPI.

### 1. Repository & externes Modul klonen

Wechsle in das Backend Verzeichnis:
```bash
cd backend
```

(optional, derzeit nicht nötig! Das externe Modul für WebAuthn klonen)

```bash
git clone https://github.com/duo-labs/py_webauthn.git backend/extern # manuell nötig für WebAuthn, wird bei dem Klonen diesen Repos nicht automatisch hinzugefügt
```

### 3. Abhängigkeiten installieren
Jetzt die Abhängigkeiten installieren
```bash
pip install -r requirements.txt
```

### 4. Virtuelle Umgebung aktivieren
Virtuelle Umgebung aktivieren
```bash
source venv/bin/activate     # (Linux/macOS)
```
oder
```bash
.\venv\Scripts\activate      # (Windows)
```

### 5. Server starten
```bash
uvicorn main:app --reload
```

## Frontend Setup

Dies ist die Anleitung, um das Frontend lokal zum Laufen zu bringen

### Voraussetzungen
- Backend läuft bereits
- Node.js 
- npm (wird mit Node.js installiert)

### 6. In das Frontend-Verzeichnis wechseln

```bash
cd frontend
```
### 7. Abhängigkeiten installieren
```bash
npm install
```
### 8. Entwicklungsserver starten
```bash
npm start
```
Die App ist nun unter http://localhost:3000 im Browser erreichbar.

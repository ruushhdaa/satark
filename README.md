# SATARK - Smart Active Tracking And Recovery Key

A honeypot-based physical identity card protection system developed as part of the Design Thinking course (FY B.Tech CSE - Data Science, MITAOE, Pune).

## Problem Statement

In India, the loss or theft of physical identity documents such as college ID cards, Aadhaar cards, and PAN cards is a widespread issue. Once stolen, these cards can be misused for impersonation, financial fraud, and identity theft. Victims usually remain unaware of when, where, or by whom their card is being used. Existing solutions are mostly reactive — filing complaints or blocking documents — and do not provide real-time tracking or deterrence.

There is a clear need for a proactive system that can detect misuse of a lost or stolen identity card and capture actionable evidence without requiring complex infrastructure from the verifier’s side.

## Proposed Solution

SATARK transforms a regular identity card into an intelligent security device using a QR code. The system operates in two distinct modes:

- **SAFE Mode**: When the card is with the owner, any scan sends a verification request to the owner for approval.
- **LOST Mode**: When the owner marks the card as lost, the system activates a honeypot trap. The thief sees a convincing “Verification Successful” page, while the system silently captures their location, IP address, device information, and timestamp in the background.

This approach turns the stolen card into an active tracking mechanism, giving the owner real-time visibility and strong digital evidence.

## How It Works

1. The owner registers their identity card on the SATARK dashboard and prints the generated QR code on their physical card.
2. If the card is lost, the owner logs into the dashboard and switches the card to **LOST** mode.
3. When someone scans the QR code, the system checks the current mode:
   - In SAFE mode, it requests approval from the owner.
   - In LOST mode, it displays a fake success screen to the scanner while capturing GPS coordinates (via browser), IP address, device fingerprint, and timestamp.
4. All captured data is stored and displayed in real-time on the owner’s dashboard under the Threat Logs section.
5. The owner can later use this data for police complaints or further investigation.

## Key Features

- Dual-mode operation (SAFE and LOST/Honeypot)
- Silent location and device data capture in LOST mode
- Real-time dashboard with live metrics and activity feed
- Clean, professional dark-themed interface
- One-click mode switching from the Control Panel
- Scan Simulator for testing and demonstration
- Complete API documentation
- Deployed backend on Render and frontend on Vercel

## Technology Stack

**Frontend:**  
- React.js  
- Axios for API communication  
- Custom CSS (dark SaaS-inspired design)

**Backend:**  
- Python + Flask  
- Gunicorn (production server)  
- SQLite (for storing logs during development)

**Deployment:**  
- Frontend: Vercel  
- Backend: Render

**Live Demo:** https://satark-webapp.vercel.app

## Project Structure

satark/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── render.yaml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md

## Design Thinking Process

**Empathize:** Conducted user interviews with students and professionals who had lost their identity cards. Discovered high levels of anxiety and helplessness due to lack of tracking.

**Define:** Defined the core problem as “lack of real-time detection and evidence collection after identity card theft.”

**Ideate:** Brainstormed multiple concepts including RFID, blockchain, and biometric solutions. Selected the QR code + honeypot approach because it requires zero additional hardware on the verifier’s side and is highly practical.

**Prototype:** Built a fully functional web application with React frontend and Flask backend. Focused on realistic simulation of theft scenarios.

**Test:** Tested multiple scenarios including safe scans, trap activation, GPS capture, and mode switching. Validated that the system works reliably across different devices.

## Local Setup

**Backend:**

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py

**Frontend:**

cd frontend
npm install
npm start

Make sure to update `REACT_APP_BACKEND_URL` in the `.env` file.

## Deployment

- Backend is deployed on Render using `render.yaml`
- Frontend is deployed on Vercel at `https://satark-webapp.vercel.app`


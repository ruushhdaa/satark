from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

# --- CARD STATE ---
CARD_STATUS = "SAFE"
THIEF_LOGS = []

# --- HEALTH CHECK ---
@app.route('/')
def home():
    return jsonify({
        "project": "SATARK",
        "status": "Server Running",
        "card_status": CARD_STATUS
    })

# --- QR SCAN ROUTE ---
@app.route('/scan/<card_id>')
def scan_card(card_id):
    global CARD_STATUS
    if CARD_STATUS == "SAFE":
        print(f"[SAFE] Card {card_id} scanned — sending verification request")
        return jsonify({
            "mode": "SAFE",
            "card_id": card_id,
            "message": "Verification request sent to owner. Awaiting approval."
        })
    elif CARD_STATUS == "LOST":
        print(f"[TRAP] Card {card_id} scanned — honeypot activated")
        return jsonify({
            "mode": "TRAP",
            "card_id": card_id,
            "message": "Verification Successful. Identity Confirmed."
        })

# --- ADMIN TOGGLE ---
@app.route('/admin/toggle')
def toggle_status():
    global CARD_STATUS
    if CARD_STATUS == "SAFE":
        CARD_STATUS = "LOST"
    else:
        CARD_STATUS = "SAFE"
    print(f"[ADMIN] Card status switched to: {CARD_STATUS}")
    return jsonify({
        "message": f"Status switched to {CARD_STATUS}",
        "current_status": CARD_STATUS
    })

# --- TRAP API — receives thief location ---
@app.route('/api/capture', methods=['POST'])
def capture_thief():
    data = request.json
    thief_ip = request.remote_addr
    location = data.get('location', 'Unknown')
    device = data.get('device', 'Unknown')
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    log_entry = {
        "ip": thief_ip,
        "location": location,
        "device": device,
        "timestamp": timestamp
    }

    THIEF_LOGS.append(log_entry)

    print("\n" + "="*40)
    print(f"ALERT: THIEF DETECTED")
    print(f"IP Address : {thief_ip}")
    print(f"Location   : {location}")
    print(f"Device     : {device}")
    print(f"Time       : {timestamp}")
    print("="*40 + "\n")

    return jsonify({"status": "captured"})

# --- VIEW LOGS ---
@app.route('/admin/logs')
def view_logs():
    return jsonify({
        "total_captures": len(THIEF_LOGS),
        "logs": THIEF_LOGS
    })

# --- CARD STATUS CHECK ---
@app.route('/api/status')
def get_status():
    return jsonify({
        "card_status": CARD_STATUS
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
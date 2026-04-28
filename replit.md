# MozPay - Digital Earning Platform

## Overview
MozPay is a mobile-first digital earning platform targeting the Mozambican market. Users can earn money through activities like Ads View, Spin Wheel, and Chatbots, and manage funds using local payment methods (M-Pesa, e-Mola, mKesh).

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+) — no frameworks
- **Server**: Node.js HTTP server (native `http`) — serves static files + `/api/sms-webhook` and `/api/health`
- **Backend data**: Supabase (auth, wallets, transactions, system_settings, sms_log, pending_payments) with realtime subscriptions used by the deposit/investment flow
- **Fonts**: Google Fonts (Inter, Hanken Grotesk, DM Sans, Space Grotesk)

## Project Layout
```
.
└── dcf-Copyzip/             # Application root
    ├── index.html           # Login & Registration page
    ├── home.html            # Main Dashboard SPA
    ├── admin.html           # Admin panel
    ├── app.js               # Authentication and UI transition logic
    ├── home.js              # Dashboard and transaction simulation logic
    ├── styles.css           # Global styles
    ├── server.js            # Node.js HTTP server (Port 5000, host 0.0.0.0) — static + SMS webhook
    ├── SMS_FORWARDER_SETUP.md # End-user guide to wire the SMS Forwarder Android app to the webhook
    ├── assets/              # Logos, backgrounds, currency notes
    ├── fotos/               # Hero carousel images
    └── tela de levantamento/ # Withdrawal screen assets
```

## Running the App (Replit)
- **Workflow**: "Start application" — runs `node dcf-Copyzip/server.js`
- **Port**: 5000 on 0.0.0.0
- The static server resolves files relative to its own directory (`__dirname`),
  so `dcf-Copyzip/` is the served document root.

## Key Features
- Multi-step user registration (Name → Phone/Email → Password/Invite Code)
- Dashboard with balance display and earning activities
- Local payment operator detection (M-Pesa: 84/85, e-Mola: 86/87, mKesh: 82/83)
- Currency in MT (Mozambican Metical)

## Deployment
- Target: autoscale
- Run command: `node dcf-Copyzip/server.js`

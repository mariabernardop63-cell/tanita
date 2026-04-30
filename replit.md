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

## Important Implementation Notes
- **`home.js` is encoded as UTF-16 LE with BOM.** Standard `read`/`edit` tools fail on it. Use the Node.js editor template at `/tmp/edit_home.js` (preserves BOM via `Buffer.concat([Buffer.from([0xFF,0xFE]), Buffer.from(s, "utf16le")])`) for any modification.
- **Supabase tables in use**: `wallets` (balance, total_deposited, total_withdrawn, level_plan, level_expires_at), `pending_payments` (status: pending/approved/rejected — `amount` rows where status='approved' = MozPay revenue), `transactions`, `withdrawal_requests`, `refund_requests`, `chat_messages` (admin↔user realtime chat — separate from below), `admin_messages` (Reportes/Denúncias from Samara IA — columns: `id`, `sender_id`, `sender_name`, `sender_phone`, `subject`, `message`, `status` (default 'pending'), `admin_reply`, `replied_by`, `replied_at`, `created_at`), `notifications`, `online_users`, `system_settings`, `sms_log`, `user_preferences` (invited_by).
- **Withdrawals**: minimum 50 MT, maximum 10 000 MT, fee computed by `calcFee(amount)` (3% with min 5 MT capped at 50 MT) — applied uniformly across home.html and home.js. Investments use 0 fee.
- **Investment plans** activate `wallets.level_plan` (label) + `wallets.level_expires_at` (180 days) on admin approval.
- **Reportes admin section** (`page-reports` in admin.html) reads/writes `admin_messages` with status `pending`/`resolved`. Sidebar badge `#reportsBadge` is updated by `loadDashboard()` and `loadReports()`.
- **Profile painel "Mais" button** (`#profileMoreBtn`) switches the profile to the Definições tab (`data-tab="2"`).

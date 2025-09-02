# FastKey – Biometric Authentication System

<p align="center">
  <img src="FASTkey.png" alt="FastKey Logo" width="1060">
</p>

**FastKey** is a cross-platform, passwordless authentication system built on **FIDO2/WebAuthn** standards.
It provides biometric authentication (fingerprint, Face ID, hardware keys) with end-to-end encryption, while ensuring biometric data never leaves the device.

---

## Why FastKey?

* **Standards-First** – Built on FIDO2/WebAuthn (no vendor lock-in, enterprise-ready).
* **Device-Centric Security** – Zero-knowledge design; biometric templates never transmitted or stored centrally.
* **Cross-Platform** – Flutter for iOS/Android, Next.js for web, Node.js backend.
* **Offline Capability** – Authentication works even without a live internet connection.
* **Operationally Practical** – Docker support, structured logging, production-ready APIs.

---

## Features

### Security

* ✅ FIDO2/WebAuthn compliance
* ✅ Biometric authentication (Face ID, fingerprint, hardware keys)
* ✅ End-to-end encryption with certificate pinning
* ✅ Session revocation & audit logging
* ✅ Hardware Security Module (HSM) integration

### Developer Experience

* Clean, modular architecture
* REST + real-time APIs (Socket.io)
* Dockerized deployment
* Detailed logs for observability and debugging

### Platform Support

* **Mobile:** Flutter app (iOS & Android) with offline mode, push notifications, and lightweight background footprint
* **Web:** Next.js dashboard with admin panel, user/device management, and real-time monitoring

---

## Use Cases

* **Enterprise SSO** – Replace internal passwords with secure biometric authentication.
* **Banking/Finance** – Customer authentication with regulatory-grade security.
* **Healthcare** – HIPAA-compliant access control.
* **E-commerce** – Passwordless checkout flows.
* **Personal projects** – Simple, secure authentication drop-in.

---

## Quick Start

### Requirements

* Flutter SDK ≥ 3.0.0
* Node.js ≥ 18.0.0
* npm or yarn

### Setup

```bash
# Clone
git clone https://github.com/yourusername/FastKey.git
cd FastKey

# Backend
cd backend
npm install
npm start

# Web frontend
cd ../frontend
npm install
npm run dev

# Mobile
cd ../app
flutter pub get
flutter run
```

### Production

```bash
# Backend
cd backend
npm run build && npm run start:prod

# Frontend
cd frontend
npm run build && npm start

# Mobile (APK)
cd app
flutter build apk --release
```

---

## API Overview

### Authentication

```http
POST /api/auth/register          # Register new user
POST /api/auth/login             # Initiate login flow
GET  /api/auth/status/:sessionId # Check login status
POST /api/auth/verify            # Verify credential
```

### User Management

```http
GET    /api/users                # List users
GET    /api/users/:id            # Get user details
PUT    /api/users/:id            # Update user
DELETE /api/users/:id            # Delete user
```

### Security

```http
GET  /api/security/logs          # Audit logs
POST /api/security/revoke        # Revoke sessions
GET  /api/security/devices       # List registered devices
```
---

## License

MIT License – see [LICENSE](LICENSE) for details.

---

<p align="center"><strong>Built by Satwik Singh :) </strong></p>


# FastKey - Secure Biometric Authentication System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-web%20%7C%20mobile-orange)

## 🔑 Overview

FastKey is a modern biometric authentication system that enables seamless and secure login across devices using fingerprint or facial recognition. By leveraging WebAuthn standards and device biometrics, FastKey eliminates the need for passwords while providing enterprise-grade security.

## ✨ Key Features

- **Passwordless Authentication**: Login using your device's biometric features (fingerprint, Face ID)
- **Cross-Device Authentication**: Authenticate on desktop by scanning a QR code with your mobile device
- **Real-Time Communication**: Instant authentication updates between devices using Socket.io
- **Enterprise-Grade Security**: Based on WebAuthn standards with anti-replay protection
- **Elegant User Experience**: Polished UI with smooth transitions and feedback
- **Offline Compatibility**: Works even when connection between devices is unstable
- **Device Management**: Track and manage authenticated devices

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express**
- **Socket.io** for real-time communication
- **WebAuthn API** for biometric authentication
- **JWT** for session management
- **File-based storage** for development (expandable to other databases)

### Frontend
- **Next.js** for server-side rendering and routing
- **React** for UI components
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.io Client** for real-time updates

## 🏗️ Architecture

FastKey uses a three-part architecture:

1. **Desktop Interface**: The primary web interface where users initiate login
2. **Mobile Interface**: The authentication endpoint where biometric verification happens
3. **Backend Server**: Coordinates authentication, manages sessions, and handles WebAuthn verification

### Authentication Flow

1. User enters username on desktop
2. QR code is generated and displayed
3. User scans QR code with mobile device
4. Mobile device prompts for biometric verification
5. After successful verification, desktop is automatically authenticated

## 📋 Prerequisites

- Node.js 16.x or higher
- NPM 8.x or higher
- A mobile device with biometric capabilities
- A desktop/laptop with a camera (for QR code scanning)

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fastkey.git
cd fastkey
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Configuration

1. Create a `.env` file in the backend directory:
```
JWT_SECRET=your_secret_key
PORT=5001
FRONTEND_URL=http://localhost:3000
```

2. Create a `.env.local` file in the frontend directory:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Access the application:
   - Desktop interface: `http://localhost:3000`
   - Mobile interface (when scanning QR): Will direct to appropriate URL

## 🔒 Security Considerations

- FastKey uses WebAuthn standards which are resistant to phishing and replay attacks
- All communication between devices is secured
- Biometric data never leaves the user's device
- Session tokens are encrypted and short-lived
- Challenge-response mechanisms prevent MITM attacks

## 🌐 Deployment

### Backend Deployment

The backend can be deployed to any Node.js hosting service:

```bash
# Example for Heroku
heroku create fastkey-backend
git subtree push --prefix backend heroku main
```

### Frontend Deployment

The frontend can be deployed to Vercel:

```bash
cd frontend
vercel
```

Remember to set the environment variables on your hosting platforms.

## 📱 Supported Devices

- **Mobile Authentication**:
  - iOS 14.5+ (Safari)
  - Android (Chrome)
  
- **Desktop**:
  - Chrome on Windows/macOS
  - Edge on Windows
  - Firefox on Windows/macOS
  - Safari on macOS

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [WebAuthn.io](https://webauthn.io/) for educational resources
- [Socket.io](https://socket.io/) for real-time communications
- [FIDO Alliance](https://fidoalliance.org/) for the WebAuthn standard

---

*Made by Satwik Singh*
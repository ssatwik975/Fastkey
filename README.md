# FastKey: Advanced Passwordless Authentication System

[Project Documentation](./publication.md)

## Overview

FastKey is a cutting-edge passwordless authentication system that eliminates the vulnerabilities of traditional password-based logins. Leveraging FIDO2/WebAuthn standards, it provides a seamless, secure login experience through QR-initiated mobile biometric verification.

**Live Demo:** [https://fastkey.satwik.in](https://fastkey.satwik.in)

### Core Technology Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, Socket.io-client
- **Mobile App:** Flutter, Biometric Authentication, WebView Integration
- **Backend:** Node.js, Express.js, Socket.io, JWT-based Authentication
- **Security:** FIDO2/WebAuthn, Public-key Cryptography, Origin-bound Credentials

## Key Features

- **Truly Passwordless Authentication:** No passwords to remember, steal, or phish
- **Cross-Device Authentication Flow:** QR code-based desktop-to-mobile authentication
- **Biometric Security:** Leverages device-native biometric verification (fingerprint/face recognition)
- **Real-time Communication:** Instant authentication state synchronization across devices
- **Comprehensive Security Model:** Resistant to phishing, credential stuffing, and replay attacks
- **Elegant, Responsive UI:** Smooth animations and transitions with intuitive user journeys

## Technical Implementation Highlights

### Advanced Frontend Architecture

- **Dynamic QR Code Generation:** Real-time QR generation for secure cross-device authentication
- **Reactive State Management:** Sophisticated state transitions using React hooks
- **WebAuthn Integration:** Complex cryptographic operations with the WebAuthn API
- **WebSocket Communication:** Real-time event-driven architecture with Socket.io
- **Responsive Design:** Tailwind CSS implementation for pixel-perfect interfaces

```jsx
// Example: Real-time WebAuthn authentication flow
const startAuthentication = async () => {
    try {
        // Request authentication options from server
        const options = await fetchAuthenticationOptions();
        
        // Convert Base64URL to proper ArrayBuffer format for WebAuthn
        options.challenge = base64urlToArrayBuffer(options.challenge);
        options.allowCredentials = options.allowCredentials.map(credential => ({
            ...credential,
            id: base64urlToArrayBuffer(credential.id),
        }));
        
        // Trigger biometric verification on device
        const credential = await navigator.credentials.get({
            publicKey: options,
        });
        
        // Process and verify the authentication response
        const result = await verifyAuthentication(prepareCredentialForServer(credential));
        
        // Real-time notification to the desktop client
        await notifyDesktop(sessionId, username, true);
        
        return result;
    } catch (error) {
        handleAuthenticationError(error);
    }
};
```

### Flutter Mobile Implementation

- **Biometric Authentication:** Integration with platform-specific biometric APIs
- **Push Notification Handling:** Real-time authentication request processing
- **Secure Storage:** Encrypted credential and token management
- **Cross-Platform Compatibility:** Unified codebase for iOS and Android

```dart
// Flutter: Secure biometric authentication implementation
Future<bool> authenticateWithBiometrics() async {
    try {
        return await _localAuth.authenticate(
            localizedReason: 'Verify your identity to approve this login request',
            options: const AuthenticationOptions(
                stickyAuth: true,
                biometricOnly: true,
            ),
        );
    } on PlatformException catch (e) {
        _logger.severe('Biometric authentication failed: ${e.message}');
        return false;
    }
}
```

### Backend Security Architecture

- **Robust WebAuthn Implementation:** Server-side cryptographic verification
- **Challenge-Response Protocol:** Secure server-generated challenges
- **Session Management:** Secure, short-lived JWT authentication
- **Replay Attack Prevention:** Signature counter validation for credential verification
- **Real-time Socket Management:** Efficient, event-driven communication


## Engineering Challenges & Solutions

### Cross-Browser WebAuthn Compatibility

Implemented browser-specific detection and workarounds to ensure consistent WebAuthn behavior across Chrome, Firefox, and Safari on both desktop and mobile platforms.

### Real-time Authentication State Synchronization

Designed a robust state management system using Socket.io to ensure seamless, real-time synchronization between desktop and mobile clients, with fallback mechanisms for network interruptions.

### Mobile Browser Limitations

Developed sophisticated feature detection and polyfills to handle incomplete WebAuthn implementations in various mobile browsers, ensuring a consistent user experience.

### Secure Session Management

Implemented cryptographically secure session identifiers with automatic expiration and single-use validation to prevent session hijacking and replay attacks.


## Getting Started

### Prerequisites

- Node.js (v18+)
- Flutter SDK
- Android Studio or Xcode for mobile development

### Installation & Setup

1. **Clone the repository**
     ```bash
     git clone https://github.com/yourusername/fastkey.git
     cd fastkey
     ```

2. **Backend Setup**
     ```bash
     cd backend
     npm install
     npm start
     ```

3. **Frontend Setup**
     ```bash
     cd ../frontend
     npm install
     npm run dev
     ```

4. **Mobile App Setup**
     ```bash
     cd ../app
     flutter pub get
     flutter run
     ```

## Why This Project Matters

In an era where password breaches are commonplace, FastKey demonstrates a robust alternative that significantly enhances security while improving user experience. By leveraging device biometrics and eliminating passwords entirely, it addresses critical vulnerabilities in traditional authentication systems.

The implementation showcases deep understanding of:

- Modern frontend frameworks and state management
- Cross-platform mobile development
- Real-time communication protocols
- Cryptographic security standards
- User-centered design principles
- Complex distributed system architecture

## Future Enhancements

- Migration to production-grade database for user management
- Advanced account recovery mechanisms
- Comprehensive authenticator management interface
- Enhanced logging and monitoring
- Accessibility compliance (WCAG AA/AAA)
- Automated testing suite for continuous integration

## Resources & References

- [FIDO2/WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Flutter Documentation](https://flutter.dev/docs)
- [Socket.io Documentation](https://socket.io/docs/v4)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Crafted by Satwik Singh - Passionate about solving real world problems with engineering*

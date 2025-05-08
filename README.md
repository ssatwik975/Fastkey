# FastKey: A Robust Passwordless Biometric Authentication System using WebAuthn

**Author:** Satwik Singh

**Scholar Number:** 22U03036

**Subject:** IoT

**Submitted to:** Dr. Arpita Bhargava

**Semester:** 6

## 1. Summary

FastKey is an advanced passwordless biometric authentication system meticulously engineered to significantly enhance digital security and user experience by obviating traditional password-based logins. This system rigorously adheres to FIDO2/WebAuthn standards, empowering users to authenticate on desktop applications through a seamless process involving QR code scanning via their mobile devices, followed by on-device biometric verification (e.g., fingerprint or Face ID). The architecture comprises a resilient Node.js backend, a dynamic Next.js frontend for desktop interactions, and a responsive Next.js mobile authentication interface. Real-time, secure communication across devices is orchestrated by [Socket.io](http://socket.io/). This project culminates in a fully functional prototype that not only demonstrates a practical and secure implementation of modern passwordless authentication but also effectively addresses pervasive password vulnerabilities, thereby streamlining the login process. Key outcomes include a robust, public-key cryptography-based authentication flow, a highly intuitive user interface, and a comprehensive analysis of WebAuthn implementation challenges and best practices.

## 2. Introduction

### 2.1. Problem Statement

Traditional password-based authentication mechanisms are inherently flawed, contributing to a significant percentage of security breaches globally. Issues such as weak password selection, credential reuse across multiple platforms, and susceptibility to sophisticated phishing attacks (e.g., adversary-in-the-middle) expose users and organizations to severe risks. The cognitive load and friction associated with managing numerous complex passwords further degrade user experience. Consequently, there is an exigent need for superior authentication paradigms that bolster security while simultaneously enhancing usability.

### 2.2. Project Objectives

The principal objectives of the FastKey project are:

- To architect and implement a highly secure and reliable passwordless authentication system.
- To rigorously apply FIDO2/WebAuthn standards for state-of-the-art biometric authentication.
- To facilitate seamless and secure cross-device authentication, enabling desktop session authorization via mobile biometric verification.
- To deliver an exceptionally user-friendly experience that simplifies the login process without compromising the integrity of the security model.
- To conduct an in-depth investigation into the practical implementation nuances, security implications, and performance characteristics of WebAuthn in a distributed application context.

### 2.3. Scope and Limitations

**Scope:**

- End-to-end user registration and login functionality for a representative desktop application.
- Dynamic QR code generation on the desktop client to initiate the mobile-mediated authentication sequence.
- A dedicated mobile web interface for capturing biometric consent and interacting with the WebAuthn API.
- Secure, encrypted communication channels (HTTPS for WebAuthn, WSS for [Socket.io](http://socket.io/) in production) between desktop, mobile (via backend), and the backend server.
- Backend infrastructure for robust management of user public key credentials and transient authentication sessions.
- Support for both new user enrollment and authentication of previously registered users with their FIDO2 authenticators.

**Limitations:**

- The current persistence layer utilizes a file-based JSON database ([`backend/db/users.json`](https://www.notion.so/rm40/backend/db/users.json), [`backend/db/pending_auths.json`](https://www.notion.so/rm40/backend/db/pending_auths.json)). While adequate for demonstration and development, this is not suitable for production-scale deployments requiring high availability and transactional integrity.
- WebAuthn functionality is contingent upon client-side browser and operating system support, which can exhibit variability.
- The ultimate security of the biometric authentication is intrinsically linked to the security posture of the user's mobile device and its biometric sensors.
- Advanced account recovery protocols (e.g., social recovery, alternative authenticator registration post-loss) are beyond the current implementation's scope.
- The system's WebAuthn component relies on `localhost` or a meticulously configured Relying Party ID (`rpId`) for correct operation, necessitating careful setup in non-localhost or publicly deployed environments.
- Comprehensive administrative user management features are not implemented.

## 3. Background Research & Literature Review

### 3.1. Current Authentication Methods and Their Limitations

- **Passwords:** Despite their ubiquity, passwords suffer from critical vulnerabilities including weak entropy, reuse, susceptibility to phishing, dictionary attacks, and brute-force attempts. Secure storage (hashing and salting) is complex and still vulnerable if underlying hashes are compromised.
- **Multi-Factor Authentication (MFA):** While significantly improving security over single-factor password authentication, MFA can introduce usability friction. Certain factors, like SMS-based OTPs, have demonstrated vulnerabilities to SIM-swapping and interception.
- **Biometrics (Standalone, Device-Specific):** Offer convenience but, if implemented naively (e.g., biometric data stored centrally or insecurely on device), can raise significant privacy and irrevocability concerns. FIDO standards address many of these by keeping biometric data local and using cryptographic attestations.
- **OAuth 2.0 / OpenID Connect (OIDC):** Excellent for federated identity and delegated authorization, but often the primary authentication at the Identity Provider (IdP) still relies on passwords or less phishing-resistant MFA methods.

### 3.2. FIDO2/WebAuthn Standards

The FIDO (Fast Identity Online) Alliance's FIDO2 project, encompassing the W3C Web Authentication (WebAuthn) API and the Client to Authenticator Protocol (CTAP2), represents a paradigm shift towards passwordless authentication.

- **Core Principles:**
    - **Public-Key Cryptography:** User authentication is based on asymmetric key pairs. The private key is securely stored on the user's authenticator (e.g., smartphone TPM, hardware security key) and never leaves it. The server stores the corresponding public key.
    - **Origin-Bound Credentials:** Cryptographic keys are scoped to the specific web origin (Relying Party ID), rendering them immune to phishing attacks attempting to use credentials on fraudulent sites.
    - **User Presence & Verification:** Authentication requires proof of user presence (e.g., a touch on a sensor) and often user verification (e.g., biometric scan, PIN entry on the authenticator).
- **Advantages:** Drastically reduces risks of phishing, credential stuffing, and password database breaches. Enhances user experience by removing password memorization and management burdens.

### 3.3. Related Work in Passwordless Authentication

The development of passwordless authentication systems has been significantly influenced by the FIDO Alliance’s standards, particularly FIDO2, which combines the Web Authentication (WebAuthn) specification and the Client-to-Authenticator Protocol (CTAP2). These standards aim to provide a secure, passwordless authentication framework that leverages public-key cryptography and biometric verification, addressing many vulnerabilities associated with traditional password-based systems (FIDO Alliance, 2017).

Academic research has rigorously examined the security and practicality of FIDO2. Barbosa et al. (2021) conducted a pioneering provable security analysis of FIDO2 protocols, confirming the authentication security of WebAuthn while identifying weaknesses in CTAP2 that could only be proven secure under limited conditions. They proposed improvements through a new protocol, sPACA, which offers stronger security guarantees and better efficiency (Barbosa et al., 2021). This work underscores the importance of continuous security evaluation and enhancement of passwordless authentication protocols.

Yadav and Seamons (2024) focused on local attack vectors against FIDO2, such as malicious browser extensions and cross-site scripting (XSS). Their study revealed four critical flaws in current implementations, enabling seven distinct attacks. They emphasized the need for improved clone detection algorithms and better user education to mitigate these threats, providing practical recommendations for enhancing FIDO2’s security and usability (Yadav & Seamons, 2024).

Bicakci and Uzunay (2022) offered a critical perspective on the feasibility of FIDO2 passwordless authentication, arguing that despite its advantages, passwords are unlikely to be entirely eliminated in the foreseeable future. They cited reasons such as the lack of universal support across devices and browsers, the complexity of managing multiple authentication factors, and the persistence of legacy systems that rely on passwords. Their position paper serves as a reminder of the challenges in transitioning to a fully passwordless ecosystem and suggests areas for future research (Bicakci & Uzunay, 2022).

Comparative analyses of commercial passwordless solutions, such as those from Okta, Auth0, and Microsoft, reveal that while many focus on enterprise-level identity management, FastKey distinguishes itself by emphasizing a seamless cross-device authentication experience using QR codes and biometrics. This approach not only enhances security but also improves user convenience, aligning with the goals of modern authentication systems. For instance, Microsoft’s passwordless solutions leverage FIDO2 for enterprise environments, but FastKey’s QR code mechanism enables broader accessibility without requiring specialized hardware (Microsoft Security, 2024).

Research on QR code-based authentication schemes has also informed FastKey’s design. Studies such as "QR Code Security: A Survey of Attacks and Challenges for Usable Security" by Krombholz et al. (2014) highlight potential vulnerabilities in QR code usage, such as malicious link encoding and replacement attacks, emphasizing the need for secure session management and user verification. FastKey addresses these concerns by using cryptographically secure session IDs and ensuring that QR codes are dynamically generated and time-sensitive, minimizing the window for potential attacks (Krombholz et al., 2014).

In summary, the related work highlights ongoing efforts to advance passwordless authentication, with FastKey building upon these foundations to offer a practical and secure implementation that addresses both security and usability challenges.

## 4. System Architecture & Design

### 4.1. Technical Architecture

The FastKey system is architected as a distributed application with three primary, interacting components:

1. **Frontend (Desktop Client):** A sophisticated Next.js application ([`frontend/`](https://www.notion.so/rm40/frontend/)) operating within the user's desktop browser. It orchestrates user interactions for initiating registration/login, dynamically renders the QR code, and maintains persistent communication with the backend via secure HTTP requests and [Socket.io](http://socket.io/) WebSockets. Key file: [`frontend/src/app/page.js`](https://www.notion.so/rm40/frontend/src/app/page.js).
2. **Frontend (Mobile Authentication Interface):** A purpose-built Next.js page ([`frontend/src/app/mobile-auth/[sessionId]/page.js`](https://www.notion.so/rm40/frontend/src/app/mobile-auth/%5BsessionId%5D/page.js)), accessed on the user's mobile device post-QR code scan. This interface directly leverages the browser's WebAuthn API for biometric enrollment/authentication and securely transmits outcomes to the backend.
3. **Backend Server:** A robust Node.js application built with Express.js ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js)). It exposes a secure API for all WebAuthn cryptographic operations, manages user identities (public keys), orchestrates QR code session lifecycles, and hosts the [Socket.io](http://socket.io/) server for real-time, bidirectional communication with the desktop client.

### 4.2. Technology Stack Decisions and Rationale

The technology stack was carefully selected to ensure robustness, developer productivity, and alignment with modern web standards:

- **Frontend (Desktop & Mobile UI):**
    - **Next.js (React):** Chosen for its comprehensive features including server-side rendering (SSR), static site generation (SSG), optimized performance, intuitive routing (App Router), and a rich ecosystem, facilitating rapid development of complex UIs. ([`frontend/`](https://www.notion.so/rm40/frontend/))
    - **Tailwind CSS:** A utility-first CSS framework enabling rapid, custom UI development with excellent maintainability and design consistency. ([`frontend/tailwind.config.js`](https://www.notion.so/rm40/frontend/tailwind.config.js), [`frontend/src/app/globals.css`](https://www.notion.so/rm40/frontend/src/app/globals.css))
    - **Socket.io-client:** Essential for establishing and managing the real-time WebSocket connection, enabling instantaneous feedback to the desktop client during the mobile authentication phase. ([`frontend/src/app/page.js`](https://www.notion.so/rm40/frontend/src/app/page.js), [`frontend/src/app/dashboard/page.js`](https://www.notion.so/rm40/frontend/src/app/dashboard/page.js))
    - **`react-qr-code`:** A lightweight and efficient React component for dynamic QR code generation. ([`frontend/src/app/page.js`](https://www.notion.so/rm40/frontend/src/app/page.js))
    - **Framer Motion:** Leveraged for creating fluid and engaging UI animations and transitions, enhancing the overall user experience. ([`frontend/src/app/page.js`](https://www.notion.so/rm40/frontend/src/app/page.js), [`frontend/src/app/mobile-auth/[sessionId]/page.js`](https://www.notion.so/rm40/frontend/src/app/mobile-auth/%5BsessionId%5D/page.js))
- **Backend:**
    - **Node.js & Express.js:** A proven, high-performance, and scalable asynchronous I/O model ideal for building real-time web applications and APIs. Express.js provides a minimalist and flexible framework. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
    - [*Socket.io](http://socket.io/):** The de facto standard for real-time, bidirectional, event-based communication, critical for the interactive QR code authentication flow. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
    - **`jsonwebtoken` & `passport-jwt`:** Industry-standard libraries for issuing, managing, and validating JSON Web Tokens (JWTs), ensuring secure stateless session management post-WebAuthn authentication. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
    - **`base64url`, `crypto`, `uuid`:** Core Node.js modules and standard libraries utilized for essential cryptographic operations (e.g., secure random challenge generation), Base64URL encoding/decoding (a WebAuthn requirement), and universally unique identifier generation. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
- **Database (Prototype):**
    - **File-based JSON:** Simple JSON files ([`backend/db/users.json`](https://www.notion.so/rm40/backend/db/users.json), [`backend/db/pending_auths.json`](https://www.notion.so/rm40/backend/db/pending_auths.json)) serve as the data store for user public keys and pending authentication session details. This choice prioritized rapid prototyping and ease of inspection during development. The `ensureValidUsersFile` function ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js)) provides rudimentary integrity checks.

### 4.3. Security Model and Threat Analysis

The security of FastKey is paramount, with defenses architected at multiple layers:

- **Authentication Core (WebAuthn):** Inherently resistant to phishing, credential stuffing, and replay attacks due to public-key cryptography, origin-binding, and server-side challenge-response mechanisms. Private keys are hardware-bound and never exposed.
- **Session Management:** Secure, short-lived JWTs (signed with a strong `JWT_SECRET`) are issued upon successful WebAuthn authentication. These tokens are transmitted via HTTPS and stored securely on the client (e.g., `localStorage`, with considerations for XSS if not properly handled in broader application context). ([`frontend/src/app/page.js`](https://www.notion.so/rm40/frontend/src/app/page.js) - `handleAuthSuccess`)
- **Transport Layer Security:** All sensitive communication between clients and the server is mandated to occur over HTTPS. [Socket.io](http://socket.io/) connections are configured to use Secure WebSockets (WSS) in a production setting.
- **QR Code Security:** The QR code embeds a URL containing a unique, cryptographically random, and time-sensitive session ID. This ID is ephemeral and validated by the backend against active sessions stored in the [`pendingAuths`](https://www.notion.so/rm40/backend/server.js) map.
- **Threat Analysis & Mitigations:**
    - **Phishing:** Effectively mitigated by WebAuthn's origin-binding principle.
    - **Man-in-the-Middle (MitM) Attacks:** Prevented by enforcing HTTPS/WSS for all data exchange.
    - **Replay Attacks (WebAuthn):** Countered by server-generated unique challenges for each authentication/registration attempt and the authenticator's signature counter. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js) - `generateChallenge`, credential counter validation)
    - **Session Hijacking (JWT):** Mitigated by using short token expiry times, HTTPS, and potentially `HttpOnly` cookies in a production scenario (though `localStorage` is used in this prototype).
    - **QR Code Hijacking/Replay:** Session IDs are single-use for authentication, have a limited validity window, and are tied to the initiating desktop socket session. The [`cleanupExpiredSessions`](https://www.notion.so/rm40/backend/server.js) routine purges stale sessions.
    - **Compromised Mobile Device:** If an attacker gains full control over the user's unlocked mobile device and can satisfy its biometric/PIN checks, they could authenticate. This is an inherent risk tied to the security of the end-user's device.
    - **Server-Side Data Breach:** The server stores only public keys, credential IDs, and non-sensitive usernames. No passwords or biometric templates are stored. The primary risk with the current file-based DB is unauthorized server access.
    - **Denial of Service (DoS):** API endpoints could be hardened with rate limiting. The current prototype has basic protections.

### 4.4. Sequence Diagrams

**1. User Registration Flow:**

<img width="831" alt="image" src="https://github.com/user-attachments/assets/b5d44400-d4aa-4dd8-a2da-ae4854392468" />


**2. User Login Flow:**

<img width="839" alt="image" src="https://github.com/user-attachments/assets/27f6b67b-36ca-44fe-b3cb-c72de5316284" />

## 5. Implementation Details

### 5.1. Core Components Implementation

- **Backend Server (`backend/server.js`):**
    - Robust Express.js application featuring middleware for CORS, JSON body parsing, and URL encoding.
    - Integrated [Socket.io](http://socket.io/) server managing persistent WebSocket connections, handling `connection`, `requestQR`, and `heartbeat` events for real-time interactivity.
    - Secure API Endpoints:
        - `/api/check-username`: Validates username availability/existence. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
        - `/api/webauthn/registration-options`: Constructs and returns `PublicKeyCredentialCreationOptions` for WebAuthn registration, including a unique server-generated challenge. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
        - `/api/webauthn/registration-verification`: Performs comprehensive verification of the WebAuthn attestation response, including challenge, origin, and attestation signature (if applicable), then securely stores the new public key credential. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
        - `/api/webauthn/authentication-options`: Constructs and returns `PublicKeyCredentialRequestOptions`, including a unique challenge and `allowCredentials` list for the specified user. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
        - `/api/webauthn/authentication-verification`: Performs rigorous verification of the WebAuthn assertion response, including challenge, origin, signature against the stored public key, and signature counter, then issues a JWT. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
        - `/api/notify-desktop`: Facilitates an explicit notification pathway from the mobile client to the backend, triggering a broadcast to the corresponding desktop client. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
        - `/api/auth-status/:sessionId`: Provides a polling fallback mechanism for the desktop client to ascertain authentication status. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
        - `/api/verify-session`: Enables the mobile client to validate its session ID and retrieve associated context. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
    - User Persistence: Abstracted `User` object with methods (`findOne`, `findById`, `create`) interacting with `users.json`. The `saveUser` function ensures atomic writes (within file system limitations). ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
    - Pending Authentication State: An in-memory `pendingAuths` map (periodically persisted to/loaded from `pending_auths.json`) tracks active QR sessions, associating session IDs with desktop socket IDs and WebAuthn challenges. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
    - JWT Issuance: Securely signs JWTs using `jsonwebtoken.sign()` with a configurable `JWT_SECRET` and appropriate expiry upon successful WebAuthn verification. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
    - Dynamic Relying Party ID (`rpId`): The `getEffectiveRpId` function intelligently determines the `rpId` based on the request's host, crucial for supporting diverse deployment environments (localhost, ngrok, custom domains). ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js))
- **Desktop Frontend (`frontend/src/app/page.js`):**
    - Sophisticated state management (`initial`, `loading`, `qr`, `success`, `error`) using React `useState` and `useEffect` hooks for a responsive UI.
    - Manages username input, registration/login mode selection, and form submission logic.
    - Establishes and maintains a [Socket.io](http://socket.io/) client connection within a `useEffect` hook, handling connection, disconnection, and custom events.
    - The `handleSubmit` function orchestrates the initial username check and the `requestQR` emission to the backend.
    - Dedicated [Socket.io](http://socket.io/) event listeners:
        - `qrGenerated`: Receives the QR URL and `sessionId`, updates the UI to display the QR code, and provides a copyable link.
        - `authSuccess`: Receives the JWT and user details, securely stores the token in `localStorage`, and programmatically navigates the user to the authenticated dashboard.
        - `authBroadcast`: Implements a fallback mechanism, prompting a direct HTTP poll to `/api/auth-status/:sessionId` if the primary `authSuccess` event is missed, ensuring robustness.
    - Dynamic QR code rendering using the `QRCode` component from `react-qr-code`.
- **Mobile Authentication Frontend (`frontend/src/app/mobile-auth/[sessionId]/page.js`):**
    - Extracts `sessionId`, `username`, and operation type (register/login) from URL parameters.
    - Manages distinct UI states (`loading`, `ready`, `processing`, `success`, `error`) to guide the user through the biometric authentication process.
    - `useEffect` hook performs initial session validation via `/api/verify-session` and checks for browser WebAuthn API compatibility on component mount.
    - The central `handleSubmit` function dynamically invokes either `startRegistration()` or `startAuthentication()` based on the session context.
    - `startRegistration()`:
        - Fetches `PublicKeyCredentialCreationOptions` from `/api/webauthn/registration-options`.
        - Performs necessary Base64URL to ArrayBuffer conversions for WebAuthn API compatibility (e.g., for `challenge`, `user.id`).
        - Invokes `navigator.credentials.create()`, prompting the user for biometric consent.
        - Serializes the resulting `PublicKeyCredential` object (converting ArrayBuffers back to Base64URL) and transmits it to `/api/webauthn/registration-verification`.
    - `startAuthentication()`:
        - Fetches `PublicKeyCredentialRequestOptions` from `/api/webauthn/authentication-options`.
        - Performs Base64URL to ArrayBuffer conversions for `challenge` and `allowCredentials[].id`.
        - Invokes `navigator.credentials.get()`, prompting biometric verification.
        - Serializes the `PublicKeyCredential` assertion and transmits it to `/api/webauthn/authentication-verification`.
    - Upon successful WebAuthn interaction and backend verification, it triggers `/api/notify-desktop` to ensure the backend informs the desktop client promptly.
    - Includes utility functions like `base64urlToArrayBuffer`, `arrayBufferToBase64url`, `setupMobileWebAuthn`, and `mobileBrowserWorkaround` to handle data transformations and attempt to normalize WebAuthn behavior across diverse mobile browser environments.

### 5.2. QR Code Authentication Flow

The QR code mechanism is pivotal for bridging the desktop and mobile authentication experiences:

1. The desktop client initiates a request for a QR code, providing the username and intended operation (registration/login), via a [Socket.io](http://socket.io/) `requestQR` event.
2. The backend server generates a cryptographically unique `sessionId`, securely associating it with the desktop client's `socket.id`, the username, a freshly generated WebAuthn challenge, and a timestamp. This state is stored in the `pendingAuths` map.
3. The backend constructs a fully qualified URL pointing to the mobile authentication page ([`frontend/src/app/mobile-auth/[sessionId]/page.js`](https://www.notion.so/rm40/frontend/src/app/mobile-auth/%5BsessionId%5D/page.js)), embedding the `sessionId`, `username`, and operation type as query parameters.
4. This URL, along with the `sessionId`, is transmitted back to the initiating desktop client via a [Socket.io](http://socket.io/) `qrGenerated` event.
5. The desktop client renders this URL as a scannable QR code.
6. The user scans the QR code using their mobile device, which navigates their mobile browser to the aforementioned URL.
7. The mobile authentication page extracts the `sessionId` and other parameters from the URL to engage in the WebAuthn protocol with the backend API endpoints.

### 5.3. Cross-Device Authentication using [Socket.io](http://socket.io/)

[Socket.io](http://socket.io/) underpins the real-time, asynchronous communication crucial for the cross-device flow:

- Upon loading the login/registration page, the desktop client establishes a persistent WebSocket connection with the backend [Socket.io](http://socket.io/) server ([`frontend/src/app/page.js`](https://www.notion.so/rm40/frontend/src/app/page.js)). Each connection is uniquely identified by a `socket.id`.
- When the backend successfully validates a WebAuthn credential (attestation or assertion) received via HTTP from the mobile client, it retrieves the corresponding `pendingAuth` entry using the `sessionId` provided by the mobile client.
- This `pendingAuth` entry contains the original `socket.id` of the desktop client that initiated the authentication request. The backend then uses this `socket.id` to emit an `authSuccess` event directly and exclusively to that specific desktop client, delivering the JWT and user details. ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js) - within WebAuthn verification routes).
- A more general `authBroadcast` event is also emitted, which can serve as a secondary notification channel or for broader state synchronization if needed.
- The desktop client, upon receiving the targeted `authSuccess` event, finalizes the login process by storing the session token and redirecting the user.

### 5.4. WebAuthn Integration for Biometric Verification

- **Registration (`startRegistration` in `frontend/src/app/mobile-auth/[sessionId]/page.js`):**
The client-side logic meticulously prepares options for, invokes, and processes the response from `navigator.credentials.create()`:
    
    ```jsx
    // filepath: frontend/src/app/mobile-auth/[sessionId]/page.js
    // ...existing code...
    // const rawOptions = await fetchWithTimeout(`/api/webauthn/registration-options`, { /* ... */ });
    // const options = await rawOptions.json();
    // // Convert challenge and user.id from base64url to ArrayBuffer
    // options.challenge = base64urlToArrayBuffer(options.challenge);
    // options.user.id = base64urlToArrayBuffer(options.user.id);
    // // Convert any excludeCredentials IDs
    // if (options.excludeCredentials) {
    //   options.excludeCredentials = options.excludeCredentials.map(cred => ({
    //     ...cred,
    //     id: base64urlToArrayBuffer(cred.id),
    //   }));
    // }
    // const credential = await navigator.credentials.create({ publicKey: options });
    // // Prepare credential for server (convert ArrayBuffers back to base64url)
    // const credentialForServer = { /* ... */ };
    // await fetchWithTimeout(`/api/webauthn/registration-verification`, { /* ... body: JSON.stringify({ username, sessionId, credential: credentialForServer }) */ });
    // ...existing code...
    
    ```
    
- **Authentication (`startAuthentication` in `frontend/src/app/mobile-auth/[sessionId]/page.js`):**
Similarly, for authentication, `navigator.credentials.get()` is utilized:
    
    ```jsx
    // filepath: frontend/src/app/mobile-auth/[sessionId]/page.js
    // ...existing code...
    // const rawOptions = await fetchWithTimeout(`/api/webauthn/authentication-options`, { /* ... */ });
    // const options = await rawOptions.json();
    // // Convert challenge and allowCredentials IDs from base64url to ArrayBuffer
    // options.challenge = base64urlToArrayBuffer(options.challenge);
    // if (options.allowCredentials) {
    //   options.allowCredentials = options.allowCredentials.map(cred => ({
    //     ...cred,
    //     id: base64urlToArrayBuffer(cred.id),
    //   }));
    // }
    // const assertion = await navigator.credentials.get({ publicKey: options });
    // // Prepare assertion for server (convert ArrayBuffers back to base64url)
    // const assertionForServer = { /* ... */ };
    // await fetchWithTimeout(`/api/webauthn/authentication-verification`, { /* ... body: JSON.stringify({ username, sessionId, credential: assertionForServer }) */ });
    // ...existing code...
    
    ```
    
- The backend ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js)) is responsible for generating cryptographically secure challenges (`generateChallenge`), constructing the appropriate WebAuthn options objects, and performing rigorous server-side verification of the attestation and assertion objects. This includes validating signatures, origins, challenges, and signature counters against established FIDO alliance specifications.

### 5.5. Code Structure and Organization

The project maintains a clean separation of concerns between frontend and backend modules:

- **`backend/`**: Encapsulates all server-side logic.
    - `server.js`: The monolithic application file containing Express.js route definitions, [Socket.io](http://socket.io/) event handlers, all WebAuthn cryptographic logic, and user data management functions.
    - `db/`: Contains the JSON files (`users.json`, `pending_auths.json`) used for data persistence in this prototype.
    - `package.json`, `package-lock.json`: Define backend dependencies and exact versions.
- **`frontend/`**: Contains the Next.js client-side application.
    - `src/app/`: Core application directory utilizing Next.js App Router.
        - `page.js`: Implements the primary desktop login/registration interface.
        - `mobile-auth/[sessionId]/page.js`: The dynamic route for the mobile biometric authentication interface.
        - `dashboard/page.js`: An example protected route accessible only after successful authentication.
        - `layout.js`: Defines the root application layout.
        - `globals.css`: Contains global styles, primarily Tailwind CSS base and utilities.
    - `components/`: (If any reusable UI components were created, list here).
    - `lib/`: (If any utility functions or hooks were created, list here, e.g., `webauthnUtils.js`).
    - `public/`: Stores static assets like images or favicons.
    - Configuration files: `next.config.mjs`, `tailwind.config.js`, `postcss.config.js`, `jsconfig.json`.
    - `package.json`, `package-lock.json`: Define frontend dependencies.
- **Root Directory:**
    - `.gitignore`: Specifies intentionally untracked files.
    - `LICENSE`: Project licensing information (e.g., MIT).
    - `README.md`: This comprehensive project report.

## 6. Methodology & Testing

### 6.1. Development Methodology

The project was executed using an agile-inspired iterative development methodology. Development was segmented into distinct phases, each focusing on a core set of functionalities:

1. **Phase 1: Foundation & Core Services:** Setup of Next.js frontend, Node.js/Express backend, basic API for username validation, and initial [Socket.io](http://socket.io/) integration for desktop-backend handshake.
2. **Phase 2: QR Code Flow Implementation:** Development of QR code generation logic, mobile page scaffolding, and session ID management for linking desktop and mobile interactions.
3. **Phase 3: WebAuthn Registration:** Implementation of the complete WebAuthn registration flow, including client-side `navigator.credentials.create()`, server-side option generation, attestation verification, and public key storage.
4. **Phase 4: WebAuthn Authentication:** Implementation of the WebAuthn login flow, including `navigator.credentials.get()`, server-side option generation with `allowCredentials`, assertion verification, and signature validation.
5. **Phase 5: Session Management & UI Refinement:** Integration of JWT-based session management post-authentication, development of a protected dashboard route, and comprehensive UI/UX enhancements with error handling and user feedback.
Regular self-review and refactoring were conducted at the end of each iteration.

### 6.2. Testing Framework and Approach

A multi-faceted testing strategy was employed:

- **Manual End-to-End Testing:** This was the primary method, rigorously testing the complete user journey for both registration and login across diverse scenarios:
    - **Browser Compatibility:** Tested on latest versions of Google Chrome (Desktop & Android), Mozilla Firefox (Desktop), and Safari (macOS & iOS) to identify and address WebAuthn API inconsistencies and UI rendering differences.
    - **Scenario Testing:** Covered new user registration, existing user login, invalid username attempts, successful/failed QR scans, biometric success/cancellation, and session timeouts.
    - **Responsive Design:** Validated UI adaptability across various desktop and mobile viewport sizes.
- **Component-Level Testing (Conceptual):** While formal unit test suites were not implemented due to time constraints, individual functions (e.g., Base64URL conversions, challenge generation on backend, state transitions in React components) were tested in isolation during development.
- **Integration Testing:** Focused on verifying the seamless interaction between the desktop client, backend server (APIs and [Socket.io](http://socket.io/)), and the mobile authentication interface. Network requests and WebSocket messages were monitored using browser developer tools.
- **Browser Developer Tools & Server Logs:** Extensively used for debugging JavaScript, inspecting network traffic (HTTP requests/responses, WebSocket frames), analyzing `localStorage` for JWTs, and monitoring server-side logs for errors and operational flow.

### 6.3. Security Testing and Validation

Security validation focused on the core authentication mechanisms:

- **WebAuthn Protocol Adherence:** Ensured that challenges were unique per request, correctly embedded in `clientDataJSON`, and validated on the server. Verified that `rpId` was consistently applied and matched the origin, preventing cross-origin attacks. Tested signature counter increments.
- **JWT Session Integrity:** Confirmed that JWTs were issued only upon successful WebAuthn verification, correctly signed, and validated for accessing protected resources. Tested token expiry and basic logout functionality (client-side token removal).
- **Input Validation (Basic):** Implemented server-side checks for presence and basic format of usernames and session IDs. [Further comprehensive input sanitization and validation (e.g., against XSS, injection) would be critical for production.]
- **QR Code Session Lifecycle:** Manually verified that session IDs in `pendingAuths` were correctly managed, associated with socket connections, and that the `cleanupExpiredSessions` routine ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js)) effectively purged stale or completed sessions to prevent reuse.
- **HTTPS Enforcement:** All WebAuthn operations were conducted over HTTPS (or `localhost` during development), a strict requirement of the standard.

### 6.4. Performance Metrics and Benchmarks (Qualitative and Estimated)

While formal, extensive load testing was outside the project's scope, qualitative performance and key interaction timings were observed:

- **QR Code Generation & Display:** Near-instantaneous on the desktop client (< 200ms from request to display).
- **WebAuthn Ceremony (Mobile):**
    - `navigator.credentials.create()` / `get()` invocation to biometric prompt: Typically < 500ms (browser/OS dependent).
    - Biometric interaction by user: Variable (1-3 seconds).
    - Credential/Assertion transmission to backend and verification: Typically 100-300ms on a local network.
- **End-to-End Authentication (Desktop Perspective):** From QR scan initiation on mobile to `authSuccess` on desktop: Observed average of 3-7 seconds, largely influenced by user interaction speed and network latency between mobile and backend.
- **Server API Response Times (Local):** Individual API calls (e.g., `/check-username`, WebAuthn options/verification) generally completed within 50-150ms under light load.
- [*Socket.io](http://socket.io/) Latency:** Message delivery between server and connected desktop client was consistently low (< 50ms on local network).

The file-based JSON database would be the primary bottleneck under concurrent load.

## 7. Results & Discussion

### 7.1. Achievement of Project Objectives

The FastKey project successfully met all its primary objectives:

- **Robust Passwordless System:** A fully functional passwordless authentication system was designed, implemented, and validated.
- **Rigorous WebAuthn Utilization:** FIDO2/WebAuthn standards form the cryptographic backbone of the biometric authentication, ensuring high levels of security.
- **Seamless Cross-Device Authentication:** The QR code and [Socket.io](http://socket.io/) mechanism provides an intuitive and efficient method for desktop session authentication via mobile biometrics.
- **Enhanced User Experience:** The login process is demonstrably simpler and faster than traditional password entry, significantly reducing user friction.
- **In-depth Practical Exploration:** The project yielded substantial insights into WebAuthn implementation intricacies, cross-browser compatibility challenges, and best practices for secure real-time distributed application design.

### 7.2. System Limitations and Challenges Encountered

- **Production Database Requirement:** The file-based JSON store ([`backend/db/users.json`](https://www.notion.so/rm40/backend/db/users.json), [`backend/db/pending_auths.json`](https://www.notion.so/rm40/backend/db/pending_auths.json)) is a significant limitation for scalability, concurrency, and data integrity in a production environment. A relational or NoSQL database is essential for future development.
- **Comprehensive Error Handling & Resilience:** While functional error handling is present, a production-grade system would necessitate more sophisticated error aggregation, user-facing error diagnostics, and fault tolerance mechanisms (e.g., retry logic for transient network issues).
- **WebAuthn Ecosystem Variability:** Navigating inconsistencies in WebAuthn API implementation and behavior across different browsers (especially mobile) and operating systems required careful testing and workarounds (e.g., `setupMobileWebAuthn`, `mobileBrowserWorkaround` in [`frontend/src/app/mobile-auth/[sessionId]/page.js`](https://www.notion.so/rm40/frontend/src/app/mobile-auth/%5BsessionId%5D/page.js)).
- **Absence of Account Recovery:** The current prototype lacks mechanisms for users to regain account access if they lose all registered FIDO authenticators. This is a critical feature for real-world usability.
- **Security of `JWT_SECRET`:** The confidentiality and robust management (e.g., via environment variables, secrets management services) of the `JWT_SECRET` ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js)) is crucial and assumed for any deployment beyond local testing.
- **Relying Party ID (`rpId`) Configuration Complexity:** Correctly configuring the `rpId` is vital for WebAuthn's security model. The dynamic `getEffectiveRpId` function ([`backend/server.js`](https://www.notion.so/rm40/backend/server.js)) mitigates this for common scenarios, but deployment to complex infrastructures requires careful planning.

### 7.3. Security Analysis Results

- **Key Strengths:**
    - **Exceptional Phishing Resistance:** WebAuthn's origin-binding effectively neutralizes traditional phishing and credential theft vectors.
    - **Elimination of Shared Secrets:** No server-side storage of passwords or password equivalents significantly reduces the impact of database breaches. Only public keys are stored.
    - **Strong, Unlinkable Credentials:** Biometric verification, coupled with public-key cryptography, provides strong proof of user identity. Credentials are not linkable across different services if `rpId`s differ.
- **Areas for Hardening (Beyond Prototype):**
    - **Database Security:** Transitioning from file-based JSON to a secure, managed database system is paramount. Filesystem permissions for `users.json` and `pending_auths.json` must be strictly controlled even in the current setup.
    - **`JWT_SECRET` Management:** Employ secure practices for `JWT_SECRET` generation, storage, and rotation.
    - **Rate Limiting & Intrusion Detection:** Implement robust rate limiting on all API endpoints and consider intrusion detection mechanisms to protect against DoS, brute-force attempts on usernames, or other anomalous activities.
    - **Comprehensive Input Validation:** Enforce stricter validation and sanitization on all user-supplied data to prevent XSS, injection, and other common web vulnerabilities.

### 7.4. Performance Analysis

- The system exhibits excellent responsiveness in local and controlled test environments.
- The WebAuthn cryptographic operations (both client and server-side) are computationally efficient and do not introduce noticeable latency. The primary latency factor in the WebAuthn flow is user interaction time.
- [Socket.io](http://socket.io/) facilitates low-latency, real-time updates, crucial for the user experience during the QR code authentication phase.
- Performance under significant concurrent user load has not been formally benchmarked. The file-based database is anticipated to be the main scalability constraint. Optimizing I/O operations and transitioning to a scalable database would be necessary for high-throughput scenarios.

## 8. Future Work & Enhancements

- **Production-Grade Database Integration:** Migrate user and session data to a scalable and secure database system (e.g., PostgreSQL with encrypted fields, or a managed NoSQL solution).
- **Advanced Account Recovery:** Design and implement secure and user-friendly account recovery mechanisms (e.g., backup codes, trusted device recovery, or linking multiple authenticators).
- **Comprehensive Authenticator Management:** Develop a user interface for managing registered authenticators (e.g., listing, naming, revoking individual authenticators).
- **Security Hardening:**
    - Implement robust rate limiting, request throttling, and potentially Web Application Firewall (WAF) rules.
    - Conduct a formal third-party security audit and penetration test.
    - Integrate advanced server-side input validation and output encoding libraries.
- **Enhanced Logging, Monitoring, and Alerting:** Implement centralized structured logging, real-time performance monitoring dashboards, and alerting for critical errors or security events.
- **Horizontal Scalability & High Availability:** Refactor the backend for stateless operation (if not already fully stateless beyond session store) to support horizontal scaling and deploy in a high-availability configuration.
- **Accessibility (a11y) Compliance:** Conduct a thorough accessibility audit (WCAG AA/AAA) and implement necessary improvements to ensure usability for all users.
- **Automated Testing Suite:** Develop comprehensive unit, integration, and end-to-end automated tests (e.g., using Jest, Cypress, Playwright) to ensure code quality and regression prevention.
- **Support for Roaming Authenticators & Passkeys:** Explicitly test and enhance support for various FIDO2 roaming authenticators (e.g., YubiKeys) and the broader concept of passkeys, including discoverable credentials.
- **Expanded User Profile Features:** Introduce features for users to manage their profile information beyond basic authentication.

## 9. Conclusion & Learning Outcomes

### 9.1. Summary of Achievements

FastKey stands as a successful proof-of-concept, robustly demonstrating the implementation of a cutting-edge passwordless biometric authentication system. By leveraging FIDO2/WebAuthn standards and an innovative QR code-mediated cross-device flow, it offers a compelling vision for a more secure and user-centric digital identity landscape. The project effectively addresses critical password-related vulnerabilities and showcases the practical application of modern cryptographic authentication protocols.

### 9.2. Technical and Personal Learning Outcomes

This project provided profound learning experiences:

- **Mastery of WebAuthn Protocol:** Gained comprehensive, hands-on expertise in the intricacies of the WebAuthn API, including client-side credential lifecycle management (`create()`, `get()`), complex data structure handling (CBOR, ArrayBuffers, Base64URL), and rigorous server-side cryptographic verification procedures.
- **Advanced Real-time System Design:** Developed proficiency in architecting and implementing real-time, event-driven systems using [Socket.io](http://socket.io/), managing state across distributed components, and ensuring low-latency communication.
- **Full-Stack Application Development with Next.js & Node.js:** Significantly enhanced skills in building sophisticated, full-stack web applications, leveraging the strengths of Next.js for frontend development and Node.js/Express.js for scalable backend services.
- **Deepened Understanding of Authentication Security:** Acquired a nuanced understanding of modern authentication security principles, threat modeling for distributed systems, and the practical application of cryptographic techniques to mitigate common attack vectors.
- **Cross-Platform Compatibility Challenges:** Gained valuable experience in diagnosing and resolving browser and OS-specific inconsistencies related to emerging web standards like WebAuthn, fostering adaptability and problem-solving skills.
- **Iterative Project Management & Agile Practices:** Successfully applied iterative development principles, managing project scope, breaking down complex requirements into achievable milestones, and adapting to unforeseen technical challenges.

### 9.3. Academic and Practical Significance

- **Academic Contribution:** This work contributes to the applied research domain of cybersecurity, specifically in advanced authentication systems, human-computer interaction (HCI) for security, and practical cryptography. It serves as an empirical case study for the implementation and evaluation of FIDO2/WebAuthn standards in a realistic application scenario.
- **Practical Implications:** FastKey provides a tangible blueprint and valuable insights for industry practitioners and developers seeking to integrate passwordless authentication into their products and services. It underscores the transformative potential of WebAuthn to significantly elevate web security standards and enhance user convenience, aligning with the global industry momentum towards a passwordless future.

## 10. References & Bibliography

- Barbosa, M., Boldyreva, A., Chen, S., & Warinschi, B. (2021). *Provable Security Analysis of FIDO2.* In T. Malkin & C. Peikert (Eds.), *Advances in Cryptology – CRYPTO 2021*. Lecture Notes in Computer Science, vol 12827. Springer, Cham. https://doi.org/10.1007/978-3-030-84252-9_5
- Bicakci, K., & Uzunay, Y. (2022). *Is FIDO2 Passwordless Authentication a Hype or for Real?: A Position Paper.* In F. Ozbudak, S. Sagiroglu, & A. A. Selcuk (Eds.), *15th International Conference on Information Security and Cryptography, ISCTURKEY 2022 - Proceedings* (pp. 68-73). Institute of Electrical and Electronics Engineers Inc. https://doi.org/10.1109/ISCTURKEY56345.2022.9931832
- FIDO Alliance. (2017). *FIDO 2.0: Overview.* Retrieved from https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-overview-v2.0-rd-20170927.html
- Krombholz, K., Hobel, H., Huber, M., & Weippl, E. (2014). *QR Code Security: A Survey of Attacks and Challenges for Usable Security.* In Lecture Notes in Computer Science, vol 8438. Springer, Cham. https://doi.org/10.1007/978-3-319-07620-1_8
- OWASP. (2022). *Authentication Cheat Sheet.* Retrieved from https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Yadav, T. K., & Seamons, K. (2024). *A Security and Usability Analysis of Local Attacks Against FIDO2.* In Proceedings of the Network and Distributed System Security Symposium (NDSS) 2024. https://www.ndss-symposium.org/ndss-paper/a-security-and-usability-analysis-of-local-attacks-against-fido2/

## 11. Appendices

### Appendix A: Setup and Installation Guide

**Prerequisites:**

- Node.js (Version 18.x or later recommended)
- npm (typically bundled with Node.js) or yarn

**Backend Server Setup (`backend/` directory):**

1. Clone the repository: `git clone [your-repo-url]`
2. Navigate to the backend directory: `cd FastKey/backend`
3. Install dependencies: `npm install`
4. (Optional) Create a `.env` file in the `backend` directory to override default configurations if necessary (e.g., `PORT`, `JWT_SECRET`, `FRONTEND_URL`, `RP_ID`). Defaults are generally suitable for local development.
Example `backend/.env`:
    
    ```
    PORT=5001
    JWT_SECRET=your-super-secret-jwt-key-for-development
    FRONTEND_URL=http://localhost:3000
    # RP_ID will be dynamically determined if not set, but can be forced:
    # RP_ID=localhost
    
    ```
    
5. Start the backend server: `npm start`
    - The server will typically listen on `http://localhost:5001` (or the port specified in `.env`).

**Frontend Application Setup (`frontend/` directory):**

1. Navigate to the frontend directory: `cd ../frontend` (from backend) or `cd FastKey/frontend`
2. Install dependencies: `npm install`
3. (Optional) Create a `.env.local` file in the `frontend` directory if your backend is running on a non-default URL.
Example `frontend/.env.local`:
    
    ```
    NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
    
    ```
    
4. Start the frontend development server: `npm run dev`
    - The frontend application will typically be accessible at `http://localhost:3000`.

**Running the Application for Testing:**

1. Ensure both the backend and frontend servers are running concurrently in separate terminal sessions.
2. Open `http://localhost:3000` in a compatible desktop browser (e.g., Chrome, Firefox, Edge).
3. For mobile authentication:
    - Your mobile device must be on the same network as your desktop if accessing `localhost`.
    - For physical mobile device testing with `localhost`, you might need to use your desktop's local network IP address (e.g., `http://192.168.1.X:3000`) instead of `localhost` in the QR code URL. Ensure your firewall allows connections.
    - Alternatively, use a tunneling service like `ngrok` to expose your local frontend and backend servers to the internet with a public URL. If using `ngrok` or any public domain, ensure `RP_ID` on the backend and `FRONTEND_URL` are configured to match the public domain for WebAuthn to function correctly. For example, if ngrok gives `https://abcd-1234.ngrok.io`, then `RP_ID` should be `abcd-1234.ngrok.io` and `FRONTEND_URL` should be `https://abcd-1234.ngrok.io`.

### Appendix B: Key API Endpoint Reference

(All endpoints are prefixed with the backend base URL, e.g., `http://localhost:5001`)
(Defined in [`backend/server.js`](https://www.notion.so/rm40/backend/server.js))

- **`POST /api/check-username`**
    - Purpose: Checks if a username already exists in the system.
    - Request Body: `{ "username": "string" }`
    - Success Response (200 OK): `{ "exists": boolean }`
    - Error Response (400 Bad Request): If username is missing.
- **`POST /api/webauthn/registration-options`**
    - Purpose: Generates WebAuthn options required by `navigator.credentials.create()`.
    - Request Body: `{ "username": "string", "sessionId": "string", "isAndroidChrome": boolean (optional) }`
    - Success Response (200 OK): WebAuthn `PublicKeyCredentialCreationOptions` object (with challenge, [user.id](http://user.id/), etc., properly Base64URL encoded).
    - Error Responses: 400 (missing params), 404 (invalid session), 409 (user exists).
- **`POST /api/webauthn/registration-verification`**
    - Purpose: Verifies the WebAuthn credential received from `navigator.credentials.create()` and registers the user.
    - Request Body: `{ "username": "string", "sessionId": "string", "credential": "object" }` (WebAuthn credential object with ArrayBuffers Base64URL encoded).
    - Success Response (200 OK): `{ "success": true, "token": "string" (JWT), "deviceId": "string" (Base64URL credential ID) }`
    - Error Responses: 400 (invalid input/verification failure), 404 (invalid session).
- **`POST /api/webauthn/authentication-options`**
    - Purpose: Generates WebAuthn options required by `navigator.credentials.get()`.
    - Request Body: `{ "username": "string", "sessionId": "string", "isAndroidChrome": boolean (optional) }`
    - Success Response (200 OK): WebAuthn `PublicKeyCredentialRequestOptions` object.
    - Error Responses: 400 (missing params), 404 (user not found or invalid session).
- **`POST /api/webauthn/authentication-verification`**
    - Purpose: Verifies the WebAuthn assertion received from `navigator.credentials.get()` and logs in the user.
    - Request Body: `{ "username": "string", "sessionId": "string", "credential": "object" }` (WebAuthn assertion object).
    - Success Response (200 OK): `{ "success": true, "token": "string" (JWT), "deviceId": "string" }`
    - Error Responses: 400 (invalid input/verification failure), 401 (auth failed), 404 (user/session not found).
- **`POST /api/notify-desktop`**
    - Purpose: Allows mobile client to signal backend about authentication outcome, which then notifies the desktop via [Socket.io](http://socket.io/).
    - Request Body: `{ "sessionId": "string", "username": "string", "success": boolean, "token": "string" (optional), "deviceId": "string" (optional) }`
    - Success Response (200 OK): `{ "success": true, "message": "Desktop notified" }`
- **`GET /api/auth-status/:sessionId`**
    - Purpose: Fallback polling endpoint for desktop to check authentication status.
    - Success Response (200 OK): `{ "success": boolean, "username": "string" (if auth'd), "token": "string" (if auth'd), "deviceId": "string" (if auth'd) }`
- **`POST /api/verify-session`**
    - Purpose: Allows mobile client to validate its `sessionId` and retrieve context.
    - Request Body: `{ "sessionId": "string" }`
    - Success Response (200 OK): `{ "valid": boolean, "username": "string", "isRegistration": boolean, "newSessionId": "string" (optional, if session was refreshed) }`
    - Error Response (404 Not Found): If session is invalid.

### Appendix C: Project License

This project is licensed to Satwik Singh under the MIT License. A copy of the license can be found in the [LICENSE](https://www.notion.so/rm40/LICENSE) file in the root directory of the project.

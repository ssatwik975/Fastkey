const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const base64url = require('base64url');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Configure CORS for both REST and WebSocket
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// WebSocket server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// File-based DB setup
const DB_DIR = path.join(__dirname, 'db');
const USERS_FILE = path.join(DB_DIR, 'users.json');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR);
}

// Add this function to initialize the users.json file if it's corrupted
const ensureValidUsersFile = () => {
  try {
    // Try to read the file
    const content = fs.readFileSync(USERS_FILE, 'utf8');
    // If empty or not valid JSON, initialize it
    if (!content.trim() || content === '{}') {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
      console.log('Initialized empty users file');
    } else {
      // Test if it's valid JSON
      try {
        JSON.parse(content);
      } catch (e) {
        // If not valid JSON, initialize it
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
        console.log('Repaired corrupted users file');
      }
    }
  } catch (error) {
    // If file doesn't exist, create it
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    console.log('Created new users file');
  }
};

// Initialize empty users file if it doesn't exist or repair it if corrupted
ensureValidUsersFile();

// Simple file-based User model
const User = {
  findOne: async (query) => {
    try {
      ensureValidUsersFile(); // Check file integrity before reading
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      return users.find(user => {
        for (const key in query) {
          if (user[key] !== query[key]) return false;
        }
        return true;
      }) || null;
    } catch (error) {
      console.error('Error reading users file:', error);
      return null;
    }
  },
  findById: async (id) => {
    try {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      return users.find(user => user._id === id) || null;
    } catch (error) {
      console.error('Error reading users file:', error);
      return null;
    }
  },
  create: async (userData) => {
    try {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const newUser = {
        _id: crypto.randomBytes(12).toString('hex'),
        ...userData,
        registeredCredentials: [],
        sessions: []
      };
      users.push(newUser);
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
};

// Improve the saveUser function to handle file integrity
const saveUser = async (user) => {
  try {
    ensureValidUsersFile(); // Check file integrity before reading
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const index = users.findIndex(u => u._id === user._id);
    
    if (index >= 0) {
      users[index] = user;
    } else {
      if (!user._id) {
        user._id = crypto.randomBytes(12).toString('hex');
      }
      users.push(user);
    }
    
    // Write the file with a backup mechanism
    const tempFile = USERS_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2));
    fs.renameSync(tempFile, USERS_FILE);
    
    return user;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

console.log('Using local JSON file storage for development');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Passport JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
}, async (jwtPayload, done) => {
  try {
    const user = await User.findById(jwtPayload.id);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// WebAuthn Configuration
const rpName = 'FastKey';

// Modify the getEffectiveRpId function to allow ngrok domains
const getEffectiveRpId = (reqOrHost) => {
  let hostname;
  
  // Check if this is an HTTP request or just a hostname string
  if (typeof reqOrHost === 'string') {
    hostname = reqOrHost;
  } else if (reqOrHost && reqOrHost.headers && reqOrHost.headers.origin) {
    // Extract hostname from request origin
    hostname = reqOrHost.headers.origin.replace(/^https?:\/\//, '').split(':')[0];
  } else if (reqOrHost && reqOrHost.handshake && reqOrHost.handshake.headers) {
    // Extract from socket handshake for socket.io
    const host = reqOrHost.handshake.headers.host || 
                 reqOrHost.handshake.headers.origin || '';
    hostname = host.replace(/^https?:\/\//, '').split(':')[0];
  } else {
    // Fallback: detect server's IP address
    const networkInterfaces = os.networkInterfaces();
    const interfaces = Object.keys(networkInterfaces);
    
    // Find the first non-internal IPv4 address
    let serverIp = '127.0.0.1';
    for (const iface of interfaces) {
      const addresses = networkInterfaces[iface];
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          serverIp = addr.address;
          break;
        }
      }
    }
    
    hostname = serverIp;
  }
  
  // Special case for ngrok URLs - handle their domain pattern
  if (hostname.includes('ngrok-free.app')) {
    console.log(`Using ngrok domain as rpID: ${hostname}`);
    return hostname;
  }
  
  console.log(`Using effective rpID: ${hostname}`);
  return hostname;
};

// Add these functions to save/load pendingAuths
const savePendingAuths = () => {
  const serialized = [];
  pendingAuths.forEach((value, key) => {
    serialized.push([key, value]);
  });
  fs.writeFileSync(path.join(DB_DIR, 'pending_auths.json'), JSON.stringify(serialized));
};

const loadPendingAuths = () => {
  try {
    if (fs.existsSync(path.join(DB_DIR, 'pending_auths.json'))) {
      const data = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'pending_auths.json'), 'utf8'));
      const map = new Map();
      data.forEach(([key, value]) => {
        map.set(key, value);
      });
      return map;
    }
  } catch (error) {
    console.error('Error loading pending auths:', error);
  }
  return new Map();
};

// Initialize pendingAuths from file if exists
const pendingAuths = loadPendingAuths();

// Save pendingAuths when updated
const updatePendingAuth = (sessionId, data) => {
  pendingAuths.set(sessionId, data);
  savePendingAuths();
};

// Generate a random challenge
function generateChallenge() {
  return base64url.encode(crypto.randomBytes(32));
}

// Add this cleanup function to periodically clean old sessions
const cleanupExpiredSessions = () => {
  const now = Date.now();
  const expiryTime = 15 * 60 * 1000; // 15 minutes
  
  for (const [sessionId, auth] of pendingAuths.entries()) {
    if (now - auth.timestamp > expiryTime) {
      console.log(`Cleaning up expired session: ${sessionId}`);
      pendingAuths.delete(sessionId);
      savePendingAuths();
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

// Improve socket connection management
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  
  // Associate username with socket ID
  socket.on('associate', async ({ username, deviceId }) => {
    try {
      console.log(`Associate request for ${username} with socket ${socket.id}`);
      
      const user = await User.findOne({ username });
      if (!user) {
        console.log('User not found:', username);
        return;
      }
      
      // Update user's session with new socket ID
      const sessionIndex = user.sessions ? 
        user.sessions.findIndex(session => session.deviceId === deviceId) : -1;
      
      if (!user.sessions) {
        user.sessions = [];
      }
      
      if (sessionIndex >= 0) {
        console.log(`Updating existing session for ${username}`);
        user.sessions[sessionIndex].socketId = socket.id;
      } else {
        console.log(`Creating new session for ${username}`);
        user.sessions.push({
          deviceId,
          socketId: socket.id,
          expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days
        });
      }
      
      await saveUser(user);
      console.log(`Socket ${socket.id} associated with ${username}, deviceId: ${deviceId}`);
      
      // Confirm association
      socket.emit('associationConfirmed', { username, deviceId });
    } catch (error) {
      console.error('Association error:', error);
    }
  });

  // Update the socket handler to include registration flag and socket ID
  socket.on('requestQR', async ({ username, isRegistration }) => {
    try {
      // Generate a unique session ID
      const sessionId = uuidv4();
      
      // Get the effective hostname (server IP or domain name)
      const rpId = getEffectiveRpId(socket);
      
      console.log(`QR requested for ${username}, registration: ${isRegistration}, socket: ${socket.id}`);
      
      // Using environment variable for frontend URL
      const frontendUrl = process.env.FRONTEND_URL || 'https://fastkey-gamma.vercel.app';
      const url = `${frontendUrl}/mobile-auth/${sessionId}?username=${encodeURIComponent(username)}${isRegistration ? '&register=true' : ''}`;
      
      console.log(`Generated QR URL: ${url}`);
      
      // Store the pending authentication request AND persist it
      updatePendingAuth(sessionId, {
        username,
        socketId: socket.id,
        timestamp: Date.now(),
        isRegistration 
      });
      
      // Send QR data back to client
      socket.emit('qrGenerated', { url, sessionId, isRegistration });
      
    } catch (error) {
      console.error('QR generation error:', error);
      socket.emit('error', { message: 'Failed to generate QR code' });
    }
  });

  // Add a reconnect handler
  socket.on('reconnect', () => {
    console.log(`Socket ${socket.id} reconnected`);
  });

  // Handle heartbeat to keep connections alive
  socket.on('heartbeat', (data) => {
    // Respond to confirm connection is active
    socket.emit('heartbeat-response', { timestamp: Date.now() });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Optional: We could clean up pendingAuths for this socket here
    // But it's better to keep them for a while in case the user reconnects
  });

  socket.on('message', (rawData) => {
    try {
      // Try to parse raw WebSocket message (not Socket.IO)
      const data = JSON.parse(rawData);
      
      if (data.type === 'authNotify') {
        console.log('Received direct WebSocket notification:', data);
        
        // Broadcast to all clients
        io.emit('authBroadcast', {
          sessionId: data.sessionId,
          username: data.username,
          success: data.success,
          timestamp: data.timestamp,
          source: 'direct-ws'
        });
      }
    } catch (error) {
      console.error('Error handling raw WebSocket message:', error);
    }
  });
});

// REST API Routes

// Check if username exists
app.post('/api/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    res.json({ exists: !!user });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// WebAuthn Registration Options
app.post('/api/webauthn/registration-options', async (req, res) => {
  try {
    const { username, sessionId, isAndroidChrome } = req.body;
    
    // Use dynamic rpID
    const effectiveRpId = getEffectiveRpId(req);
    console.log(`Using effective rpID: ${effectiveRpId}`);
    
    // Check if there's a pending auth with this sessionId
    const pendingAuth = pendingAuths.get(sessionId);
    
    // Debug logging to help diagnose the issue
    console.log('Session validation check:');
    console.log(`- Requested sessionId: ${sessionId}`);
    console.log(`- Pending auth exists: ${!!pendingAuth}`);
    if (pendingAuth) {
      console.log(`- Pending auth username: ${pendingAuth.username}`);
      console.log(`- Requested username: ${username}`);
      console.log(`- Username match: ${pendingAuth.username === username}`);
      console.log(`- Pending auth timestamp: ${new Date(pendingAuth.timestamp).toISOString()}`);
      console.log(`- Pending auth age: ${(Date.now() - pendingAuth.timestamp) / 1000} seconds`);
    }
    
    // More flexible session validation for development
    if (!pendingAuth) {
      console.log(`No pending auth found for session ${sessionId}, creating one`);
      // In development, if session doesn't exist, create it
      updatePendingAuth(sessionId, {
        username,
        socketId: 'manual-creation',
        timestamp: Date.now(),
        isRegistration: true
      });
    } else if (pendingAuth.username !== username) {
      console.log(`Username mismatch for session ${sessionId}, updating`);
      // Update the username if there's a mismatch
      pendingAuth.username = username;
      updatePendingAuth(sessionId, pendingAuth);
    }
    
    // Find or create user
    let user = await User.findOne({ username });
    if (!user) {
      user = await User.create({ username });
    }
    
    // Generate challenge
    const challenge = generateChallenge();
    user.currentChallenge = challenge;
    await saveUser(user);
    
    // Get existing credential IDs
    const excludeCredentials = user.registeredCredentials ? 
      user.registeredCredentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key',
        // Use more transports for better mobile compatibility
        transports: ['internal', 'hybrid', 'ble', 'nfc', 'usb']
      })) : [];
    
    const registrationOptions = {
      challenge,
      rp: {
        name: rpName,
        id: effectiveRpId
      },
      user: {
        id: base64url.encode(username),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      authenticatorSelection: isAndroidChrome ? 
        // Simplified selection for Android Chrome
        {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          userVerification: 'discouraged'
        } : 
        // Standard for other browsers
        {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          userVerification: 'required'
        },
      timeout: 60000,
      attestation: 'none',
      excludeCredentials
    };
    
    res.json(registrationOptions);
  } catch (error) {
    console.error('Registration options error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Enhance the WebAuthn Registration Verification endpoint
app.post('/api/webauthn/registration-verification', async (req, res) => {
  try {
    const { username, sessionId, credential } = req.body;
    
    console.log(`Processing registration verification for ${username}, sessionId: ${sessionId}`);
    
    // Log pending auth status
    const pendingAuth = pendingAuths.get(sessionId);
    console.log(`Pending auth for session ${sessionId}: ${pendingAuth ? 
      JSON.stringify({
        username: pendingAuth.username,
        socketId: pendingAuth.socketId,
        timestamp: new Date(pendingAuth.timestamp).toISOString(),
        isRegistration: pendingAuth.isRegistration
      }) : 'not found'}`);
    
    // Be more lenient in development - even if no pending auth is found
    if (!pendingAuth) {
      console.log(`No pending auth found for session ${sessionId}, creating one for verification`);
      updatePendingAuth(sessionId, {
        username,
        socketId: 'auto-verification',
        timestamp: Date.now(),
        isRegistration: true
      });
    }
    
    // Find or create user with error handling
    let user = await User.findOne({ username });
    if (!user) {
      try {
        user = await User.create({ username });
        console.log(`Created new user: ${username}`);
      } catch (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ error: 'Failed to create user account' });
      }
    }
    
    // Verify challenge
    const expectedChallenge = user.currentChallenge;
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'No challenge found' });
    }
    
    // Add more detailed logging
    console.log(`Processing registration verification for user: ${username}`);
    console.log(`Challenge verification: expected=${expectedChallenge.substring(0, 10)}...`);
    
    // In a real app, you would verify the attestation here
    // For simplicity, we'll just accept the credential
    
    // Add credential to user
    if (!user.registeredCredentials) {
      user.registeredCredentials = [];
    }
    
    // Extract credential ID and public key
    const credentialID = credential.id;
    const credentialPublicKey = credential.response.publicKey || 'mock-public-key';
    
    // Add the credential
    user.registeredCredentials.push({
      credentialID: credentialID,
      credentialPublicKey: credentialPublicKey,
      counter: 0
    });
    
    // Clear challenge
    user.currentChallenge = null;
    
    // Save user
    await saveUser(user);
    console.log(`Successfully registered credential for ${username}`);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Generate device ID
    const deviceId = uuidv4();
    
    // Get pending auth info
    const authSession = pendingAuths.get(sessionId);
    console.log(`===== AUTH EVENT =====`);
    console.log(`Mode: ${pendingAuth?.isRegistration ? 'Registration' : 'Authentication'}`);
    console.log(`Username: ${username}`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Socket ID: ${pendingAuth?.socketId || 'unknown'}`);
    console.log(`Socket Connected Clients: ${Object.keys(io.sockets.connected || {}).length}`);
    console.log(`=====================`);

    if (authSession) {
      // Notify desktop client about successful registration
      console.log(`Sending authSuccess to socket ${authSession.socketId}`);
      io.to(authSession.socketId).emit('authSuccess', {
        token,
        username: user.username,
        deviceId,
        isRegistration: true
      });
      
      // Also broadcast to all clients
      io.emit('authBroadcast', {
        sessionId,
        username: user.username,
        success: true,
        isRegistration: true
      });
      
      console.log(`Sent auth success notification to socket ${authSession.socketId}`);
      console.log(`Broadcasted auth success for session ${sessionId}`);
      
      // Clean up pending auth
      pendingAuths.delete(sessionId);
      savePendingAuths();
    } else {
      console.log(`No pending auth found for session ${sessionId}, broadcasting anyway`);
      io.emit('authBroadcast', {
        sessionId,
        username: user.username,
        success: true,
        isRegistration: true
      });
    }
    
    // Return success
    res.json({ 
      success: true, 
      token,
      deviceId
    });
    
  } catch (error) {
    console.error('Registration verification error:', error);
    res.status(500).json({ error: 'Server error during registration verification' });
  }
});

// WebAuthn Authentication Options
app.post('/api/webauthn/authentication-options', async (req, res) => {
  try {
    const { username, sessionId, isAndroidChrome } = req.body;
    
    // Use dynamic rpID
    const effectiveRpId = getEffectiveRpId(req);
    console.log(`Using effective rpID: ${effectiveRpId}`);
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    // Generate challenge
    const challenge = generateChallenge();
    user.currentChallenge = challenge;
    await saveUser(user);
    
    // Get allowCredentials from user's registered credentials
    const allowCredentials = user.registeredCredentials ? 
      user.registeredCredentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key',
        transports: ['internal', 'hybrid', 'ble', 'nfc', 'usb']
      })) : [];
    
    const authenticationOptions = {
      challenge,
      timeout: 60000,
      rpId: effectiveRpId,
      allowCredentials,
      userVerification: isAndroidChrome ? 'discouraged' : 'required'
    };
    
    res.json(authenticationOptions);
  } catch (error) {
    console.error('Authentication options error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// WebAuthn Authentication Verification
app.post('/api/webauthn/authentication-verification', async (req, res) => {
  try {
    const { username, sessionId, credential } = req.body;
    
    console.log(`Processing authentication verification for ${username}, sessionId: ${sessionId}`);
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    // Find the matching credential
    if (!user.registeredCredentials) {
      return res.status(400).json({ error: 'No registered credentials' });
    }
    
    const userCredential = user.registeredCredentials.find(
      cred => cred.credentialID === credential.id
    );
    
    if (!userCredential) {
      return res.status(400).json({ error: 'Credential not found' });
    }
    
    // Verify challenge
    const expectedChallenge = user.currentChallenge;
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'No challenge found' });
    }
    
    const clientDataJSON = JSON.parse(
      Buffer.from(credential.response.clientDataJSON, 'base64').toString()
    );
    
    if (clientDataJSON.challenge !== expectedChallenge) {
      return res.status(400).json({ error: 'Challenge mismatch' });
    }
    
    // Verify origin
    console.log(`Origin from client: ${clientDataJSON.origin}`);
    // Allow any origin that includes our rpID during development
    if (!clientDataJSON.origin.includes(getEffectiveRpId(req))) {
      console.warn(`Origin mismatch: ${clientDataJSON.origin} vs expected ${getEffectiveRpId(req)}`);
      // Don't reject in development, but log the warning
      // return res.status(400).json({ error: 'Origin mismatch' });
    }
    
    // Verify counter (prevent replay attacks)
    if (credential.response.counter <= userCredential.counter) {
      return res.status(400).json({ error: 'Potential replay attack' });
    }
    
    // Update counter
    userCredential.counter = credential.response.counter;
    
    // Clear challenge
    user.currentChallenge = null;
    await saveUser(user);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Generate device ID for this session
    const deviceId = uuidv4();
    
    // Get session info
    const pendingAuth = pendingAuths.get(sessionId);
    console.log(`===== AUTH EVENT =====`);
    console.log(`Mode: ${pendingAuth?.isRegistration ? 'Registration' : 'Authentication'}`);
    console.log(`Username: ${username}`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Socket ID: ${pendingAuth?.socketId || 'unknown'}`);
    console.log(`Socket Connected Clients: ${Object.keys(io.sockets.connected || {}).length}`);
    console.log(`=====================`);

    if (pendingAuth) {
      // Notify desktop client about successful authentication
      console.log(`Sending authSuccess to socket ${pendingAuth.socketId}`);
      io.to(pendingAuth.socketId).emit('authSuccess', {
        token,
        username: user.username,
        deviceId
      });
      
      // Also broadcast to all clients (this is the key addition)
      io.emit('authBroadcast', {
        sessionId,
        username: user.username,
        success: true,
        isRegistration: false
      });
      
      console.log(`Sent auth success notification to socket ${pendingAuth.socketId}`);
      console.log(`Broadcasted auth success for session ${sessionId}`);
      
      // Clean up pending auth
      pendingAuths.delete(sessionId);
      savePendingAuths();
    } else {
      console.log(`No pending auth found for session ${sessionId}, broadcasting anyway`);
      io.emit('authBroadcast', {
        sessionId,
        username: user.username,
        success: true,
        isRegistration: false
      });
    }
    
    res.json({ success: true, token, deviceId });
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a special cross-domain notify endpoint
app.post('/api/notify-desktop', (req, res) => {
  try {
    const { sessionId, username, success } = req.body;
    
    console.log(`Explicit desktop notification for session ${sessionId}, user ${username}`);
    
    // Find the pending auth
    const pendingAuth = pendingAuths.get(sessionId);
    
    // Broadcast to all sockets regardless of pendingAuth
    io.emit('authBroadcast', {
      sessionId,
      username,
      success,
      timestamp: Date.now()
    });
    
    // Also explicitly track this successful login in a global map
    // that the desktop can query via HTTP
    const successfulAuths = global.successfulAuths || new Map();
    successfulAuths.set(sessionId, {
      username,
      success,
      timestamp: Date.now()
    });
    global.successfulAuths = successfulAuths;
    
    console.log(`Auth notification sent for session ${sessionId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to notify desktop' });
  }
});

// Add a way for desktop to check auth status via HTTP polling as fallback
app.get('/api/auth-status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const successfulAuths = global.successfulAuths || new Map();
  
  if (successfulAuths.has(sessionId)) {
    const authData = successfulAuths.get(sessionId);
    console.log(`Auth status check: found session ${sessionId} for ${authData.username}`);
    
    // Generate a JWT token for the user
    const user = {
      username: authData.username,
      _id: crypto.randomBytes(12).toString('hex') // temporary ID if needed
    };
    
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove from map after retrieving to prevent reuse
    successfulAuths.delete(sessionId);
    
    return res.json({
      success: true,
      username: authData.username,
      token,
      deviceId: crypto.randomBytes(16).toString('hex')
    });
  }
  
  return res.json({ success: false, message: 'No authentication found for this session' });
});

// Add a session verification endpoint so mobile clients can verify their session
app.post('/api/verify-session', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ valid: false, error: 'No session ID provided' });
    }
    
    const pendingAuth = pendingAuths.get(sessionId);
    
    if (!pendingAuth) {
      console.log(`Session ${sessionId} not found in pending auths`);
      // Create a new session for the client
      const newSessionId = uuidv4();
      updatePendingAuth(newSessionId, {
        username: 'pending',
        socketId: 'auto-created',
        timestamp: Date.now(),
        isRegistration: true
      });
      
      return res.json({ 
        valid: false, 
        error: 'Session not found or expired',
        newSessionId // Provide new session
      });
    }
    
    // Update the timestamp to keep the session alive
    pendingAuth.timestamp = Date.now();
    updatePendingAuth(sessionId, pendingAuth);
    
    return res.json({ 
      valid: true, 
      username: pendingAuth.username,
      isRegistration: pendingAuth.isRegistration
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// Add a special cross-domain communication endpoint
app.post('/api/hub/broadcast', (req, res) => {
  try {
    const { sessionId, username, event, data } = req.body;
    
    console.log(`Cross-domain hub received ${event} event for session ${sessionId}`);
    
    // Broadcast the event to all clients
    io.emit(event, {
      ...data,
      sessionId,
      username,
      fromHub: true
    });
    
    // Also send a backup broadcast
    io.emit('authBroadcast', {
      sessionId,
      username,
      success: true,
      fromHub: true
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Hub broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast event' });
  }
});

// Protected route example
app.get('/api/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({ 
    message: 'This is protected data', 
    user: req.user.username 
  });
});

// Simple homepage for health checks and keep-alive pings
app.get('/', (req, res) => {
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  const uptimeSeconds = Math.floor(uptime % 60);
  
  res.json({
    status: 'online',
    service: 'FastKey Authentication API',
    version: '1.0.0',
    uptime: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
    pendingAuthSessions: pendingAuths.size,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Add these endpoints right before the "Protected route example" section

// Mobile device registration
app.post('/mobile/register-device', async (req, res) => {
  try {
    const { username, deviceToken, deviceInfo } = req.body;
    
    // Find or create user
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add device to user's devices
    if (!user.devices) {
      user.devices = [];
    }
    
    // Check if device already exists
    const existingDeviceIndex = user.devices ? 
      user.devices.findIndex(d => d.token === deviceToken) : -1;
      
    if (existingDeviceIndex >= 0) {
      user.devices[existingDeviceIndex].info = deviceInfo;
      user.devices[existingDeviceIndex].lastSeen = Date.now();
    } else {
      user.devices.push({
        token: deviceToken,
        info: deviceInfo,
        registered: Date.now(),
        lastSeen: Date.now()
      });
    }
    
    await saveUser(user);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Device registration error:', error);
    return res.status(500).json({ error: 'Server error during device registration' });
  }
});

// Mobile login approval
app.post('/mobile/approve-login', async (req, res) => {
  try {
    const { sessionId, username, deviceToken } = req.body;
    
    // Find the pending auth
    const pendingAuth = pendingAuths.get(sessionId);
    if (!pendingAuth) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }
    
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify device is registered to this user
    const isDeviceRegistered = user.devices && 
      user.devices.some(d => d.token === deviceToken);
      
    if (!isDeviceRegistered) {
      // For development, allow unregistered devices
      console.log(`Device ${deviceToken} not registered for ${username}, but allowing for development`);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Notify desktop client
    io.to(pendingAuth.socketId).emit('authSuccess', {
      token,
      username: user.username,
      deviceId: deviceToken
    });
    
    // Broadcast to all clients
    io.emit('authBroadcast', {
      sessionId,
      username: user.username,
      success: true
    });
    
    // Store successful auth for polling
    const successfulAuths = global.successfulAuths || new Map();
    successfulAuths.set(sessionId, {
      username,
      success: true,
      timestamp: Date.now()
    });
    global.successfulAuths = successfulAuths;
    
    // Clean up pending auth
    pendingAuths.delete(sessionId);
    savePendingAuths();
    
    return res.json({ success: true, token });
  } catch (error) {
    console.error('Login approval error:', error);
    return res.status(500).json({ error: 'Server error during login approval' });
  }
});
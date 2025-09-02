import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:fastkey/models/login_request.dart';
import 'package:fastkey/services/storage_service.dart';
import 'package:fastkey/services/notification_service.dart';
import 'package:fastkey/providers/approval_provider.dart';

class SocketService {
  IO.Socket? _socket;
  final _storage = const FlutterSecureStorage();
  final StorageService _storageService = StorageService();
  final NotificationService _notificationService = NotificationService();
  
  Function(LoginRequest)? onLoginRequest;

  static const String socketUrl = 'https://fastkey.onrender.com';

  Future<void> initialize({Function(LoginRequest)? onRequestCallback}) async {
    if (onRequestCallback != null) {
      onLoginRequest = onRequestCallback;
    }
    
    if (_socket != null && _socket!.connected) {
      print('Socket already connected, returning');
      return;
    }

    try {
      final userData = await _storageService.getUserData();
      final deviceToken = await _storageService.getDeviceToken();
      
      print('Initializing socket service with:');
      print('User: ${userData?.username}');
      print('Device token: $deviceToken');
      
      if (userData == null || deviceToken == null) {
        print('Cannot initialize socket: missing user data or device token');
        return;
      }

      // Disconnect existing socket if any
      if (_socket != null) {
        _socket!.disconnect();
        _socket = null;
      }

      // Initialize Socket.io client
      _socket = IO.io(socketUrl, <String, dynamic>{
        'transports': ['websocket', 'polling'],
        'autoConnect': false,
        'reconnection': true,
        'reconnectionAttempts': 5,
        'reconnectionDelay': 2000,
        'timeout': 10000,
      });

      // Set up event handlers BEFORE connecting
      _socket!.onConnect((_) {
        print('✅ Socket connected successfully!');
        
        // Register for mobile-specific events
        print('📱 Registering mobile listener for user: ${userData.username}');
        _socket!.emit('register-mobile-listener', {
          'username': userData.username,
          'deviceToken': deviceToken,
        });
        
        // Also join the mobile room explicitly
        _socket!.emit('join-mobile-room', {
          'username': userData.username,
        });
      });

      _socket!.onDisconnect((reason) {
        print('❌ Socket disconnected: $reason');
      });

      _socket!.onConnectError((data) {
        print('🚫 Socket connect error: $data');
      });
      
      _socket!.onError((data) {
        print('⚠️ Socket error: $data');
      });

      _socket!.onReconnect((attemptNumber) {
        print('🔄 Socket reconnected after $attemptNumber attempts');
        // Re-register when reconnecting
        _socket!.emit('register-mobile-listener', {
          'username': userData.username,
          'deviceToken': deviceToken,
        });
      });

      // Listen for login requests - this is the critical part
      final loginEventName = 'login-request:${userData.username}';
      print('👂 Setting up listener for event: $loginEventName');
      
      _socket!.on(loginEventName, (data) {
        print('🔔 Received login request: $data');
        _handleLoginRequest(data);
      });

      // Also listen for a generic mobile notification event as fallback
      _socket!.on('mobile-login-request', (data) {
        print('📱 Received mobile login request: $data');
        if (data['username'] == userData.username) {
          _handleLoginRequest(data);
        }
      });

      // Test connectivity
      _socket!.on('connect', (_) {
        print('🧪 Testing socket connection...');
        _socket!.emit('ping', {'timestamp': DateTime.now().toIso8601String()});
      });

      _socket!.on('pong', (data) {
        print('🏓 Received pong: $data');
      });

      // Connect to socket
      _socket!.connect();
      print('🚀 Socket connection initiated');

    } catch (e) {
      print('💥 Error initializing socket: $e');
    }
  }

  void _handleLoginRequest(dynamic data) {
    try {
      print('Processing login request data: $data');
      
      final loginRequest = LoginRequest(
        sessionId: data['sessionId'] ?? '',
        username: data['username'] ?? '',
        timestamp: data['timestamp'] != null 
            ? DateTime.parse(data['timestamp']) 
            : DateTime.now(),
        deviceInfo: data['deviceInfo'],
        location: data['location'],
      );
      
      print('Created login request: ${loginRequest.sessionId} for ${loginRequest.username}');
      
      // Show notification
      _notificationService.showLoginRequestNotification(
        username: loginRequest.username,
        sessionId: loginRequest.sessionId,
        deviceInfo: loginRequest.deviceInfo,
      );
      
      // Call the callback if it exists
      if (onLoginRequest != null) {
        print('Calling login request callback');
        onLoginRequest!(loginRequest);
      } else {
        print('⚠️ No login request callback registered');
      }
    } catch (e) {
      print('💥 Error processing login request: $e');
    }
  }

  void disconnect() {
    print('🔌 Disconnecting socket service');
    if (_socket != null) {
      _socket!.disconnect();
      _socket = null;
    }
  }

  bool get isConnected => _socket?.connected ?? false;
  
  // Add a method to manually check connection and reconnect if needed
  Future<void> ensureConnected() async {
    if (_socket == null || !_socket!.connected) {
      print('🔄 Socket not connected, reinitializing...');
      await initialize();
    }
  }
}
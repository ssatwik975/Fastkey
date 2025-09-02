import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:fastkey/models/login_request.dart';
import 'package:fastkey/services/storage_service.dart';
import 'package:fastkey/services/notification_service.dart';

class SocketService {
  IO.Socket? _socket;
  final _storage = const FlutterSecureStorage();
  final StorageService _storageService = StorageService();
  final NotificationService _notificationService = NotificationService();

  // Socket.io server URL - same as backend
  static const String socketUrl = 'https://fastkey.onrender.com';
  // For local development, use your local IP address instead of localhost
  // static const String socketUrl = 'http://192.168.1.x:5001';

  Future<void> initialize() async {
    if (_socket != null) {
      print('Socket already initialized, returning');
      return;
    }

    try {
      // Get stored user data
      final userData = await _storageService.getUserData();
      final deviceToken = await _storageService.getDeviceToken();
      
      print('Initializing socket service with:');
      print('User: ${userData?.username}');
      print('Device token: $deviceToken');
      
      if (userData == null || deviceToken == null) {
        print('Cannot initialize socket: missing user data or device token');
        return;
      }

      // Initialize Socket.io client with additional options
      _socket = IO.io(socketUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'reconnection': true,
        'reconnectionAttempts': 5,
        'reconnectionDelay': 1000,
      });

      // Updated socket event handlers for v3.x
      _socket!.onConnect((_) {
        print('Socket connected');
        
        // Register for mobile-specific events
        _socket!.emit('register-mobile-listener', {
          'username': userData.username,
          'deviceToken': deviceToken,
        });
      });

      _socket!.onDisconnect((_) {
        print('Socket disconnected');
      });

      _socket!.onConnectError((data) {
        print('Socket connect error: $data');
      });

      // These methods remain the same
      _socket!.on('login_request', (data) {
        // Your login request handler
      });

      _socket!.on('auth_approved', (data) {
        // Your auth approved handler
      });
      
      // Connect to socket
      _socket!.connect();

      // Socket event handlers
      _socket!.onConnect((_) {
        print('Socket connected');
        
        // Register for mobile-specific events
        _socket!.emit('register-mobile-listener', {
          'username': userData.username,
          'deviceToken': deviceToken,
        });
      });

      _socket!.onDisconnect((_) {
        print('Socket disconnected');
      });

      _socket!.onError((error) {
        print('Socket error: $error');
      });

      // Listen for login requests
      _setupLoginRequestListener(userData.username, deviceToken);

    } catch (e) {
      print('Error initializing socket: $e');
    }
  }

  void _setupLoginRequestListener(String username, String deviceToken) {
    // Initialize notification service
    _notificationService.initialize();
    
    // Listen for login requests specific to this device
    _socket?.on('login-request:$username', (data) {
      print('Received login request for username: $username');
      
      if (data != null && data['sessionId'] != null) {
        // Create login request object
        final loginRequest = LoginRequest(
          sessionId: data['sessionId'],
          username: username,
          timestamp: data['timestamp'] != null 
              ? DateTime.parse(data['timestamp']) 
              : DateTime.now(),
          deviceInfo: data['deviceInfo'],
        );
        
        // Show notification
        _notificationService.showLoginRequestNotification(
          username: username,
          sessionId: data['sessionId'],
          deviceInfo: data['deviceInfo'],
        );
        
        // Notify listeners
        if (_onLoginRequestCallbacks.isNotEmpty) {
          for (final callback in _onLoginRequestCallbacks) {
            callback(loginRequest);
          }
        }
      }
    });
    
    // Also listen for device-specific requests as fallback
    _socket?.on('login-request:$username:$deviceToken', (data) {
      print('Received device-specific login request');
      if (data != null && data['sessionId'] != null) {
        final loginRequest = LoginRequest(
          sessionId: data['sessionId'],
          username: username,
          timestamp: data['timestamp'] != null 
              ? DateTime.parse(data['timestamp']) 
              : DateTime.now(),
          deviceInfo: data['deviceInfo'],
        );
        
        // Show notification
        _notificationService.showLoginRequestNotification(
          username: username,
          sessionId: data['sessionId'],
          deviceInfo: data['deviceInfo'],
        );
        
        if (_onLoginRequestCallbacks.isNotEmpty) {
          for (final callback in _onLoginRequestCallbacks) {
            callback(loginRequest);
          }
        }
      }
    });
  }

  // Callback management for login requests
  final List<Function(LoginRequest)> _onLoginRequestCallbacks = [];

  void onLoginRequest(Function(LoginRequest) callback) {
    _onLoginRequestCallbacks.add(callback);
  }

  void removeLoginRequestListener(Function(LoginRequest) callback) {
    _onLoginRequestCallbacks.remove(callback);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  bool isConnected() {
    return _socket?.connected ?? false;
  }
}
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:fastkey/models/login_request.dart';
import 'package:fastkey/services/storage_service.dart';

class SocketService {
  io.Socket? _socket;
  final StorageService _storageService = StorageService();

  // Socket.io server URL - same as backend
  static const String socketUrl = 'https://fastkey.onrender.com';
  // For local development, use your local IP address instead of localhost
  // static const String socketUrl = 'http://192.168.1.x:5001';

  Future<void> initialize() async {
    if (_socket != null) {
      return;
    }

    try {
      // Get stored user data
      final userData = await _storageService.getUserData();
      final deviceToken = await _storageService.getDeviceToken();
      
      if (userData == null || deviceToken == null) {
        print('Cannot initialize socket: missing user data or device token');
        return;
      }

      // Initialize Socket.io client
      _socket = io.io(socketUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
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
    // Listen for login requests specific to this device
    _socket?.on('login-request:$username:$deviceToken', (data) {
      print('Received login request: $data');
      
      if (data != null && data['sessionId'] != null) {
        // Create and return login request object
        final loginRequest = LoginRequest(
          sessionId: data['sessionId'],
          username: username,
          timestamp: data['timestamp'] != null 
              ? DateTime.parse(data['timestamp']) 
              : DateTime.now(),
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
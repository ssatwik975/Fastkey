import 'package:flutter/foundation.dart';
import 'package:fastkey/models/user.dart';
import 'package:fastkey/models/login_history.dart';
import 'package:fastkey/models/login_request.dart';
import 'package:fastkey/services/auth_service.dart';
import 'package:fastkey/services/storage_service.dart';
import 'package:fastkey/services/api_service.dart';
import 'package:fastkey/services/socket_service.dart';
import 'package:provider/provider.dart';

import 'approval_provider.dart';

enum AuthStatus {
  initial,
  unauthenticated,
  authenticating,
  authenticated,
  error,
  loading
}

class AuthProvider with ChangeNotifier {
  AuthStatus _status = AuthStatus.initial;
  User? _user;
  String? _token;
  String? _errorMessage;
  List<LoginHistory> _loginHistory = [];
  bool _isLoadingHistory = false;

  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();
  final ApiService _apiService = ApiService();
  final SocketService _socketService = SocketService();

  // Add this to store the approval provider callback
  Function(LoginRequest)? _onLoginRequestCallback;
  bool _socketInitialized = false;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get token => _token;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  List<LoginHistory> get loginHistory => _loginHistory;
  bool get isLoadingHistory => _isLoadingHistory;

  AuthProvider() {
    _initialize();
  }

  // Add this method to set the callback from the UI
  void setLoginRequestCallback(Function(LoginRequest) callback) {
    print('🔗 Setting login request callback');
    _onLoginRequestCallback = callback;
    
    // Initialize socket service now that we have the callback
    if (isAuthenticated && !_socketInitialized) {
      print('🚀 Initializing socket service with callback');
      _initializeSocketService();
    }
  }

  Future<void> _initializeSocketService() async {
    if (_socketInitialized || _onLoginRequestCallback == null) return;
    
    try {
      print('📡 Initializing socket service...');
      await _socketService.initialize(
        onRequestCallback: _onLoginRequestCallback!
      );
      _socketInitialized = true;
      print('✅ Socket service initialized successfully');
    } catch (e) {
      print('❌ Failed to initialize socket service: $e');
    }
  }

  Future<void> _initialize() async {
    try {
      print('Initializing auth provider...');
      _status = AuthStatus.loading;
      notifyListeners();
      
      final userData = await _storageService.getUserData();
      final storedToken = await _storageService.getToken();
      
      print('Retrieved user data from secure storage: ${userData != null ? "found" : "not found"}');
      print('Retrieved token: ${storedToken != null}');
      
      if (userData != null && storedToken != null) {
        _user = userData;
        _token = storedToken;
        _status = AuthStatus.authenticated;
        print('Auth provider initialized with authenticated user: ${userData.username}');
        
        // DON'T initialize socket here - wait for callback to be set
        // fetchLoginHistory(); // Also wait for callback
      } else {
        _status = AuthStatus.unauthenticated;
        print('Auth provider initialized but no user data found');
      }
    } catch (e) {
      print('Error initializing auth provider: $e');
      _status = AuthStatus.error;
    }
    notifyListeners();
  }

  // New method to authenticate user with token
  Future<bool> authenticate(String username, {String? token}) async {
    try {
      _status = AuthStatus.authenticating;
      _errorMessage = null;
      notifyListeners();

      if (token != null) {
        // We already have a token from web authentication
        _user = User(username: username);
        _token = token;
        
        await _storageService.saveUserData(_user!);
        await _storageService.saveToken(_token);
        
        _status = AuthStatus.authenticated;
        notifyListeners();
        
        // Initialize socket service with callback if available
        if (_onLoginRequestCallback != null && !_socketInitialized) {
          await _initializeSocketService();
        }
        
        // Fetch login history
        fetchLoginHistory();
        
        return true;
      } else {
        // No token provided, attempt to register device
        final deviceToken = await _storageService.getDeviceToken();
        final result = await _authService.registerDevice(
          username: username,
          deviceToken: deviceToken,
        );

        if (result.success) {
          _user = User(username: username, deviceToken: deviceToken);
          _token = result.token;
          
          await _storageService.saveUserData(_user!);
          await _storageService.saveToken(_token);
          
          // Initialize socket service with callback if available
          if (_onLoginRequestCallback != null && !_socketInitialized) {
            await _initializeSocketService();
          }
          
          _status = AuthStatus.authenticated;
          notifyListeners();
          
          // Fetch login history
          fetchLoginHistory();
          
          return true;
        } else {
          _errorMessage = result.errorMessage ?? 'Authentication failed';
          _status = AuthStatus.error;
          notifyListeners();
          return false;
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    // Disconnect socket
    _socketService.disconnect();
    _socketInitialized = false;
    
    await _storageService.clearUserData();
    await _storageService.clearToken();
    _user = null;
    _token = null;
    _loginHistory = [];
    _status = AuthStatus.unauthenticated;
    _onLoginRequestCallback = null;
    notifyListeners();
  }

  Future<void> fetchLoginHistory() async {
    if (_user == null) return;
    
    try {
      _isLoadingHistory = true;
      notifyListeners();
      
      _loginHistory = await _apiService.getLoginHistory(
        _user!.username,
        token: _token,
      );
      
      _isLoadingHistory = false;
      notifyListeners();
    } catch (e) {
      print('Error fetching login history: $e');
      _isLoadingHistory = false;
      notifyListeners();
    }
  }
}
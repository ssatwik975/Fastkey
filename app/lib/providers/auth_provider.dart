import 'package:flutter/foundation.dart';
import 'package:fastkey/models/user.dart';
import 'package:fastkey/services/auth_service.dart';
import 'package:fastkey/services/storage_service.dart';

enum AuthStatus {
  initial,
  unauthenticated,
  authenticating,
  authenticated,
  error
}

class AuthProvider with ChangeNotifier {
  AuthStatus _status = AuthStatus.initial;
  User? _user;
  String? _token;
  String? _errorMessage;

  // Add a new field
  bool _needsRegistration = false;

  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  AuthStatus get status => _status;
  User? get user => _user;
  String? get token => _token;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  // Add getter
  bool get needsRegistration => _needsRegistration;

  AuthProvider() {
    _initialize();
  }

  // Update the _initialize method to add more logging for debugging

  Future<void> _initialize() async {
    try {
      print('Initializing auth provider...');
      final userData = await _storageService.getUserData();
      final storedToken = await _storageService.getToken();
      
      print('Retrieved user data: ${userData != null}');
      print('Retrieved token: ${storedToken != null}');
      
      if (userData != null && storedToken != null) {
        _user = userData;
        _token = storedToken;
        _status = AuthStatus.authenticated;
        print('Auth provider initialized with authenticated user: ${userData.username}');
      } else {
        _status = AuthStatus.unauthenticated;
        print('Auth provider initialized but no user data found');
      }
    } catch (e) {
      print('Error initializing auth provider: $e');
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> register(String username) async {
    try {
      _status = AuthStatus.authenticating;
      _errorMessage = null;
      _needsRegistration = false; // Reset this flag
      notifyListeners();

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
        
        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result.errorMessage ?? 'Registration failed';
        _needsRegistration = result.needsRegistration; // Set the flag
        _status = AuthStatus.error;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString();
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _storageService.clearUserData();
    await _storageService.clearToken();
    _user = null;
    _token = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> updateToken(String token) async {
    _token = token;
    await _storageService.saveToken(token);
    notifyListeners();
  }
}
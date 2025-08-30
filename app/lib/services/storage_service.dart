import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'package:fastkey/models/user.dart';

class StorageService {
  static const String _userKey = 'fastkey_user';
  static const String _tokenKey = 'fastkey_token';
  static const String _deviceTokenKey = 'fastkey_device_token';
  
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  // Get user data from secure storage
  Future<User?> getUserData() async {
    try {
      final userJson = await _secureStorage.read(key: _userKey);
      if (userJson == null) return null;
      
      return User.fromJson(jsonDecode(userJson));
    } catch (e) {
      print('Error getting user data: $e');
      return null;
    }
  }

  // Save user data to secure storage
  Future<void> saveUserData(User user) async {
    try {
      await _secureStorage.write(
        key: _userKey,
        value: jsonEncode(user.toJson()),
      );
    } catch (e) {
      print('Error saving user data: $e');
    }
  }

  // Clear user data
  Future<void> clearUserData() async {
    try {
      await _secureStorage.delete(key: _userKey);
    } catch (e) {
      print('Error clearing user data: $e');
    }
  }

  // Get auth token from secure storage
  Future<String?> getToken() async {
    try {
      return await _secureStorage.read(key: _tokenKey);
    } catch (e) {
      print('Error getting token: $e');
      return null;
    }
  }

  // Save auth token to secure storage
  Future<void> saveToken(String? token) async {
    try {
      if (token != null) {
        await _secureStorage.write(key: _tokenKey, value: token);
      }
    } catch (e) {
      print('Error saving token: $e');
    }
  }

  // Clear auth token
  Future<void> clearToken() async {
    try {
      await _secureStorage.delete(key: _tokenKey);
    } catch (e) {
      print('Error clearing token: $e');
    }
  }

  // Get or generate a unique device token
  Future<String> getDeviceToken() async {
    try {
      String? deviceToken = await _secureStorage.read(key: _deviceTokenKey);
      
      if (deviceToken == null) {
        // Generate a new UUID for this device
        deviceToken = const Uuid().v4();
        await _secureStorage.write(key: _deviceTokenKey, value: deviceToken);
      }
      
      return deviceToken;
    } catch (e) {
      print('Error with device token: $e');
      // Fallback - generate a new one
      final token = const Uuid().v4();
      try {
        await _secureStorage.write(key: _deviceTokenKey, value: token);
      } catch (_) {}
      return token;
    }
  }
}
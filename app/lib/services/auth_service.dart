import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:local_auth/local_auth.dart';
import 'package:fastkey/services/api_service.dart';
import 'package:fastkey/services/storage_service.dart';

class AuthResult {
  final bool success;
  final String? token;
  final String? errorMessage;

  AuthResult({
    required this.success,
    this.token,
    this.errorMessage,
  });
}

class AuthService {
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  final LocalAuthentication _localAuth = LocalAuthentication();
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  Future<AuthResult> registerDevice({
    required String username,
    String? deviceToken,
  }) async {
    try {
      // Generate a device token if not provided
      final token = deviceToken ?? await _storageService.getDeviceToken();
      
      // Get device info for display purposes
      final deviceInfo = await _getDeviceInfo();

      final response = await _apiService.post(
        '/mobile/register-device',
        {
          'username': username,
          'deviceToken': token,
          'deviceInfo': deviceInfo,
        },
      );

      if (response.success) {
        return AuthResult(
          success: true,
        );
      } else {
        return AuthResult(
          success: false,
          errorMessage: response.errorMessage ?? 'Failed to register device',
        );
      }
    } catch (e) {
      return AuthResult(
        success: false,
        errorMessage: 'Error: ${e.toString()}',
      );
    }
  }

  Future<AuthResult> approveLogin({
    required String sessionId,
    required String username,
  }) async {
    try {
      // Verify biometric authentication before approving
      final authenticated = await authenticateWithBiometrics(
        'Approve Login',
        'Confirm it\'s you to approve this login',
      );

      if (!authenticated) {
        return AuthResult(
          success: false,
          errorMessage: 'Biometric authentication failed',
        );
      }

      // Get device token
      final deviceToken = await _storageService.getDeviceToken();

      final response = await _apiService.post(
        '/mobile/approve-login',
        {
          'sessionId': sessionId,
          'username': username,
          'deviceToken': deviceToken,
        },
      );

      if (response.success) {
        // Save the new token if provided
        if (response.data['token'] != null) {
          await _storageService.saveToken(response.data['token']);
        }
        return AuthResult(
          success: true,
          token: response.data['token'],
        );
      } else {
        return AuthResult(
          success: false,
          errorMessage: response.errorMessage ?? 'Failed to approve login',
        );
      }
    } catch (e) {
      return AuthResult(
        success: false,
        errorMessage: 'Error: ${e.toString()}',
      );
    }
  }

  Future<bool> authenticateWithBiometrics(String title, String reason) async {
    try {
      final canCheckBiometrics = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      
      if (!canCheckBiometrics || !isDeviceSupported) {
        return false;
      }

      return await _localAuth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } catch (e) {
      print('Error in biometric authentication: $e');
      return false;
    }
  }

  Future<String> _getDeviceInfo() async {
    try {
      if (Platform.isAndroid) {
        final info = await _deviceInfo.androidInfo;
        return '${info.brand} ${info.model}';
      } else if (Platform.isIOS) {
        final info = await _deviceInfo.iosInfo;
        return '${info.name} (${info.model})';
      } else {
        return 'Unknown device';
      }
    } catch (e) {
      return 'Device';
    }
  }
}
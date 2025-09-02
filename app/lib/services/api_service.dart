import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:fastkey/models/login_history.dart';

class ApiResponse {
  final bool success;
  final String? errorMessage;
  final dynamic data;

  ApiResponse({
    required this.success,
    this.errorMessage,
    this.data,
  });
}

class ApiService {
  // In a production app, you'd use a config file or environment variables
  static const String baseUrl = 'https://fastkey.onrender.com';
  // For local development, use your local IP address instead of localhost
  // static const String baseUrl = 'http://192.168.1.x:5001/api';

  final http.Client _client = http.Client();

  Future<ApiResponse> post(String endpoint, Map<String, dynamic> body, {String? token}) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

      final response = await _client.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: jsonEncode(body),
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(
          success: true,
          data: responseData,
        );
      } else {
        return ApiResponse(
          success: false,
          errorMessage: responseData['error'] ?? 'Unknown error occurred',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        errorMessage: 'Network error: ${e.toString()}',
      );
    }
  }

  Future<ApiResponse> get(String endpoint, {String? token}) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

      final response = await _client.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(
          success: true,
          data: responseData,
        );
      } else {
        return ApiResponse(
          success: false,
          errorMessage: responseData['error'] ?? 'Unknown error occurred',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        errorMessage: 'Network error: ${e.toString()}',
      );
    }
  }
  
  // Fixed auth status check - now checks for any recent auth for the username
  Future<ApiResponse> checkAuthStatus(String sessionId, String username) async {
    try {
      print('🔍 Checking auth status for session: $sessionId');
      
      // First try the specific session
      final sessionResponse = await _client.get(
        Uri.parse('$baseUrl/api/auth-status/$sessionId'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      print('📡 Session auth response: ${sessionResponse.statusCode}');
      print('📄 Session auth body: ${sessionResponse.body}');

      if (sessionResponse.statusCode == 200) {
        final sessionData = jsonDecode(sessionResponse.body);
        if (sessionData['success'] == true) {
          print('✅ Found auth for specific session');
          return ApiResponse(
            success: true,
            data: sessionData,
          );
        }
      }
      
      // If specific session failed, check for any recent auth for this username
      print('🔄 Checking for any recent auth for username: $username');
      final recentResponse = await _client.get(
        Uri.parse('$baseUrl/api/recent-auths/$username'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      print('📡 Recent auth response: ${recentResponse.statusCode}');
      print('📄 Recent auth body: ${recentResponse.body}');

      if (recentResponse.statusCode == 200) {
        final recentData = jsonDecode(recentResponse.body);
        if (recentData['success'] == true) {
          print('✅ Found recent auth for username');
          return ApiResponse(
            success: true,
            data: recentData,
          );
        }
      }
      
      return ApiResponse(success: false);
    } catch (e) {
      print('💥 Auth status error: $e');
      return ApiResponse(
        success: false,
        errorMessage: e.toString(),
      );
    }
  }
  
  // Add a method to fetch login history
  Future<List<LoginHistory>> getLoginHistory(String username, {String? token}) async {
    final response = await get('/api/login-history/$username', token: token);
    
    if (response.success && response.data != null) {
      final List<dynamic> historyData = response.data['history'] ?? [];
      return historyData.map((item) => LoginHistory.fromJson(item)).toList();
    }
    
    return [];
  }
  
  Future<ApiResponse> saveLoginHistory(LoginHistory history) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/api/login-history'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(history.toJson()),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return ApiResponse(success: true);
      } else {
        return ApiResponse(
          success: false,
          errorMessage: 'Failed to save login history',
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        errorMessage: e.toString(),
      );
    }
  }
}
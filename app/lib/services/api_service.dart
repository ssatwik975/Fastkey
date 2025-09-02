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
  
  // Add a method to check authentication status
  Future<ApiResponse> checkAuthStatus(String sessionId) async {
    return get('/api/auth-status/$sessionId');
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
}
import 'package:fastkey/models/login_request.dart';

class LoginHistory {
  final String id;
  final String username;
  final DateTime timestamp;
  final String? deviceInfo;
  final String? location;
  final bool successful;

  LoginHistory({
    required this.id,
    required this.username,
    required this.timestamp,
    this.deviceInfo,
    this.location,
    required this.successful,
  });

  factory LoginHistory.fromJson(Map<String, dynamic> json) {
    return LoginHistory(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      deviceInfo: json['deviceInfo'],
      location: json['location'],
      successful: json['successful'] ?? true,
    );
  }

  factory LoginHistory.fromLoginRequest(LoginRequest request, bool successful) {
    return LoginHistory(
      id: request.sessionId,
      username: request.username,
      timestamp: request.timestamp,
      deviceInfo: request.deviceInfo,
      location: request.location,
      successful: successful,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'timestamp': timestamp.toIso8601String(),
      'deviceInfo': deviceInfo,
      'location': location,
      'successful': successful,
    };
  }
}
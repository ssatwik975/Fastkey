class LoginRequest {
  final String sessionId;
  final String username;
  final DateTime timestamp;
  final String? deviceInfo;
  bool approved;
  bool denied;

  LoginRequest({
    required this.sessionId,
    required this.username,
    required this.timestamp,
    this.deviceInfo,
    this.approved = false,
    this.denied = false,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) {
    return LoginRequest(
      sessionId: json['sessionId'],
      username: json['username'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      deviceInfo: json['deviceInfo'],
      approved: json['approved'] ?? false,
      denied: json['denied'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sessionId': sessionId,
      'username': username,
      'timestamp': timestamp.toIso8601String(),
      'deviceInfo': deviceInfo,
      'approved': approved,
      'denied': denied,
    };
  }
}
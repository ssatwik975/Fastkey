class User {
  final String username;
  final String? deviceToken;
  final DateTime registeredAt;

  User({
    required this.username,
    this.deviceToken,
    DateTime? registeredAt,
  }) : registeredAt = registeredAt ?? DateTime.now();

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      username: json['username'],
      deviceToken: json['deviceToken'],
      registeredAt: json['registeredAt'] != null
          ? DateTime.parse(json['registeredAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'deviceToken': deviceToken,
      'registeredAt': registeredAt.toIso8601String(),
    };
  }
}
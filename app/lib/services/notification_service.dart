import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:fastkey/models/login_request.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;
  
  // Store the notification payload to be processed later
  String? latestNotificationPayload;

  factory NotificationService() {
    return _instance;
  }

  NotificationService._internal();

  Future<void> initialize() async {
    if (_isInitialized) return;

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
        
    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await _notificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
    
    _isInitialized = true;
    print('Notification service initialized');
  }

  void _onNotificationTapped(NotificationResponse details) {
    print('Notification clicked: ${details.payload}');
    // Store the payload for later use
    latestNotificationPayload = details.payload;
  }

  Future<void> showLoginRequestNotification({
    required String username,
    required String sessionId,
    String? deviceInfo,
  }) async {
    if (!_isInitialized) await initialize();

    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'login_requests',
      'Login Requests',
      channelDescription: 'Notifications for FastKey login requests',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notificationsPlugin.show(
      sessionId.hashCode,  // Use sessionId hash as notification ID
      'FastKey Login Request',
      'Someone is trying to log in as $username from ${deviceInfo ?? "unknown device"}',
      platformDetails,
      payload: sessionId,
    );
  }

  // Get and clear the latest notification payload
  String? getAndClearLatestPayload() {
    final payload = latestNotificationPayload;
    latestNotificationPayload = null;
    return payload;
  }
}
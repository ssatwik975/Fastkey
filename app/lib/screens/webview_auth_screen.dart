import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';
import 'package:fastkey/providers/auth_provider.dart';
import 'package:fastkey/screens/dashboard_screen.dart';
import 'package:fastkey/services/api_service.dart';

class WebViewAuthScreen extends StatefulWidget {
  final String username;
  final bool isRegistration;
  
  const WebViewAuthScreen({
    super.key,
    required this.username,
    this.isRegistration = true,
  });

  @override
  State<WebViewAuthScreen> createState() => _WebViewAuthScreenState();
}

class _WebViewAuthScreenState extends State<WebViewAuthScreen> with TickerProviderStateMixin {
  bool _isLoading = false;
  final String _sessionId = const Uuid().v4(); // Generate session ID locally
  String? _errorMessage;
  Timer? _pollingTimer;
  bool _isAuthenticated = false;
  int _currentStep = 0;
  int _pollAttempts = 0;
  static const int _maxPollAttempts = 150;
  
  late AnimationController _pulseController;
  late AnimationController _stepController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _stepAnimation;
  
  final List<String> _steps = [
    'Opening secure browser...',
    'Waiting for biometric verification...',
    'Processing authentication...',
    'Almost done...',
  ];

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _stepController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _stepAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _stepController,
      curve: Curves.easeOut,
    ));
    
    _pulseController.repeat(reverse: true);
    _stepController.forward();
    
    Future.microtask(() => _launchBrowser());
  }
  
  @override
  void dispose() {
    _pollingTimer?.cancel();
    _pulseController.dispose();
    _stepController.dispose();
    super.dispose();
  }
  
  Future<void> _launchBrowser() async {
    setState(() {
      _isLoading = true;
      _currentStep = 0;
    });
    
    try {
      const frontendUrl = 'https://fastkey.satwik.in';
      final encodedUsername = Uri.encodeComponent(widget.username);
      
      final urlPath = widget.isRegistration 
          ? '/mobile-auth/$_sessionId?username=$encodedUsername&register=true'
          : '/mobile-auth/$_sessionId?username=$encodedUsername';
      
      final authUrl = '$frontendUrl$urlPath';
      
      print('🌐 Opening browser URL: $authUrl');
      print('👤 User type: ${widget.isRegistration ? "New User (Registration)" : "Existing User (Login)"}');
      print('🆔 Session ID: $_sessionId');
      
      final uri = Uri.parse(authUrl);
      
      if (await canLaunchUrl(uri)) {
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        
        if (launched) {
          _updateStep(1);
          _startPolling();
        } else {
          throw Exception('Could not launch $uri');
        }
      } else if (await canLaunchUrlString(authUrl)) {
        final launched = await launchUrlString(
          authUrl,
          mode: LaunchMode.externalApplication,
        );
        
        if (launched) {
          _updateStep(1);
          _startPolling();
        } else {
          throw Exception('String launch failed for $authUrl');
        }
      } else {
        throw Exception('Cannot launch URL: $authUrl');
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to open browser: ${e.toString()}';
        _isLoading = false;
      });
    }
  }
  
  void _updateStep(int step) {
    if (step < _steps.length) {
      setState(() {
        _currentStep = step;
      });
      _stepController.reset();
      _stepController.forward();
    }
  }
  
  void _startPolling() async {
    // Start polling after 3 seconds to give user time to complete auth
    await Future.delayed(const Duration(seconds: 3));
    
    if (!mounted) return;
    
    _updateStep(2);
    
    print('🔄 Starting auth status polling for session: $_sessionId');
    
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      if (_isAuthenticated || !mounted) {
        timer.cancel();
        return;
      }
      
      _pollAttempts++;
      print('🔍 Poll attempt $_pollAttempts/$_maxPollAttempts for session: $_sessionId');
      
      try {
        final response = await ApiService().checkAuthStatus(
          _sessionId, 
          widget.username
        );
        
        if (response.success && response.data != null) {
          print('🎉 Authentication successful! Token received.');
          timer.cancel();
          
          setState(() {
            _isAuthenticated = true;
          });
          
          _updateStep(3);
          await Future.delayed(const Duration(milliseconds: 1500));
          
          final token = response.data['token'];
          if (token == null) {
            throw Exception('No token received from server');
          }
          
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          
          final success = await authProvider.authenticate(
            widget.username,
            token: token,
          );
          
          if (success && mounted) {
            print('✅ Navigating to dashboard');
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const DashboardScreen()),
            );
          } else {
            throw Exception('Failed to authenticate with received token');
          }
        } else if (_pollAttempts >= _maxPollAttempts) {
          // Timeout reached
          timer.cancel();
          if (mounted) {
            setState(() {
              _errorMessage = 'Authentication timeout. Please try again.';
              _isLoading = false;
            });
          }
        }
      } catch (e) {
        print('💥 Polling error: $e');
        
        if (_pollAttempts >= _maxPollAttempts) {
          timer.cancel();
          if (mounted) {
            setState(() {
              _errorMessage = 'Authentication timeout. Please try again.';
              _isLoading = false;
            });
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Header
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back),
                  ),
                  const Expanded(
                    child: Text(
                      'Secure Authentication',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
              
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Animated icon
                    if (_isLoading && !_isAuthenticated) ...[
                      AnimatedBuilder(
                        animation: _pulseAnimation,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: _pulseAnimation.value,
                            child: Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Color(0xFF2563EB),
                                    Color(0xFF7C3AED),
                                  ],
                                ),
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF2563EB).withOpacity(0.3),
                                    blurRadius: 20,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.fingerprint_rounded,
                                size: 40,
                                color: Colors.white,
                              ),
                            ),
                          );
                        },
                      ),
                    ] else if (_isAuthenticated) ...[
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF10B981).withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.check_rounded,
                          size: 40,
                          color: Colors.white,
                        ),
                      ),
                    ] else if (_errorMessage != null) ...[
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFEF4444).withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.error_outline_rounded,
                          size: 40,
                          color: Colors.white,
                        ),
                      ),
                    ],
                    
                    const SizedBox(height: 32),
                    
                    // Title
                    Text(
                      _isAuthenticated 
                          ? 'Authentication Successful!'
                          : _errorMessage != null
                              ? 'Authentication Failed'
                              : 'Authenticating...',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: _isAuthenticated 
                            ? const Color(0xFF10B981)
                            : _errorMessage != null
                                ? const Color(0xFFEF4444)
                                : const Color(0xFF1E293B),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Status message
                    AnimatedBuilder(
                      animation: _stepAnimation,
                      builder: (context, child) {
                        return Opacity(
                          opacity: _stepAnimation.value,
                          child: Text(
                            _errorMessage ?? 
                            (_isAuthenticated 
                                ? 'Taking you to your dashboard...'
                                : _currentStep < _steps.length 
                                    ? _steps[_currentStep]
                                    : 'Processing...'),
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey[600],
                              height: 1.5,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        );
                      },
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Progress indicator for loading
                    if (_isLoading && !_isAuthenticated && _errorMessage == null)
                      const CircularProgressIndicator(),
                    
                    // Instructions for loading state
                    if (_isLoading && !_isAuthenticated && _errorMessage == null) ...[
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0F9FF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFF0EA5E9).withOpacity(0.2),
                          ),
                        ),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.info_outline,
                              color: Color(0xFF0EA5E9),
                              size: 24,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Please complete the biometric verification in your browser',
                              style: TextStyle(
                                color: Colors.blue[700],
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              
              // Action buttons for error state
              if (_errorMessage != null)
                Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _errorMessage = null;
                            _currentStep = 0;
                            _pollAttempts = 0;
                            _isAuthenticated = false;
                          });
                          _launchBrowser();
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Try Again',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text(
                          'Go Back',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}
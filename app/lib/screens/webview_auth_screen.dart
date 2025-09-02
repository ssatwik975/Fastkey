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

class _WebViewAuthScreenState extends State<WebViewAuthScreen> {
  bool _isLoading = false;
  final String _sessionId = const Uuid().v4();
  String? _errorMessage;
  Timer? _pollingTimer;
  bool _isAuthenticated = false;
  
  @override
  void initState() {
    super.initState();
    Future.microtask(() => _launchBrowser());
  }
  
  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
  
  Future<void> _launchBrowser() async {
    setState(() => _isLoading = true);
    
    try {
      final frontendUrl = 'https://fastkey.satwik.in';
      final encodedUsername = Uri.encodeComponent(widget.username);
      
      final urlPath = widget.isRegistration 
          ? '/mobile-auth/$_sessionId?username=$encodedUsername&register=true'
          : '/mobile-auth/$_sessionId?username=$encodedUsername';
      
      final authUrl = '$frontendUrl$urlPath';
      
      print('Opening browser URL: $authUrl');
      print('User type: ${widget.isRegistration ? "New User (Registration)" : "Existing User (Login)"}');
      
      final uri = Uri.parse(authUrl);
      
      if (await canLaunchUrl(uri)) {
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        
        if (launched) {
          setState(() {
            _isLoading = false;
            _errorMessage = null;
          });
          
          // Start polling for authentication status
          _startPolling();
        } else {
          throw Exception('Could not launch $uri');
        }
      } else if (await canLaunchUrlString(authUrl)) {
        final launched = await launchUrlString(
          authUrl,
          mode: LaunchMode.externalApplication,
        );
        
        if (!launched) {
          throw Exception('String launch failed for $authUrl');
        }
        
        setState(() {
          _isLoading = false;
          _errorMessage = null;
        });
        
        // Start polling for authentication status
        _startPolling();
      } else {
        throw Exception('Cannot launch URL: No app available');
      }
      
    } catch (e) {
      print('Error launching browser: $e');
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to open browser: ${e.toString()}';
      });
    }
  }
  
  // Update to handle the session ID mismatch issue

  void _startPolling() {
    // Poll every 2 seconds to check if authentication was successful
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      try {
        final apiService = ApiService();
        
        // First try with the original session ID
        var response = await apiService.checkAuthStatus(_sessionId);
        
        // If that fails, try the fallback approach - check recent successful auths
        if (!response.success || response.data['success'] != true) {
          // Fetch recent auth sessions from server (new endpoint needed)
          response = await apiService.get('/api/recent-auths/${widget.username}');
          
          if (!response.success) {
            print('No successful auth found for username: ${widget.username}');
            return;
          }
        }
        
        if (response.success && response.data['success'] == true) {
          // Authentication was successful
          timer.cancel();
          
          if (mounted) {
            setState(() => _isAuthenticated = true);
            
            // Get the auth token
            final token = response.data['token'];
            
            // Update the auth provider
            final authProvider = Provider.of<AuthProvider>(context, listen: false);
            await authProvider.authenticate(
              widget.username,
              token: token,
            );
            
            // Show success and navigate to dashboard
            HapticFeedback.mediumImpact();
            
            _showSuccessAndNavigate();
          }
        }
      } catch (e) {
        print('Error checking auth status: $e');
      }
    });
  }
  
  void _showSuccessAndNavigate() {
    // Show success snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Authentication successful!'),
        backgroundColor: Color(0xFF30D158),
      ),
    );
    
    // Navigate to dashboard
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const DashboardScreen()),
      (route) => false,
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(widget.isRegistration ? 'Create Account' : 'Sign In'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: widget.isRegistration 
                        ? [const Color(0xFF30D158), const Color(0xFF32D74B)]
                        : [const Color(0xFF2563EB), const Color(0xFF7C3AED)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  widget.isRegistration 
                      ? Icons.person_add_rounded
                      : Icons.login_rounded,
                  size: 48,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Title
              Text(
                widget.isRegistration 
                    ? 'Complete Registration in Browser'
                    : 'Verify Your Identity in Browser',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 16),
              
              // Description
              Text(
                widget.isRegistration
                    ? 'Your browser opened to complete biometric setup for ${widget.username}. After completing the setup, you\'ll be automatically redirected.'
                    : 'Your browser opened to verify your identity for ${widget.username}. After verification, you\'ll be automatically redirected.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 40),
              
              // Loading or error state
              if (_isLoading) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                const Text('Opening browser...'),
              ] else if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF3B30).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFFF3B30).withOpacity(0.3),
                    ),
                  ),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: Color(0xFFFF3B30),
                        size: 32,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(fontSize: 16),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _launchBrowser,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Try Again', style: TextStyle(fontSize: 16)),
                  ),
                ),
              ] else ...[
                // Waiting for authentication
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F2F7),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const SizedBox(
                        width: 40,
                        height: 40,
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Waiting for authentication...',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Please complete the process in your browser.',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                TextButton.icon(
                  onPressed: _launchBrowser,
                  icon: const Icon(Icons.launch_rounded),
                  label: const Text('Open Browser Again'),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF2563EB),
                  ),
                ),
              ],
              
              const Spacer(),
              
              // Security notice
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F2F7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.shield_rounded,
                        color: Color(0xFF2563EB),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Security Guaranteed',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Your biometric data never leaves your device and stays private.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF8E8E93),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
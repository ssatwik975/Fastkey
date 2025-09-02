import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';
import 'package:fastkey/screens/dashboard_screen.dart';

class WebViewRegistrationScreen extends StatefulWidget {
  final String username;
  final bool isRegistration;
  
  const WebViewRegistrationScreen({
    super.key,
    required this.username,
    this.isRegistration = true,
  });

  @override
  State<WebViewRegistrationScreen> createState() => _WebViewRegistrationScreenState();
}

class _WebViewRegistrationScreenState extends State<WebViewRegistrationScreen> {
  bool _isLoading = false;
  final String _sessionId = const Uuid().v4();
  String? _errorMessage;
  bool _setupCompleted = false;
  
  @override
  void initState() {
    super.initState();
    Future.microtask(() => _launchBrowser());
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
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Text(widget.isRegistration ? 'Create Account' : 'Add Device'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
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
                      : [const Color(0xFF007AFF), const Color(0xFF5856D6)],
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                widget.isRegistration 
                    ? Icons.person_add_rounded
                    : Icons.phone_android_rounded,
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
              style: Theme.of(context).textTheme.displaySmall,
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 12),
            
            // Description
            Text(
              widget.isRegistration
                  ? 'Your browser opened to complete biometric setup for ${widget.username}. After completing the setup, return here to continue.'
                  : 'Your browser opened to verify your identity for ${widget.username}. After verification, return here to complete device setup.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF8E8E93),
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 32),
            
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
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 20),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _launchBrowser,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF007AFF),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Try Again'),
                ),
              ),
            ] else ...[
              // Success state
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF30D158).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF30D158).withOpacity(0.3),
                  ),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.launch_rounded,
                      color: Color(0xFF30D158),
                      size: 32,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Browser opened successfully',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Complete the ${widget.isRegistration ? "registration" : "verification"} in your browser, then return here.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF8E8E93),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
            
            const SizedBox(height: 32),
            
            // Instructions
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.info_outline_rounded,
                          color: Color(0xFF007AFF),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Next Steps',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 12),
                    
                    _buildInstructionStep(
                      '1',
                      widget.isRegistration 
                          ? 'Complete biometric registration in browser'
                          : 'Verify your identity with existing biometric',
                    ),
                    
                    const SizedBox(height: 8),
                    
                    _buildInstructionStep(
                      '2',
                      widget.isRegistration
                          ? 'Follow the setup instructions carefully'
                          : 'Approve the device addition request',
                    ),
                    
                    const SizedBox(height: 8),
                    
                    _buildInstructionStep(
                      '3',
                      'Return to this app when you see "Success" message',
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Action buttons
            Column(
              children: [
                // Manual launch button
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: _launchBrowser,
                    child: const Text('Open Browser Again'),
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // "I completed setup" button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _setupCompleted ? null : () {
                      setState(() => _setupCompleted = true);
                      _showCompletionDialog();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF30D158),
                      foregroundColor: Colors.white,
                    ),
                    child: Text(
                      widget.isRegistration 
                          ? 'I Completed Registration' 
                          : 'I Completed Verification',
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInstructionStep(String number, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: const Color(0xFF007AFF).withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF007AFF),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF30D158).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.check_circle_outline_rounded,
                color: Color(0xFF30D158),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text('Setup Complete!'),
          ],
        ),
        content: Text(
          widget.isRegistration
              ? 'Great! Your FastKey account has been created. You can now use biometric authentication for secure login.'
              : 'Perfect! This device has been added to your FastKey account. You can now receive authentication requests.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(
                  builder: (context) => const DashboardScreen(),
                ),
                (route) => false, // Remove all previous routes
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF30D158),
              foregroundColor: Colors.white,
            ),
            child: const Text('Continue to Dashboard'),
          ),
        ],
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:url_launcher/url_launcher.dart'; // Add this import
import 'package:uuid/uuid.dart';

class WebViewRegistrationScreen extends StatefulWidget {
  final String username;
  
  const WebViewRegistrationScreen({
    super.key,
    required this.username,
  });

  @override
  State<WebViewRegistrationScreen> createState() => _WebViewRegistrationScreenState();
}

class _WebViewRegistrationScreenState extends State<WebViewRegistrationScreen> {
  bool _isLoading = false;
  final String _sessionId = const Uuid().v4();
  String? _errorMessage;
  
  @override
  void initState() {
    super.initState();
    // Launch the URL in the system browser after a short delay
    Future.microtask(() => _launchBrowser());
  }
  
  Future<void> _launchBrowser() async {
    setState(() => _isLoading = true);
    
    try {
      // Use the correct frontend URL
      final frontendUrl = 'https://fastkey.satwik.in';
      
      // Properly encode the username
      final encodedUsername = Uri.encodeComponent(widget.username);
      
      // Create the registration URL
      final registrationUrl = '$frontendUrl/mobile-auth/$_sessionId?username=$encodedUsername&register=true';
      
      print('Opening browser URL: $registrationUrl');
      
      // Create a proper Uri object
      final uri = Uri.parse(registrationUrl);
      
      // Try the new url_launcher approach first
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
      } 
      // Fall back to string-based approach if the Uri approach fails
      else if (await canLaunchUrlString(registrationUrl)) {
        final launched = await launchUrlString(
          registrationUrl,
          mode: LaunchMode.externalApplication,
        );
        
        if (!launched) {
          throw Exception('String launch failed for $registrationUrl');
        }
        
        setState(() {
          _isLoading = false;
          _errorMessage = null;
        });
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Could not open browser. URL: $registrationUrl';
        });
      }
    } catch (e) {
      print('Error launching URL: $e');
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error: $e';
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Register with FastKey'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(
              Icons.fingerprint,
              size: 64,
              color: Color(0xFF2563EB),
            ),
            const SizedBox(height: 24),
            const Text(
              'Registration Process',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              'We\'ve opened your browser to complete the registration process.\n\n'
              'After successful registration, please return to this app.',
              style: const TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: 24),
            if (_isLoading)
              const Center(child: CircularProgressIndicator()),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(true);
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('I\'ve Completed Registration'),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: _launchBrowser,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Reopen Registration Page'),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(false);
              },
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }
}
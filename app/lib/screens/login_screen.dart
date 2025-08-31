import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fastkey/providers/auth_provider.dart';
import 'package:fastkey/screens/dashboard_screen.dart';
import 'package:fastkey/widgets/primary_button.dart';
import 'package:fastkey/screens/webview_registration_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _needsRegistration = false; // Add this flag

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
        _needsRegistration = false; // Reset the flag
      });
      
      final result = await Provider.of<AuthProvider>(context, listen: false)
          .register(_usernameController.text.trim());
      
      if (!result) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        setState(() {
          _isLoading = false;
          _errorMessage = authProvider.errorMessage;
          _needsRegistration = authProvider.needsRegistration; // Set local flag
        });
        
        // Don't automatically open WebView, let user click the button
      } else {
        setState(() {
          _isLoading = false;
        });
        
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
      }
    }
  }

  Future<void> _openRegistrationWebView() async {
    final registrationSuccess = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => WebViewRegistrationScreen(
          username: _usernameController.text.trim(),
        ),
      ),
    );
    
    if (registrationSuccess == true) {
      // Try login again after successful registration
      _handleLogin();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 48),
                const Text(
                  'FastKey',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2563EB),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Register your device for passwordless login',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                TextFormField(
                  controller: _usernameController,
                  decoration: InputDecoration(
                    labelText: 'Username',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.person),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your username';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red),
                      textAlign: TextAlign.center,
                    ),
                  ),
                PrimaryButton(
                  text: 'Continue',
                  isLoading: _isLoading,
                  onPressed: _handleLogin,
                ),
                
                // Add Create Account button when registration is needed
                if (_needsRegistration)
                  Padding(
                    padding: const EdgeInsets.only(top: 16.0),
                    child: OutlinedButton(
                      onPressed: _openRegistrationWebView,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: const BorderSide(color: Color(0xFF2563EB)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Create New Account',
                        style: TextStyle(
                          fontSize: 16,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
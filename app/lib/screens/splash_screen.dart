import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fastkey/providers/auth_provider.dart';
import 'package:fastkey/screens/login_screen.dart';
import 'package:fastkey/screens/dashboard_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    
    // First check if auth provider has already initialized
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (authProvider.status != AuthStatus.initial) {
      // If already initialized, check status
      _handleAuthStatus(authProvider.status);
    } else {
      // If still initializing, wait a moment and then check
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          final currentStatus = Provider.of<AuthProvider>(context, listen: false).status;
          _handleAuthStatus(currentStatus);
        }
      });
    }
  }

  // Add this method to handle navigation based on auth status
  void _handleAuthStatus(AuthStatus status) {
    if (!mounted) return;
    
    if (status == AuthStatus.authenticated) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const DashboardScreen()),
      );
    } else if (status == AuthStatus.unauthenticated || status == AuthStatus.error) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          // If status changed after initial check
          if (authProvider.status == AuthStatus.authenticated) {
            Future.microtask(() {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const DashboardScreen()),
              );
            });
          } else if (authProvider.status == AuthStatus.unauthenticated ||
                     authProvider.status == AuthStatus.error) {
            Future.microtask(() {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            });
          }
          
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'FastKey',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2563EB),
                  ),
                ),
                const SizedBox(height: 24),
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(
                  'Passwordless Authentication',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
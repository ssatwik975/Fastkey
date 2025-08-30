import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fastkey/providers/auth_provider.dart';
import 'package:fastkey/providers/approval_provider.dart';
import 'package:fastkey/screens/splash_screen.dart';
import 'package:fastkey/services/socket_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FastKeyApp());
}

class FastKeyApp extends StatelessWidget {
  const FastKeyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ApprovalProvider()),
        Provider(create: (_) => SocketService()),
      ],
      child: MaterialApp(
        title: 'FastKey',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2563EB), // Blue
            primary: const Color(0xFF2563EB),
            secondary: const Color(0xFF0EA5E9),
            background: const Color(0xFFF9FAFB),
          ),
          useMaterial3: true,
          fontFamily: 'Inter',
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            elevation: 0,
          ),
        ),
        home: const SplashScreen(),
      ),
    );
  }
}

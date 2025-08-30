import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fastkey/providers/auth_provider.dart';
import 'package:fastkey/providers/approval_provider.dart';
import 'package:fastkey/services/socket_service.dart';
import 'package:fastkey/screens/login_screen.dart';
import 'package:fastkey/screens/approval_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    _initializeSocket();
  }

  Future<void> _initializeSocket() async {
    final socketService = Provider.of<SocketService>(context, listen: false);
    await socketService.initialize();
    
    // Setup listener for login requests
    socketService.onLoginRequest((loginRequest) {
      final approvalProvider = Provider.of<ApprovalProvider>(context, listen: false);
      approvalProvider.addLoginRequest(loginRequest);
      
      // Show approval screen if we get a request
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => ApprovalScreen(request: loginRequest),
        ),
      );
    });
  }

  Future<void> _handleLogout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final approvalProvider = Provider.of<ApprovalProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('FastKey Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Welcome to FastKey',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You are logged in as ${authProvider.user?.username ?? "User"}',
              style: const TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 24),
            
            // Status card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: Colors.green,
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Device Registered',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Registered on: ${DateFormat('MMM d, yyyy').format(authProvider.user?.registeredAt ?? DateTime.now())}',
                      style: TextStyle(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Pending requests section
            const Text(
              'Pending Login Requests',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            Expanded(
              child: approvalProvider.pendingRequests.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.check_circle_outline,
                            size: 48,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No pending login requests',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: approvalProvider.pendingRequests.length,
                      itemBuilder: (context, index) {
                        final request = approvalProvider.pendingRequests[index];
                        return ListTile(
                          leading: const Icon(Icons.login),
                          title: Text('Login request for ${request.username}'),
                          subtitle: Text(
                            'Received: ${DateFormat('h:mm a').format(request.timestamp)}',
                          ),
                          trailing: ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => ApprovalScreen(request: request),
                                ),
                              );
                            },
                            child: const Text('View'),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
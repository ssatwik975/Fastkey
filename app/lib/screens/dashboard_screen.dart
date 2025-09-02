import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fastkey/providers/auth_provider.dart';
import 'package:fastkey/providers/approval_provider.dart';
import 'package:fastkey/screens/auth_screen.dart';
import 'package:fastkey/models/login_history.dart';
import 'package:fastkey/services/notification_service.dart';
import 'package:fastkey/screens/approval_screen.dart';
import 'package:fastkey/models/login_request.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    
    // IMMEDIATELY set up the callback - this is critical!
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setupLoginRequestHandler();
    });
  }

  void _setupLoginRequestHandler() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final approvalProvider = Provider.of<ApprovalProvider>(context, listen: false);
    
    print('🔧 Setting up login request handler in dashboard');
    
    // Set up the callback to connect socket service with approval provider
    authProvider.setLoginRequestCallback((LoginRequest loginRequest) {
      print('📱 Received login request in dashboard: ${loginRequest.sessionId}');
      approvalProvider.addLoginRequest(loginRequest);
    });
    
    // Refresh login history after callback is set
    authProvider.fetchLoginHistory();
    
    // Debug message to check if provider is working
    print('Approval provider has ${approvalProvider.pendingRequests.length} pending requests');
    
    // Check for notifications
    final notificationService = NotificationService();
    final sessionId = notificationService.getAndClearLatestPayload();
    
    if (sessionId != null) {
      // Handle the notification click
      final username = authProvider.user?.username;
      
      if (username != null) {
        // Create a login request and navigate to approval screen
        final loginRequest = LoginRequest(
          sessionId: sessionId,
          username: username,
          timestamp: DateTime.now(),
        );
        
        // Add a slight delay to ensure the screen is fully loaded
        Future.delayed(const Duration(milliseconds: 500), () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ApprovalScreen(request: loginRequest),
            ),
          );
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Dashboard'),
        elevation: 0,
        backgroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: () => _showLogoutDialog(context),
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign Out',
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          final user = authProvider.user;
          
          if (user == null) {
            return const Center(
              child: Text('User not authenticated'),
            );
          }
          
          return RefreshIndicator(
            onRefresh: () => authProvider.fetchLoginHistory(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Greeting card
                Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                  color: const Color(0xFF2563EB),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.waving_hand_rounded,
                              color: Colors.white,
                              size: 24,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Welcome, ${user.username}!',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Your account is secured with biometric authentication.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF30D158),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Active',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w500,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Pending requests
                Consumer<ApprovalProvider>(
                  builder: (context, approvalProvider, _) {
                    if (approvalProvider.hasPendingRequests) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Pending Approvals',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          ...approvalProvider.pendingRequests.map((request) {
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              color: const Color(0xFFFFF9C4),
                              child: ListTile(
                                leading: const CircleAvatar(
                                  backgroundColor: Color(0xFFFFB300),
                                  child: Icon(
                                    Icons.warning_amber_rounded,
                                    color: Colors.white,
                                  ),
                                ),
                                title: Text(
                                  'Login request from ${request.deviceInfo ?? 'unknown device'}',
                                ),
                                subtitle: Text(
                                  DateFormat('MMM d, h:mm a').format(request.timestamp),
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(
                                        Icons.cancel_outlined,
                                        color: Colors.red,
                                      ),
                                      onPressed: () {
                                        approvalProvider.denyLogin(request);
                                      },
                                    ),
                                    IconButton(
                                      icon: const Icon(
                                        Icons.check_circle_outline,
                                        color: Colors.green,
                                      ),
                                      onPressed: () {
                                        approvalProvider.approveLogin(request);
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                          const SizedBox(height: 16),
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                
                // Login history
                const Text(
                  'Login History',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                const SizedBox(height: 12),
                
                if (authProvider.isLoadingHistory)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (authProvider.loginHistory.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF2F2F7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.history_rounded,
                          size: 48,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No login history yet',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Your recent login activity will appear here',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: authProvider.loginHistory.length,
                    separatorBuilder: (context, index) => const Divider(),
                    itemBuilder: (context, index) {
                      final history = authProvider.loginHistory[index];
                      return _buildLoginHistoryItem(history);
                    },
                  ),
                
                const SizedBox(height: 24),
                
                // Security info
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
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.security_rounded,
                          color: Color(0xFF30D158),
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Your Security',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Your biometric data never leaves your device. FastKey uses FIDO2 standards to ensure security and privacy.',
                              style: TextStyle(
                                fontSize: 14,
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
          );
        },
      ),
    );
  }
  
  Widget _buildLoginHistoryItem(LoginHistory history) {
    final date = DateFormat('MMM d, yyyy').format(history.timestamp);
    final time = DateFormat('h:mm a').format(history.timestamp);
    
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: history.successful 
            ? const Color(0xFF30D158) 
            : const Color(0xFFFF3B30),
        child: Icon(
          history.successful ? Icons.check : Icons.close,
          color: Colors.white,
        ),
      ),
      title: Text(
        history.successful ? 'Successful login' : 'Failed login attempt',
        style: const TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text('Date: $date at $time'),
          if (history.deviceInfo != null)
            Text('Device: ${history.deviceInfo}'),
          if (history.location != null)
            Text('Location: ${history.location}'),
        ],
      ),
      isThreeLine: true,
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Provider.of<AuthProvider>(context, listen: false).logout();
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const AuthScreen()),
                (route) => false,
              );
            },
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}
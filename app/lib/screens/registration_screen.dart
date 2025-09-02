import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fastkey/screens/webview_registration_screen.dart';
import 'package:fastkey/services/api_service.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> 
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _focusNode = FocusNode();
  bool _isLoading = false;
  
  // User type selection
  UserType? _selectedUserType;
  bool _showUserTypeSelection = false;
  
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _animationController.forward();
    
    // Auto-focus username field after animation
    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _focusNode.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.close_rounded),
          style: IconButton.styleFrom(
            backgroundColor: Colors.white.withOpacity(0.9),
          ),
        ),
        title: Text(_showUserTypeSelection ? 'Complete Setup' : 'Get Started'),
        centerTitle: true,
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: SlideTransition(
          position: _slideAnimation,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: _showUserTypeSelection ? _buildUserTypeSelection() : _buildUsernameForm(),
          ),
        ),
      ),
    );
  }

  Widget _buildUsernameForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        
        // Header section
        Center(
          child: Column(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF007AFF), Color(0xFF5856D6)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.person_search_rounded,
                  size: 40,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 20),
              
              Text(
                'Enter Your Username',
                style: Theme.of(context).textTheme.displaySmall,
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'We\'ll check if you\'re a new or existing FastKey user',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF8E8E93),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 40),
        
        // Username form
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Username',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  
                  const SizedBox(height: 12),
                  
                  TextFormField(
                    controller: _usernameController,
                    focusNode: _focusNode,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _checkUsername(),
                    decoration: InputDecoration(
                      hintText: 'Enter your username',
                      prefixIcon: Icon(
                        Icons.person_outline_rounded,
                        color: const Color(0xFF8E8E93),
                      ),
                      suffixIcon: _usernameController.text.isNotEmpty
                          ? IconButton(
                              onPressed: () {
                                _usernameController.clear();
                                setState(() {});
                              },
                              icon: const Icon(
                                Icons.clear_rounded,
                                color: Color(0xFF8E8E93),
                              ),
                            )
                          : null,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter a username';
                      }
                      if (value.length < 3) {
                        return 'Username must be at least 3 characters';
                      }
                      if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(value)) {
                        return 'Username can only contain letters, numbers, and underscores';
                      }
                      return null;
                    },
                    onChanged: (value) => setState(() {}),
                  ),
                ],
              ),
            ),
          ),
        ),
        
        const SizedBox(height: 40),
        
        // Continue button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _checkUsername,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF007AFF),
              foregroundColor: Colors.white,
              disabledBackgroundColor: const Color(0xFFD1D1D6),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text('Continue'),
          ),
        ),
        
        const SizedBox(height: 20),
        
        // Info card
        _buildInfoCard(
          icon: Icons.privacy_tip_rounded,
          title: 'Secure & Private',
          description: 'Your biometric data stays on your device and is never shared with FastKey or any third party.',
          color: const Color(0xFF30D158),
        ),
      ],
    );
  }

  Widget _buildUserTypeSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        
        // Header
        Center(
          child: Column(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF007AFF), Color(0xFF5856D6)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.how_to_reg_rounded,
                  size: 40,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 20),
              
              Text(
                'Welcome, ${_usernameController.text}!',
                style: Theme.of(context).textTheme.displaySmall,
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'Choose how you want to proceed with FastKey',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF8E8E93),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 40),
        
        // User type options
        _buildUserTypeOption(
          type: UserType.newUser,
          icon: Icons.person_add_rounded,
          title: 'I\'m New to FastKey',
          subtitle: 'Create a new account with biometric authentication',
          description: 'You\'ll complete biometric setup in your browser, then return here to use FastKey.',
          gradient: const LinearGradient(
            colors: [Color(0xFF30D158), Color(0xFF32D74B)],
          ),
        ),
        
        const SizedBox(height: 16),
        
        _buildUserTypeOption(
          type: UserType.existingUser,
          icon: Icons.login_rounded,
          title: 'I Have a FastKey Account',
          subtitle: 'Add this device to my existing account',
          description: 'You\'ll verify your identity in your browser, then return here to complete device setup.',
          gradient: const LinearGradient(
            colors: [Color(0xFF007AFF), Color(0xFF5856D6)],
          ),
        ),
        
        const SizedBox(height: 40),
        
        // Important notice
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFF9F0A).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFFF9F0A).withOpacity(0.3),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFFF9F0A),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.info_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Browser Setup Required',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFFFF9F0A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'You\'ll need to complete the initial setup in your browser before using this mobile app.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF8E8E93),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 20),
        
        // Continue button (only show when selection is made)
        if (_selectedUserType != null) ...[
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _proceedWithUserType,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF007AFF),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFFD1D1D6),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.launch_rounded, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          _selectedUserType == UserType.newUser 
                              ? 'Open Browser to Create Account' 
                              : 'Open Browser to Add Device',
                        ),
                      ],
                    ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Back button
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () {
                setState(() {
                  _showUserTypeSelection = false;
                  _selectedUserType = null;
                });
              },
              child: const Text('Change Username'),
            ),
          ),
        ],
        
        const SizedBox(height: 20),
        
        // Security info
        _buildInfoCard(
          icon: Icons.security_rounded,
          title: 'Enterprise-Grade Security',
          description: 'FastKey uses FIDO2/WebAuthn standards with biometric verification for maximum security.',
          color: const Color(0xFF5856D6),
        ),
      ],
    );
  }

  Widget _buildUserTypeOption({
    required UserType type,
    required IconData icon,
    required String title,
    required String subtitle,
    required String description,
    required Gradient gradient,
  }) {
    final isSelected = _selectedUserType == type;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedUserType = type;
        });
        HapticFeedback.selectionClick();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.white.withOpacity(0.7),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF007AFF) : Colors.transparent,
            width: 2,
          ),
          boxShadow: isSelected 
              ? [
                  BoxShadow(
                    color: const Color(0xFF007AFF).withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: gradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isSelected ? const Color(0xFF1C1C1E) : const Color(0xFF3C3C43),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF8E8E93),
                        ),
                      ),
                    ],
                  ),
                ),
                if (isSelected)
                  Container(
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(
                      color: Color(0xFF007AFF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_rounded,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            Text(
              description,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: const Color(0xFF8E8E93),
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String description,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF8E8E93),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _checkUsername() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      // Check if username exists via API
      final apiService = ApiService();
      final response = await apiService.post(
        '/api/check-username',
        {'username': _usernameController.text.trim()},
      );
      
      if (response.success) {
        final exists = response.data['exists'] as bool? ?? false;
        
        setState(() {
          _isLoading = false;
          _showUserTypeSelection = true;
          // Pre-select based on username existence
          _selectedUserType = exists ? UserType.existingUser : UserType.newUser;
        });
        
        HapticFeedback.lightImpact();
      } else {
        _showErrorSnackBar('Failed to check username. Please try again.');
        setState(() => _isLoading = false);
      }
    } catch (e) {
      _showErrorSnackBar('Network error. Please check your connection.');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _proceedWithUserType() async {
    if (_selectedUserType == null) return;
    
    setState(() => _isLoading = true);
    
    try {
      HapticFeedback.lightImpact();
      
      if (mounted) {
        final isRegistration = _selectedUserType == UserType.newUser;
        
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => WebViewRegistrationScreen(
              username: _usernameController.text.trim(),
              isRegistration: isRegistration,
            ),
          ),
        );
      }
    } catch (e) {
      _showErrorSnackBar('Failed to proceed. Please try again.');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFFFF3B30),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}

enum UserType {
  newUser,
  existingUser,
}
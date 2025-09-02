import 'package:flutter/foundation.dart';
import 'package:fastkey/models/login_request.dart';
import 'package:fastkey/models/login_history.dart';
import 'package:fastkey/services/auth_service.dart';
import 'package:fastkey/services/api_service.dart';

class ApprovalProvider with ChangeNotifier {
  List<LoginRequest> _pendingRequests = [];
  bool _isProcessing = false;
  String? _errorMessage;

  final AuthService _authService = AuthService();
  final ApiService _apiService = ApiService();

  List<LoginRequest> get pendingRequests => _pendingRequests;
  bool get isProcessing => _isProcessing;
  String? get errorMessage => _errorMessage;
  bool get hasPendingRequests => _pendingRequests.isNotEmpty;

  void addLoginRequest(LoginRequest request) {
    // Check if request with same sessionId already exists
    final existingIndex = _pendingRequests.indexWhere(
      (r) => r.sessionId == request.sessionId
    );
    
    if (existingIndex >= 0) {
      // Update existing request
      _pendingRequests[existingIndex] = request;
    } else {
      // Add new request
      _pendingRequests.add(request);
    }
    
    notifyListeners();
  }

  void removeLoginRequest(String sessionId) {
    _pendingRequests.removeWhere((request) => request.sessionId == sessionId);
    notifyListeners();
  }

  Future<bool> approveLogin(LoginRequest request) async {
    _isProcessing = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _authService.approveLogin(
        sessionId: request.sessionId,
        username: request.username,
      );

      if (result.success) {
        request.approved = true;
        
        // Save to login history
        await _saveToLoginHistory(request, true);
        
        removeLoginRequest(request.sessionId);
        _isProcessing = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result.errorMessage ?? 'Approval failed';
        _isProcessing = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isProcessing = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> denyLogin(LoginRequest request) async {
    request.denied = true;
    
    // Save to login history as denied
    await _saveToLoginHistory(request, false);
    
    removeLoginRequest(request.sessionId);
    notifyListeners();
  }

  Future<void> _saveToLoginHistory(LoginRequest request, bool successful) async {
    try {
      final history = LoginHistory.fromLoginRequest(request, successful);
      
      // Save to API/database (you might want to implement this endpoint)
      await _apiService.saveLoginHistory(history);
      
      print('Login history saved: ${request.sessionId} - ${successful ? 'approved' : 'denied'}');
    } catch (e) {
      print('Failed to save login history: $e');
      // Don't throw error as this is not critical
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
import 'package:flutter/foundation.dart';
import 'package:fastkey/models/login_request.dart';
import 'package:fastkey/services/auth_service.dart';

class ApprovalProvider with ChangeNotifier {
  List<LoginRequest> _pendingRequests = [];
  bool _isProcessing = false;
  String? _errorMessage;

  final AuthService _authService = AuthService();

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

  void denyLogin(LoginRequest request) {
    request.denied = true;
    removeLoginRequest(request.sessionId);
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
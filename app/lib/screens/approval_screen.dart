import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fastkey/models/login_request.dart';
import 'package:fastkey/providers/approval_provider.dart';
import 'package:fastkey/widgets/primary_button.dart';

class ApprovalScreen extends StatefulWidget {
  final LoginRequest request;

  const ApprovalScreen({
    super.key,
    required this.request,
  });

  @override
  State<ApprovalScreen> createState() => _ApprovalScreenState();
}

class _ApprovalScreenState extends State<ApprovalScreen> {
  bool _isProcessing = false;

  Future<void> _handleApprove() async {
    setState(() {
      _isProcessing = true;
    });

    final approvalProvider = Provider.of<ApprovalProvider>(context, listen: false);
    final success = await approvalProvider.approveLogin(widget.request);
    
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Login approved successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      } else {
        setState(() {
          _isProcessing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(approvalProvider.errorMessage ?? 'Failed to approve login'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _handleDeny() {
    final approvalProvider = Provider.of<ApprovalProvider>(context, listen: false);
    approvalProvider.denyLogin(widget.request);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login Request'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(
              Icons.login,
              size: 64,
              color: Color(0xFF2563EB),
            ),
            const SizedBox(height: 24),
            const Text(
              'Login Request',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Someone is trying to log in as ${widget.request.username}',
              style: const TextStyle(
                fontSize: 16,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            
            // Request details
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailRow(
                    'Username:',
                    widget.request.username,
                  ),
                  const SizedBox(height: 8),
                  _buildDetailRow(
                    'Time:',
                    DateFormat('MMM d, yyyy h:mm a').format(widget.request.timestamp),
                  ),
                  const SizedBox(height: 8),
                  _buildDetailRow(
                    'Device:',
                    widget.request.deviceInfo ?? 'Unknown device',
                  ),
                ],
              ),
            ),
            
            const Spacer(),
            
            // Buttons
            PrimaryButton(
              onPressed: _isProcessing ? null : _handleApprove,
              text: 'Approve Login',
              isLoading: _isProcessing,
              color: Colors.green,
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: _isProcessing ? null : _handleDeny,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Deny Login',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: Colors.black87,
            ),
          ),
        ),
      ],
    );
  }
}
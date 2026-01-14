import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/screens.dart';

class AppRouter {
  static final _rootNavigatorKey = GlobalKey<NavigatorState>();

  static GoRouter router(AuthProvider authProvider) {
    return GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: '/splash',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isLoggedIn = authProvider.isAuthenticated;
        final isLoggingIn = state.matchedLocation == '/login';
        final isSplash = state.matchedLocation == '/splash';

        // If on splash screen, let it handle its own redirect
        if (isSplash) return null;

        // If not logged in, redirect to login
        if (!isLoggedIn && !isLoggingIn) {
          return '/login';
        }

        // If logged in and trying to access login, redirect to home
        if (isLoggedIn && isLoggingIn) {
          return '/';
        }

        return null;
      },
      routes: [
        // Splash screen
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashScreen(),
        ),

        // Login
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),

        // Home (with bottom navigation)
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeScreen(),
        ),
      ],
    );
  }
}

// Splash Screen
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated) {
        context.go('/');
      } else {
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.diamond_outlined,
                size: 60,
                color: Theme.of(context).primaryColor,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'POS Emas',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).primaryColor,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

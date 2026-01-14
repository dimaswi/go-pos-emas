import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

class AppProvider with ChangeNotifier {
  final LocationService _locationService = LocationService();
  final GoldCategoryService _goldCategoryService = GoldCategoryService();
  final StorageService _storageService = StorageService();

  // Current location
  Location? _currentLocation;
  Location? get currentLocation => _currentLocation;

  // All locations
  List<Location> _locations = [];
  List<Location> get locations => _locations;

  // Gold categories
  List<GoldCategory> _goldCategories = [];
  List<GoldCategory> get goldCategories => _goldCategories;

  // Loading state
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // Initialize app data
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Load locations
      _locations = await _locationService.getLocations(isActive: true);

      // Load saved location ID
      final savedLocationId = await _storageService.getSelectedLocationId();
      if (savedLocationId != null && _locations.isNotEmpty) {
        _currentLocation = _locations.firstWhere(
          (loc) => loc.id == savedLocationId,
          orElse: () => _locations.first,
        );
      } else if (_locations.isNotEmpty) {
        _currentLocation = _locations.first;
      }

      // Load gold categories
      _goldCategories = await _goldCategoryService.getGoldCategories(isActive: true);
    } catch (e) {
      debugPrint('Error initializing app: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  // Set current location
  Future<void> setCurrentLocation(Location location) async {
    _currentLocation = location;
    await _storageService.saveSelectedLocationId(location.id);
    notifyListeners();
  }

  // Refresh locations
  Future<void> refreshLocations() async {
    try {
      _locations = await _locationService.getLocations(isActive: true);
      notifyListeners();
    } catch (e) {
      debugPrint('Error refreshing locations: $e');
    }
  }

  // Refresh gold categories
  Future<void> refreshGoldCategories() async {
    try {
      _goldCategories = await _goldCategoryService.getGoldCategories(isActive: true);
      notifyListeners();
    } catch (e) {
      debugPrint('Error refreshing gold categories: $e');
    }
  }

  // Get gold category by ID
  GoldCategory? getGoldCategoryById(int id) {
    try {
      return _goldCategories.firstWhere((cat) => cat.id == id);
    } catch (e) {
      return null;
    }
  }

  // Get location by ID
  Location? getLocationById(int id) {
    try {
      return _locations.firstWhere((loc) => loc.id == id);
    } catch (e) {
      return null;
    }
  }
}

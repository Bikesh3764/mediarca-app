// Lightweight mock for React Native and Expo native modules when running in Node.js
const Module = require('module');
const originalRequire = Module.prototype.require;

const secureStoreMemory = new Map();

Module.prototype.require = function (id) {
  if (id === 'react-native') {
    return {
      Platform: {
        OS: 'android',
        select: (obj) => obj.android ?? obj.default ?? obj.ios ?? obj.web,
      },
      StyleSheet: {
        create: (styles) => styles,
        hairlineWidth: 1,
      },
      View: 'View',
      Text: 'Text',
      TouchableOpacity: 'TouchableOpacity',
      TextInput: 'TextInput',
      ActivityIndicator: 'ActivityIndicator',
      Alert: {
        alert: () => {},
      },
      Keyboard: {
        dismiss: () => {},
      },
      Linking: {
        openURL: async () => {},
        canOpenURL: async () => true,
      },
      AppState: {
        currentState: 'active',
        addEventListener: () => ({ remove: () => {} }),
      },
      Animated: {
        Value: class {
          constructor(val) { this._val = val; }
          setValue(val) { this._val = val; }
          interpolate() { return this; }
        },
        timing: () => ({ start: (cb) => cb && cb({ finished: true }) }),
        loop: () => ({ start: () => {}, stop: () => {} }),
        sequence: () => ({ start: () => {} }),
      },
      Modal: 'Modal',
      RefreshControl: 'RefreshControl',
      ScrollView: 'ScrollView',
      Pressable: 'Pressable',
    };
  }

  if (id === 'expo-camera') {
    return {
      CameraView: 'CameraView',
      useCameraPermissions: () => [{ granted: true, canAskAgain: true }, async () => ({ granted: true })],
    };
  }

  if (id === 'expo-haptics') {
    return {
      notificationAsync: async () => {},
      impactAsync: async () => {},
      NotificationFeedbackType: {
        Success: 'success',
        Warning: 'warning',
        Error: 'error',
      },
      ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
      },
    };
  }

  if (id === 'expo-secure-store') {
    return {
      isAvailableAsync: async () => true,
      getItemAsync: async (key) => (secureStoreMemory.has(key) ? secureStoreMemory.get(key) : null),
      setItemAsync: async (key, val) => {
        secureStoreMemory.set(key, String(val));
      },
      deleteItemAsync: async (key) => {
        secureStoreMemory.delete(key);
      },
      AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
      _clearAll: () => secureStoreMemory.clear(),
    };
  }

  if (id === 'expo-router') {
    return {
      router: {
        replace: () => {},
        push: () => {},
        back: () => {},
      },
      useRouter: () => ({
        replace: () => {},
        push: () => {},
        back: () => {},
      }),
      useLocalSearchParams: () => ({}),
    };
  }

  return originalRequire.apply(this, arguments);
};

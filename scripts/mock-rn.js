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

  return originalRequire.apply(this, arguments);
};

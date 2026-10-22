// Lightweight mock for React Native when running in Node.js
const Module = require('module');
const originalRequire = Module.prototype.require;

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
    };
  }
  return originalRequire.apply(this, arguments);
};

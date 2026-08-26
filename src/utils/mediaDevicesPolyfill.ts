/**
 * Comprehensive polyfill / shim for navigator.mediaDevices in web environments.
 * Prevents "undefined is not an object (evaluating 'navigator.mediaDevices.getUserMedia')"
 * and "undefined is not an object (evaluating 'navigator.mediaDevices.enumerateDevices')"
 * when running over insecure HTTP (e.g. LAN IP http://192.168.x.x:8081) or in unsupported webviews.
 */

function installMediaDevicesPolyfill() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  try {
    const legacyGetUserMedia =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;

    const dummyMediaDevices = {
      getUserMedia: (constraints: any) => {
        if (legacyGetUserMedia) {
          return new Promise((resolve, reject) => {
            legacyGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
        return Promise.reject(
          new Error('Camera access is not supported or requires a Secure Context (HTTPS or http://localhost).')
        );
      },
      enumerateDevices: async () => [],
      getSupportedConstraints: () => ({}),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      ondevicechange: null,
    };

    if (!navigator.mediaDevices) {
      try {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: dummyMediaDevices,
          configurable: true,
          writable: true,
          enumerable: true,
        });
      } catch (err) {
        try {
          const proto =
            Object.getPrototypeOf(navigator) ||
            (typeof Navigator !== 'undefined' ? Navigator.prototype : null);
          if (proto) {
            Object.defineProperty(proto, 'mediaDevices', {
              get: () => dummyMediaDevices,
              configurable: true,
              enumerable: true,
            });
          }
        } catch (err2) {
          try {
            (navigator as any).mediaDevices = dummyMediaDevices;
          } catch (err3) {}
        }
      }
    } else {
      // mediaDevices exists, ensure methods exist to prevent property undefined crashes
      const md = navigator.mediaDevices as any;
      if (typeof md.getUserMedia !== 'function') {
        try {
          md.getUserMedia = dummyMediaDevices.getUserMedia;
        } catch (e) {}
      }
      if (typeof md.enumerateDevices !== 'function') {
        try {
          md.enumerateDevices = dummyMediaDevices.enumerateDevices;
        } catch (e) {}
      }
      if (typeof md.getSupportedConstraints !== 'function') {
        try {
          md.getSupportedConstraints = dummyMediaDevices.getSupportedConstraints;
        } catch (e) {}
      }
    }
  } catch (globalErr) {
    // Graceful silence on strict security wrappers
  }
}

// Run immediately
installMediaDevicesPolyfill();

export function isWebCameraAvailable(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  // If explicitly insecure context (e.g. http://192.168.x.x), camera APIs are disabled by modern browsers
  if (typeof window.isSecureContext === 'boolean' && !window.isSecureContext) {
    return false;
  }
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof navigator.mediaDevices.enumerateDevices === 'function'
  );
}

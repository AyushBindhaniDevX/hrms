import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Polyfill navigator.mediaDevices before any bundle executes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof navigator !== 'undefined') {
                    var dummyMediaDevices = {
                      getUserMedia: function(c) {
                        return new Promise(function(res, rej) {
                          var legacy = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
                          if (legacy) {
                            legacy.call(navigator, c, res, rej);
                          } else {
                            rej(new Error('Camera access requires HTTPS or localhost in modern browsers.'));
                          }
                        });
                      },
                      enumerateDevices: function() { return Promise.resolve([]); },
                      getSupportedConstraints: function() { return {}; },
                      addEventListener: function() {},
                      removeEventListener: function() {},
                      dispatchEvent: function() { return false; },
                      ondevicechange: null
                    };

                    if (!navigator.mediaDevices) {
                      try {
                        Object.defineProperty(navigator, 'mediaDevices', {
                          value: dummyMediaDevices,
                          configurable: true,
                          writable: true,
                          enumerable: true
                        });
                      } catch (e) {
                        try {
                          var proto = Object.getPrototypeOf(navigator) || (typeof Navigator !== 'undefined' ? Navigator.prototype : null);
                          if (proto) {
                            Object.defineProperty(proto, 'mediaDevices', {
                              get: function() { return dummyMediaDevices; },
                              configurable: true,
                              enumerable: true
                            });
                          }
                        } catch (e2) {
                          navigator.mediaDevices = dummyMediaDevices;
                        }
                      }
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

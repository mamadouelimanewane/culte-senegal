import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';

const SITE_URL = 'https://culte.vercel.app/';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle Android physical back button behavior
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }
  }, [canGoBack]);

  // Inject JavaScript to refine the mobile experience
  // For example, disable selection, set viewport metadata, etc.
  const injectedJS = `
    (function() {
      // Disable long press context menu
      document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
      
      // Ensure viewport is correct for mobile scaling
      if (!document.querySelector('meta[name="viewport"]')) {
        var meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
      }
      
      // Post a message when the core app is loaded
      window.ReactNativeWebView.postMessage('loaded');
    })();
    true; // note: last expression must evaluate to something truthy
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0a3d6b" barStyle="light-content" />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#48cae4" />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: SITE_URL }}
        style={styles.webview}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onLoadEnd={() => setIsLoading(false)}
        injectedJavaScript={injectedJS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true} // Allow Leaflet location features
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures={true}
        startInLoadingState={false}
        cacheEnabled={true}
        mixedContentMode="compatibility" // For some older images or scripts
        allowFileAccess={true}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a3d6b', // Matches Scenews primary theme
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a3d6b',
    zIndex: 10,
  },
});

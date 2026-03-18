import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';

const SITE_URL = 'https://culte.vercel.app/';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackBtn, setShowBackBtn] = useState(false);
  const backBtnOpacity = useRef(new Animated.Value(0)).current;

  // Animate back button visibility
  useEffect(() => {
    Animated.timing(backBtnOpacity, {
      toValue: showBackBtn ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showBackBtn]);

  // Handle Android physical back button
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current) {
        // Envoyer un message au WebView pour gérer le retour interne
        webViewRef.current.injectJavaScript(`
          (function() {
            var handled = false;
            // 1. Si un modal est ouvert, le fermer
            var modal = document.getElementById('modal');
            if (modal && !modal.classList.contains('hidden')) {
              if (typeof closeModal === 'function') closeModal();
              handled = true;
            }
            // 2. Sinon, utiliser l'historique de navigation interne
            if (!handled && typeof navHandleBack === 'function') {
              handled = navHandleBack();
            }
            // 3. Sinon, retourner à Home
            if (!handled) {
              var activeTab = document.querySelector('.tab-section.active');
              if (activeTab && activeTab.id !== 'tab-home' && typeof switchTab === 'function') {
                switchTab('home');
                handled = true;
              }
            }
            // Notifier React Native du résultat
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'backHandled',
              handled: handled
            }));
          })();
          true;
        `);
        return true; // Toujours intercepter pour attendre la réponse
      }
      return false;
    };

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }
  }, []);

  // Handle messages from WebView
  const onMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navState') {
        // Le WebView nous dit s'il y a un historique interne
        setShowBackBtn(data.canGoBack);
      } else if (data.type === 'backHandled') {
        if (!data.handled) {
          // Rien à faire dans le WebView, laisser l'OS gérer (quitter)
          BackHandler.exitApp();
        }
      }
    } catch (e) {
      // Message texte simple (ex: 'loaded')
      if (event.nativeEvent.data === 'loaded') {
        setIsLoading(false);
      }
    }
  }, []);

  // Bouton retour visuel
  const handleBackPress = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          var modal = document.getElementById('modal');
          if (modal && !modal.classList.contains('hidden')) {
            if (typeof closeModal === 'function') closeModal();
          } else if (typeof navHandleBack === 'function') {
            navHandleBack();
          }
        })();
        true;
      `);
    }
  }, []);

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

      // Observer les changements de navigation pour informer React Native
      var _origSwitchTab = typeof switchTab === 'function' ? switchTab : null;
      var _checkNav = function() {
        var activeTab = document.querySelector('.tab-section.active');
        var tabId = activeTab ? activeTab.id.replace('tab-', '') : 'home';
        var modalOpen = !document.getElementById('modal').classList.contains('hidden');
        var canGoBack = tabId !== 'home' || modalOpen || (typeof navHistory !== 'undefined' && navHistory.length > 0);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'navState',
          canGoBack: canGoBack,
          currentTab: tabId,
          modalOpen: modalOpen
        }));
      };

      // Vérifier l'état de navigation périodiquement et après les interactions
      setInterval(_checkNav, 500);
      document.addEventListener('click', function() { setTimeout(_checkNav, 300); });

      // Post a message when the core app is loaded
      window.ReactNativeWebView.postMessage('loaded');
    })();
    true;
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
        onMessage={onMessage}
        injectedJavaScript={injectedJS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures={true}
        startInLoadingState={false}
        cacheEnabled={true}
        mixedContentMode="compatibility"
        allowFileAccess={true}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      />

      {/* Bouton flottant retour arrière — visible quand on n'est pas sur Home */}
      <Animated.View style={[styles.backButtonContainer, { opacity: backBtnOpacity }]} pointerEvents={showBackBtn ? 'auto' : 'none'}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a3d6b',
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
  backButtonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 61, 107, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(72, 202, 228, 0.4)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 61, 107, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(72, 202, 228, 0.5)',
  },
  backButtonText: {
    color: '#48cae4',
    fontSize: 24,
    fontWeight: '700',
    marginTop: -2,
  },
});

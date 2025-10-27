/**
 * Obtiene el App ID correcto de AdMob según el entorno (APP_ENV)
 * - development: Usa IDs de test de Google
 * - production: Usa IDs reales de producción
 */
function getAdMobAppId(platform) {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';

  if (appEnv === 'production') {
    // Producción - usar IDs reales
    if (platform === 'ios') {
      return process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD || 'ca-app-pub-9521354088644356~4323532279';
    } else {
      return process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD || 'ca-app-pub-9521354088644356~6949695611';
    }
  } else {
    // Development/Test - usar IDs de test de Google
    if (platform === 'ios') {
      return process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID_TEST || 'ca-app-pub-3940256099942544~1458002511';
    } else {
      return process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_TEST || 'ca-app-pub-3940256099942544~3347511713';
    }
  }
}

module.exports = {
  expo: {
    name: "OscuraMente - Psycho Tests",
    slug: "oscuramente",
    version: "1.0.7",
    orientation: "portrait",
    icon: "./assets/images/oscuramente-icon.png",
    scheme: "oscuramente",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/oscuramente-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0D0D0D"
    },
    extra: {
      eas: {
        projectId: "23e592fc-2da8-42d3-91eb-1f36d1179814"
      }
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.psicologiaoscura.darkpsychology",
      buildNumber: "7",
      infoPlist: {
        NSCameraUsageDescription: "Necesitamos acceso a tu cámara para actualizar tu foto de perfil",
        NSPhotoLibraryUsageDescription: "Necesitamos acceso a tu galería para seleccionar tu foto de perfil",
        NSUserTrackingUsageDescription: "Usamos esto para personalizar anuncios y mejorar tu experiencia"
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.psicologiaoscura.darkpsychology",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/images/oscuramente-icon.png",
        backgroundColor: "#0D0D0D"
      },
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-camera",
        {
          cameraPermission: "Necesitamos acceso a tu cámara para actualizar tu foto de perfil"
        }
      ],
      [
        "expo-tracking-transparency",
        {
          userTrackingPermission: "Usamos esto para personalizar anuncios y mejorar tu experiencia"
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: getAdMobAppId('android'),
          iosAppId: getAdMobAppId('ios'),
          sk_ad_network_items: [
            "cstr6suwn9.skadnetwork",
            "4fzdc2evr5.skadnetwork",
            "4pfyvq9l8r.skadnetwork",
            "2fnua5tdw4.skadnetwork",
            "ydx93a7ass.skadnetwork",
            "5a6flpkh64.skadnetwork",
            "p78axxw29g.skadnetwork",
            "v72qych5uu.skadnetwork",
            "ludvb6z3bs.skadnetwork",
            "cp8zw746q7.skadnetwork",
            "3sh42y64q3.skadnetwork",
            "c6k4g5qg8m.skadnetwork",
            "s39g8k73mm.skadnetwork",
            "3qy4746246.skadnetwork",
            "f38h382jlk.skadnetwork",
            "hs6bdukanm.skadnetwork",
            "v4nxqhlyqp.skadnetwork",
            "wzmmz9fp6w.skadnetwork",
            "yclnxrl5pm.skadnetwork",
            "t38b2kh725.skadnetwork",
            "7ug5zh24hu.skadnetwork",
            "gta9lk7p23.skadnetwork",
            "vutu7akeur.skadnetwork",
            "y5ghdn5j9k.skadnetwork",
            "n6fk4nfna4.skadnetwork",
            "v9wttpbfk9.skadnetwork",
            "n38lu8286q.skadnetwork",
            "47vhws6wlr.skadnetwork",
            "kbd757ywx3.skadnetwork",
            "9t245vhmpl.skadnetwork",
            "a2p9lx4jpn.skadnetwork",
            "22mmun2rn5.skadnetwork",
            "4468km3ulz.skadnetwork",
            "2u9pt9hc89.skadnetwork",
            "8s468mfl3y.skadnetwork",
            "klf5c3l5u5.skadnetwork",
            "ppxm28t8ap.skadnetwork",
            "ecpz2srf59.skadnetwork",
            "uw77j35x4d.skadnetwork",
            "pwa73g5rt2.skadnetwork",
            "mlmmfzh3r3.skadnetwork",
            "578prtvx9j.skadnetwork",
            "4dzt52r2t5.skadnetwork",
            "e5fvkxwrpn.skadnetwork",
            "8c4e2ghe7u.skadnetwork",
            "zq492l623r.skadnetwork",
            "3rd42ekr43.skadnetwork",
            "3qcr597p9d.skadnetwork"
          ]
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};

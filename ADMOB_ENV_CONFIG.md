# Configuración de AdMob por Entorno

Este documento explica cómo configurar los IDs de AdMob para diferentes entornos usando la variable `APP_ENV`.

## 🎯 Resumen

El proyecto usa diferentes IDs de AdMob dependiendo del valor de `EXPO_PUBLIC_APP_ENV`:

- **`development`**: Usa IDs de test oficiales de Google (para desarrollo local, TestFlight, Internal Testing)
- **`production`**: Usa tus IDs reales de AdMob (para App Store y Google Play oficiales)

## 📋 IDs Configurados

### IDs de TEST (Google oficial)
```bash
# iOS
EXPO_PUBLIC_ADMOB_IOS_APP_ID_TEST=ca-app-pub-3940256099942544~1458002511
EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_TEST=ca-app-pub-3940256099942544/1712485313

# Android
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_TEST=ca-app-pub-3940256099942544~3347511713
EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_TEST=ca-app-pub-3940256099942544/5224354917
```

### IDs de PRODUCCIÓN (Tus IDs reales)
```bash
# iOS
EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD=ca-app-pub-9521354088644356~4323532279
EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD=ca-app-pub-9521354088644356/8741181635

# Android
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD=ca-app-pub-9521354088644356~6949695611
EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD=ca-app-pub-9521354088644356/9384287265
```

## 🔧 Configuración Local (Desarrollo)

En tu archivo `.env` local, mantén:

```bash
EXPO_PUBLIC_APP_ENV=development
```

Esto usará los IDs de test de Google para desarrollo local.

## 🚀 Configuración para EAS Build

### 1. Para TestFlight / Internal Testing (iOS/Android)

**Usa IDs de TEST para evitar clics inválidos en AdMob:**

```bash
# Configurar el secret para development
eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value development --type string

# Configurar todos los IDs de TEST
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_IOS_APP_ID_TEST --value ca-app-pub-3940256099942544~1458002511 --type string
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_TEST --value ca-app-pub-3940256099942544/1712485313 --type string
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_TEST --value ca-app-pub-3940256099942544~3347511713 --type string
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_TEST --value ca-app-pub-3940256099942544/5224354917 --type string
```

**En tu `eas.json`, configuración para preview/development:**

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "development"
      }
    }
  }
}
```

### 2. Para App Store / Google Play (Producción)

**Usa IDs REALES para la versión oficial publicada:**

```bash
# Cambiar el secret a production
eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value production --type string --force

# Configurar todos los IDs de PRODUCCIÓN
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_IOS_APP_ID_PROD --value ca-app-pub-9521354088644356~4323532279 --type string
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD --value ca-app-pub-9521354088644356/8741181635 --type string
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_ANDROID_APP_ID_PROD --value ca-app-pub-9521354088644356~6949695611 --type string
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD --value ca-app-pub-9521354088644356/9384287265 --type string
```

**En tu `eas.json`, configuración para producción:**

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  }
}
```

## 📱 Flujo de Trabajo Recomendado

### Para desarrollo y testing (TestFlight, Internal Testing):

1. **Configura `APP_ENV=development`**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value development --type string --force
   ```

2. **Ejecuta el build:**
   ```bash
   # Para iOS (TestFlight)
   eas build --profile preview --platform ios

   # Para Android (Internal Testing)
   eas build --profile preview --platform android
   ```

3. **Resultado:**
   - La app usará los IDs de test de Google
   - Los anuncios mostrarán contenido de prueba
   - No afectará las métricas de tu cuenta real de AdMob
   - Seguro para testing interno y beta testing

### Para publicación oficial (App Store, Google Play):

1. **Cambia a `APP_ENV=production`**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value production --type string --force
   ```

2. **Ejecuta el build de producción:**
   ```bash
   # Para iOS (App Store)
   eas build --profile production --platform ios

   # Para Android (Play Store)
   eas build --profile production --platform android
   ```

3. **Resultado:**
   - La app usará tus IDs reales de AdMob
   - Los anuncios generarán ingresos reales
   - Las métricas se registrarán en tu cuenta de AdMob

## ✅ Verificación

Para verificar qué IDs se están usando, revisa los logs de la app al iniciar:

```
[AdsManager] AdMob Configuration
============================================================
APP_ENV: development  (o production)
Platform: ios (o android)
Will use PRODUCTION IDs: false  (o true)

🛠️ TEST IDs (Google oficial):  (o 📱 PRODUCTION IDs:)
iOS App ID: ca-app-pub-3940256099942544...
iOS Rewarded: ca-app-pub-3940256099942544...
...
============================================================
```

## 🔒 Seguridad

- ✅ Los IDs de test son públicos y seguros de compartir
- ✅ Los IDs de producción son públicos pero deben usarse solo en builds oficiales
- ✅ Nunca expongas las API keys de RevenueCat u otras credenciales sensibles
- ✅ Usa EAS Secrets para manejar todas las configuraciones de producción

## 🆘 Solución de Problemas

### Los anuncios no se muestran en TestFlight
- Verifica que `APP_ENV=development` esté configurado
- Verifica que los IDs de test estén correctamente configurados en EAS Secrets
- Los anuncios de test pueden tardar unos segundos en cargar

### Los anuncios de test aparecen en producción
- Verifica que `APP_ENV=production` esté configurado en EAS Secrets
- Reconstruye la app con el perfil de producción
- Verifica los logs para confirmar que dice "Will use PRODUCTION IDs: true"

### Error: "Ad unit ID not configured"
- Asegúrate de que todos los secrets de AdMob estén configurados en EAS
- Verifica que los nombres de las variables sean exactos
- Usa `eas secret:list` para ver todos los secrets configurados

## 📚 Recursos

- [Documentación de EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [IDs de Test de AdMob](https://developers.google.com/admob/ios/test-ads)
- [Configuración de AdMob](https://admob.google.com/)

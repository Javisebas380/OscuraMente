# Guía de Google AdMob en TestFlight y Producción

Esta guía explica cómo funcionan los anuncios de Google AdMob en diferentes entornos de la aplicación OscuraMente.

## Resumen Ejecutivo

**IMPORTANTE:** Los anuncios de producción de Google AdMob **NO** funcionan en TestFlight para apps nuevas de iOS. Solo funcionarán después de que la app esté publicada en el App Store.

## Comportamiento de Anuncios por Entorno

### 1. Desarrollo Local (`__DEV__ = true`)

**Qué sucede:**
- Se usan IDs de test de Google AdMob
- Los anuncios de test aparecen inmediatamente
- No hay restricciones ni limitaciones

**ID usado:** `ca-app-pub-3940256099942544/5224354917` (Test ID de Google)

**Logs que verás:**
```
Environment: development
Using TEST ad unit ID for development environment
```

### 2. TestFlight (`__DEV__ = false`, build de prueba)

**Qué sucede:**
- La app detecta automáticamente que está en TestFlight
- Se usan IDs de test de Google AdMob (no IDs de producción)
- Los anuncios de test aparecen normalmente
- **NUNCA** se muestran anuncios de producción en TestFlight

**Por qué:**
- Google AdMob requiere que la app esté publicada en App Store
- Es una restricción de Google, no un error de configuración
- Previene fraude y clics inválidos durante pruebas

**ID usado:** `ca-app-pub-3940256099942544/5224354917` (Test ID de Google)

**Logs que verás:**
```
⚠️  TestFlight Build Detected
Using TEST ad unit IDs
Production ads will not show until published to App Store
```

### 3. App Store (producción publicada)

**Qué sucede:**
- Se usan tus IDs de anuncios de producción reales
- Los anuncios reales de Google se muestran
- Generas ingresos reales por visualizaciones

**IDs usados:**
- iOS: `EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD`
- Android: `EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD`

**Logs que verás:**
```
✅ App Store Production Build
Using PRODUCTION ad unit IDs
```

## Detección Automática de Entorno

La app detecta automáticamente en qué entorno está ejecutándose:

```typescript
// src/utils/environment.ts
export function getEnvironment(): 'expo-go' | 'development' | 'testflight' | 'production'
```

### Cómo Funciona la Detección de TestFlight

1. **Verifica el canal de updates de Expo:**
   - Si existe un canal `production` o `prod`: Es App Store
   - Si no hay canal configurado: Es TestFlight

2. **Verifica `__DEV__`:**
   - Si `__DEV__ = false` y no hay canal de producción: Es TestFlight
   - Si `__DEV__ = true`: Es desarrollo local

## Permisos de Tracking (iOS 14+)

### Implementación Automática

La app solicita automáticamente el permiso de tracking en iOS al iniciar:

```typescript
// app/_layout.tsx
await TrackingTransparency.requestTrackingPermissionsAsync();
```

### Estados del Permiso

- **Granted:** Anuncios personalizados, mejores tasas de llenado
- **Denied:** Anuncios no personalizados, puede haber menos anuncios disponibles
- **Not Determined:** El usuario no ha decidido aún

### Configuración en Info.plist

```xml
<key>NSUserTrackingUsageDescription</key>
<string>Usamos esto para personalizar anuncios y mejorar tu experiencia</string>
```

## Solución de Problemas

### "No aparecen anuncios en TestFlight"

**Esto es NORMAL y ESPERADO.** No es un error. Revisa los logs:

```bash
# Conecta tu dispositivo y ejecuta:
npx react-native log-ios    # Para iOS
npx react-native log-android # Para Android
```

Busca:
```
============================================================
[AdsManager] AdMob Configuration
============================================================
Environment: testflight
⚠️  TestFlight Build Detected
Using TEST ad unit IDs
```

Si ves estos logs, todo está funcionando correctamente.

### "Los anuncios de test aparecen pero son diferentes"

Los anuncios de test de Google tienen un diseño distintivo:
- Fondo verde o azul brillante
- Texto "Test Ad" visible
- Diferentes creatividades que los anuncios reales

Esto es correcto y esperado.

### "Error al cargar anuncio en TestFlight"

Verifica:

1. **Conexión a Internet:** Los anuncios requieren conexión
2. **AdMob App ID configurado:** Revisa `app.config.js`
3. **Permisos de tracking:** Asegúrate de otorgar permiso cuando se solicite

## Checklist Antes de Publicar en App Store

### 1. Verificar IDs de AdMob en `.env`

```bash
# Verifica que estos valores estén configurados:
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

### 2. Configurar EAS Secrets

```bash
# iOS App ID
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_IOS_APP_ID --value "ca-app-pub-XXX~XXX"

# iOS Rewarded Ad ID
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS_PROD --value "ca-app-pub-XXX/XXX"

# Android App ID
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_ANDROID_APP_ID --value "ca-app-pub-XXX~XXX"

# Android Rewarded Ad ID
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID_PROD --value "ca-app-pub-XXX/XXX"
```

### 3. Vincular App en Consola de AdMob

1. Ve a [AdMob Console](https://apps.admob.com/)
2. Navega a tu app iOS/Android
3. En **Configuración de App** → **Detalles de la app**
4. Vincula tu Bundle ID de iOS: `com.psicologiaoscura.darkpsychology`
5. Vincula tu Package Name de Android: `com.psicologiaoscura.darkpsychology`

### 4. Configurar Canal de Producción (Opcional)

Para diferenciar explícitamente entre TestFlight y App Store:

```javascript
// app.config.js
{
  updates: {
    channel: 'production'
  }
}
```

Luego ejecuta:
```bash
eas update --channel production
```

### 5. Probar Permisos de Tracking

En un dispositivo iOS real:
1. Instala la build de TestFlight
2. Abre la app
3. Debe aparecer el diálogo de tracking
4. Otorga o niega el permiso
5. Verifica que los anuncios de test aparezcan

## Tiempos de Espera Esperados

### Para Apps Nuevas en AdMob

Después de crear unidades de anuncios en AdMob:
- **Mínimo:** 1 hora
- **Típico:** 4-6 horas
- **Máximo:** 24-48 horas

### Después de Publicar en App Store

- **Primeros anuncios:** 1-2 horas después de publicación
- **Tasa de llenado completa:** 2-7 días
- **Optimización de CPM:** 2-4 semanas

## Logs de Debugging

La app genera logs detallados para debugging:

```typescript
// Logs automáticos al iniciar:
[AdsManager] AdMob Configuration
Environment: testflight | production | development
Platform: ios | android
__DEV__: true | false
isTestFlight: true | false

// Al cargar anuncio:
[AdsManager] Using TEST ad unit ID for testflight environment
[AdsManager] Ad Unit ID (first 20 chars): ca-app-pub-39402560...
[AdsManager] Real ad loaded successfully

// Al mostrar anuncio:
[AdsManager] Attempting to show real ad
[AdsManager] User earned reward
[UnlockManager] Section unlocked and state saved
```

## Preguntas Frecuentes

### ¿Por qué la sección se desbloquea sin ver anuncio en TestFlight?

Esto puede suceder si:
1. Hay un error de red
2. Google no tiene inventario de anuncios de test
3. El ad unit no se cargó correctamente

Los logs dirán exactamente qué sucedió.

### ¿Cuándo veré anuncios reales?

Solo después de:
1. ✅ Publicar en App Store (no TestFlight)
2. ✅ Vincular app en consola de AdMob
3. ✅ Esperar 1-24 horas para aprobación de Google
4. ✅ Tener inventario disponible en tu región

### ¿Cómo pruebo que los anuncios funcionan antes de publicar?

1. **Desarrollo local:** Anuncios de test aparecen inmediatamente
2. **TestFlight:** Anuncios de test aparecen (pero son IDs de test, no producción)
3. **App Store:** Primeros anuncios reales aparecen 1-2 horas después de publicar

### ¿Los anuncios de test generan ingresos?

**NO.** Solo los anuncios reales de producción generan ingresos. Los IDs de test de Google nunca generan dinero.

## Soporte y Referencias

### Documentación Oficial
- [Google AdMob - Test Ads](https://developers.google.com/admob/ios/test-ads)
- [React Native Google Mobile Ads](https://docs.page/invertase/react-native-google-mobile-ads)
- [Expo Tracking Transparency](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/)

### Reportar Problemas
Si ves comportamientos inesperados, comparte:
1. Logs completos de la consola
2. Entorno (development/testflight/production)
3. Versión de la app
4. Dispositivo y versión de iOS/Android

---

**Última actualización:** Enero 2025
**Versión de la guía:** 1.0

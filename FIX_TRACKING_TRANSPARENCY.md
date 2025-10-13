# Fix: Cannot find native module 'ExpoTrackingTransparency'

## 🐛 Problema

Error al iniciar la app:
```
Cannot find native module 'ExpoTrackingTransparency'
```

## 🔍 Causa

El error ocurre porque `expo-tracking-transparency` es un **módulo nativo** que:

1. **Solo funciona en iOS nativo** (no en Android ni web)
2. **NO está disponible en Expo Go** (requiere development build o production build)
3. **NO está disponible en web**

El código estaba importando y usando el módulo sin verificar si estaba disponible, causando un error de importación.

## ✅ Solución Implementada

### Cambios en `app/_layout.tsx`

**Antes:**
```typescript
import * as TrackingTransparency from 'expo-tracking-transparency';

// Uso directo sin verificar disponibilidad
const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
```

**Después:**
```typescript
// Importación condicional segura
let TrackingTransparency: any = null;
try {
  if (Platform.OS === 'ios' && !isExpoGo()) {
    TrackingTransparency = require('expo-tracking-transparency');
  }
} catch (error) {
  console.log('[RootLayout] expo-tracking-transparency not available:', error);
}

// Uso con verificación
if (Platform.OS === 'ios' && TrackingTransparency) {
  try {
    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    // ... manejo de permisos
  } catch (permError) {
    // ... manejo de errores
  }
} else if (Platform.OS === 'ios' && !TrackingTransparency) {
  devLog('RootLayout', 'iOS platform - TrackingTransparency module not available (Expo Go or web)');
  devLog('RootLayout', 'Will show non-personalized ads');
}
```

## 🎯 Comportamiento Ahora

### En Expo Go (Development)
- ✅ **No pide permisos de tracking** (el módulo no está disponible)
- ✅ **No causa error** (importación segura con try/catch)
- ✅ La app funciona normalmente
- ℹ️ Los anuncios serán no personalizados (lo cual es correcto para desarrollo)

### En Development Build (iOS)
- ✅ **Pide permisos de tracking** (el módulo está disponible)
- ✅ Maneja correctamente permisos granted/denied
- ✅ Muestra anuncios personalizados si se otorga permiso
- ✅ Muestra anuncios no personalizados si se niega permiso

### En Production Build (TestFlight/App Store)
- ✅ **Pide permisos de tracking** (el módulo está disponible)
- ✅ Cumple con requisitos de Apple para ATT (App Tracking Transparency)
- ✅ Muestra el mensaje configurado en `app.config.js`
- ✅ Respeta la elección del usuario

### En Web
- ✅ **No pide permisos** (no es relevante en web)
- ✅ No causa error
- ✅ La app funciona normalmente

### En Android
- ✅ **No pide permisos** (Android no requiere ATT)
- ✅ La app funciona normalmente

## 📋 Qué hace expo-tracking-transparency

Este módulo es **requerido por Apple** para apps que:
- Muestran anuncios personalizados
- Recopilan datos de usuario para publicidad
- Comparten datos con terceros (brokers de datos)

**Funcionalidad:**
- Muestra el diálogo de permisos de tracking de iOS 14.5+
- Permite al usuario elegir si permite tracking entre apps
- Es parte de la política ATT (App Tracking Transparency) de Apple

**Mensaje mostrado al usuario:**
```
"Usamos esto para personalizar anuncios y mejorar tu experiencia"
```
(Configurado en `app.config.js` línea 68)

## 🔧 Cuándo Probar Tracking Transparency

### ❌ NO funciona en:
- Expo Go
- Simulador de iOS (puede dar resultados inconsistentes)
- Web
- Android

### ✅ Funciona correctamente en:
- Development Build en dispositivo iOS físico
- TestFlight en dispositivo iOS físico
- App Store en dispositivo iOS físico

## 🧪 Cómo Probar en Development Build

1. **Crear Development Build:**
   ```bash
   eas build --profile development --platform ios
   ```

2. **Instalar en dispositivo:**
   - Descarga el build desde Expo Dashboard
   - Instala en tu iPhone físico

3. **Probar el flujo:**
   - Abre la app por primera vez
   - Deberías ver el diálogo de tracking
   - Prueba con "Allow" y "Don't Allow"

4. **Verificar logs:**
   - Conecta el dispositivo a Xcode
   - Ve a Window > Devices and Simulators
   - Abre Console y busca `[RootLayout]`

## 📊 Estados de Tracking Permission

### `granted`
- Usuario permitió el tracking
- Los anuncios pueden ser personalizados
- Se puede compartir el IDFA con AdMob

### `denied`
- Usuario denegó el tracking
- Los anuncios serán no personalizados
- No se comparte el IDFA

### `unavailable`
- El dispositivo no soporta ATT (iOS < 14.5)
- Tratado como "denied" por defecto

### `restricted`
- Permisos restringidos por MDM o controles parentales
- Tratado como "denied"

## 🔐 Privacidad y Cumplimiento

### Configuración Actual

En `app.config.js`:
```javascript
[
  "expo-tracking-transparency",
  {
    userTrackingPermission: "Usamos esto para personalizar anuncios y mejorar tu experiencia"
  }
]
```

### Requisitos de Apple

1. **Info.plist**: El mensaje se agrega automáticamente
2. **Privacy Policy**: Debes tener una política de privacidad clara
3. **Justificación real**: El mensaje debe reflejar el uso real
4. **Momento adecuado**: Pedir permisos en el momento apropiado (no inmediatamente)

### Nuestro Flujo

✅ **Pedimos permisos al inicio** porque:
- Necesitamos inicializar AdMob con el estado de permisos
- Es común en apps de contenido con anuncios
- Permite personalizar anuncios desde el primer uso

## ⚠️ Notas Importantes

### Para Development
- **No te preocupes** si ves el log "TrackingTransparency module not available" en Expo Go
- Es **comportamiento esperado** - el módulo no existe en Expo Go
- La app funcionará perfectamente sin él durante desarrollo

### Para Production
- **Asegúrate** de probar en TestFlight antes de publicar
- **Verifica** que el diálogo de permisos aparezca correctamente
- **Confirma** que el mensaje sea apropiado y claro
- **Prueba** ambos casos: "Allow" y "Don't Allow"

### Para App Store Review
- Apple **revisará** tu uso de tracking
- Debes **justificar** por qué necesitas tracking
- Tu **Privacy Policy** debe mencionar el uso de datos
- El **mensaje de permisos** debe ser claro y honesto

## 🆘 Troubleshooting

### Error persiste después del fix
```bash
# Limpia la caché de Metro
npm start -- --clear

# O reinicia completamente
npx expo start --clear
```

### Diálogo no aparece en TestFlight
1. Ve a Settings > Privacy & Security > Tracking
2. Asegúrate de que "Allow Apps to Request to Track" esté ON
3. Desinstala y reinstala la app
4. El diálogo debe aparecer en el primer lanzamiento

### Quiero deshabilitar tracking transparency
Si no quieres usar tracking (anuncios siempre no personalizados):

1. Remueve el plugin de `app.config.js`:
   ```javascript
   // Elimina esta sección completa:
   [
     "expo-tracking-transparency",
     {
       userTrackingPermission: "..."
     }
   ],
   ```

2. El código actual ya maneja este caso automáticamente

## 📚 Referencias

- [Expo Tracking Transparency Docs](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/)
- [Apple ATT Framework](https://developer.apple.com/documentation/apptrackingtransparency)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/#privacy)
- [AdMob and ATT](https://support.google.com/admob/answer/10286151)

---

**Última actualización:** 2025-10-13
**Estado:** ✅ Resuelto

# Guía para Resolver Pantalla Negra en TestFlight

Esta guía documenta todos los problemas identificados y las soluciones implementadas para resolver el problema de pantalla negra al abrir la app en TestFlight.

## Problemas Identificados

### 1. ✅ Conflicto de Dependencias (RESUELTO)

**Problema:** `lucide-react-native@0.484.0` no es compatible con React 19.1.0

**Solución Implementada:**
- Actualizado `lucide-react-native` de `0.484.0` a `0.496.0`
- Esta versión soporta React 19

**Acción Requerida en tu Máquina:**
```bash
npm run reinstall
# o
npm install --legacy-peer-deps
```

---

### 2. ✅ Variables de Entorno Faltantes (RESUELTO)

**Problema:** Variables de entorno necesarias para producción no estaban configuradas

**Solución Implementada:**
- Creado `.env.example` con documentación completa
- Actualizado `.env` con estructura clara y comentarios
- Todas las variables ahora tienen valores por defecto seguros

**Acción Requerida:**

1. **Rellena el archivo `.env` con tus claves reales:**

```bash
# RevenueCat (CRÍTICO para suscripciones)
EXPO_PUBLIC_RC_API_KEY_IOS=appl_tu_clave_real_aqui
EXPO_PUBLIC_RC_API_KEY_ANDROID=goog_tu_clave_real_aqui

# AdMob (CRÍTICO para anuncios en producción)
EXPO_PUBLIC_ADMOB_REWARDED_ID_PROD=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

2. **Para builds de producción con EAS, configura secrets:**

```bash
# RevenueCat
eas secret:create --scope project --name EXPO_PUBLIC_RC_API_KEY_IOS --value "tu_clave_ios"
eas secret:create --scope project --name EXPO_PUBLIC_RC_API_KEY_ANDROID --value "tu_clave_android"

# AdMob
eas secret:create --scope project --name EXPO_PUBLIC_ADMOB_REWARDED_ID_PROD --value "tu_id_anuncio"
```

---

### 3. ✅ Inicialización de Servicios Frágil (RESUELTO)

**Problema:** Si AdMob o RevenueCat fallaban al inicializar, la app quedaba bloqueada en pantalla negra

**Solución Implementada:**
- Nuevo sistema de utilidades en `src/utils/environment.ts`
- Detección robusta de entorno (Expo Go, development, production)
- Manejo de errores individual para cada servicio
- Timeout de seguridad de 10 segundos para inicialización
- La app continúa funcionando incluso si servicios fallan

**Mejoras en `app/_layout.tsx`:**
- Timeout de seguridad de 5 segundos para ocultar splash screen
- Inicialización de servicios no bloqueante
- Pantalla de error de fallback si algo crítico falla
- Logs estructurados con `devLog` y `errorLog`

---

### 4. ✅ SplashScreen sin Timeout (RESUELTO)

**Problema:** Si algo fallaba durante la inicialización, el splash screen nunca se ocultaba

**Solución Implementada:**
- Timeout de seguridad de 5 segundos máximo para splash screen
- Manejo de errores al ocultar splash screen
- Delay de 1 segundo para mejor UX antes de ocultar splash

---

### 5. ✅ Detección de Entorno Mejorada (RESUELTO)

**Problema:** La función `isExpoGo()` podía fallar y causar crashes

**Solución Implementada:**
- Nueva utilidad `src/utils/environment.ts` con múltiples métodos de detección
- Funciones helper:
  - `isExpoGo()`: Detección robusta de Expo Go
  - `isProduction()`: Detecta si está en modo producción
  - `getEnvironment()`: Retorna 'expo-go' | 'development' | 'production'
  - `isNativeModuleAvailable()`: Verifica disponibilidad de módulos nativos
  - `devLog()`: Logs solo en desarrollo
  - `errorLog()`: Logs siempre, incluso en producción

---

### 6. ✅ AdMob sin Timeout (RESUELTO)

**Problema:** La inicialización de AdMob podía quedarse colgada indefinidamente

**Solución Implementada:**
- Timeout de 5 segundos para inicialización de AdMob
- Si falla, automáticamente usa implementación mock
- La app continúa funcionando sin anuncios

---

### 7. ✅ Logs Excesivos en Producción (RESUELTO)

**Problema:** Muchos `console.log` que podían afectar rendimiento

**Solución Implementada:**
- Reemplazados `console.log` por `devLog()` que solo muestra en desarrollo
- `errorLog()` para errores críticos que siempre deben registrarse
- Logs estructurados con categoría y timestamp

---

## Checklist para TestFlight

Antes de subir un nuevo build a TestFlight, verifica:

### ✅ Preparación Local

- [ ] Ejecutar `npm run reinstall` para limpiar dependencias
- [ ] Verificar que `.env` tenga todas las claves de producción
- [ ] Probar en un dispositivo físico con development build
- [ ] Verificar que no haya errores en consola

### ✅ Variables de Entorno

- [ ] RevenueCat API keys configuradas (iOS y Android)
- [ ] AdMob Rewarded ID para producción configurado
- [ ] Variables configuradas como secrets en EAS

### ✅ Configuración de iOS

- [ ] `bundleIdentifier` correcto en `app.config.js`
- [ ] `buildNumber` incrementado
- [ ] Pods instalados: `cd ios && pod install`
- [ ] Permisos correctos en `Info.plist`

### ✅ Build y Deploy

```bash
# 1. Limpiar y reinstalar dependencias
npm run reinstall

# 2. Verificar configuración con Expo Doctor
npx expo-doctor

# 3. Generar build de producción para iOS
eas build --platform ios --profile production

# 4. Una vez completado, subir a TestFlight automáticamente
# (EAS Build lo hace automáticamente si está configurado)
```

---

## Verificación Post-Deploy

Después de subir a TestFlight, verifica:

1. **Instalación desde TestFlight:**
   - La app debe abrir sin pantalla negra
   - Splash screen debe desaparecer después de 1-5 segundos máximo

2. **Funcionalidad Básica:**
   - Navegación entre tabs funciona
   - Tests se pueden iniciar
   - Perfil se puede editar

3. **Servicios Opcionales:**
   - Anuncios: Verificar que los anuncios recompensados funcionen (si configuraste AdMob)
   - Suscripciones: Verificar que el flujo de compra funcione (si configuraste RevenueCat)

---

## Solución de Problemas

### Si la pantalla sigue en negro:

1. **Verificar logs en Xcode:**
```bash
# Conecta un dispositivo y abre Xcode
# Ve a Window > Devices and Simulators
# Selecciona tu dispositivo
# Haz clic en "View Device Logs"
# Busca logs de OscuraMente
```

2. **Verificar variables de entorno:**
```bash
# En tu máquina local
cat .env

# Verificar secrets de EAS
eas secret:list
```

3. **Verificar módulos nativos:**
```bash
# Regenerar carpetas nativas
npx expo prebuild --clean

# Reinstalar pods
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

4. **Limpiar cachés completamente:**
```bash
# Limpiar TODO
npm run clean
rm -rf .expo
rm -rf ios/build
rm -rf android/build

# Reinstalar
npm run reinstall

# Limpiar build de EAS
eas build --platform ios --clear-cache
```

---

## Archivos Modificados

### Nuevos Archivos:
- `.env.example` - Template con documentación completa
- `src/utils/environment.ts` - Utilidades para detección de entorno y logs
- `GUIA_PRODUCCION_TESTFLIGHT.md` - Esta guía

### Archivos Modificados:
- `package.json` - Actualizado `lucide-react-native` a v0.496.0
- `.env` - Reestructurado con comentarios y variables faltantes
- `app/_layout.tsx` - Manejo de errores robusto y timeouts de seguridad
- `src/services/ads.native.ts` - Usa nuevas utilidades, timeout de inicialización
- `src/state/subscription.ts` - Usa nuevas utilidades de entorno

---

## Próximos Pasos

### Configuración Pendiente (Antes de Producción):

1. **RevenueCat:**
   - Crear cuenta en https://www.revenuecat.com/
   - Crear productos en App Store Connect
   - Configurar productos en RevenueCat Dashboard
   - Obtener API keys y agregarlas a `.env`

2. **AdMob:**
   - Crear cuenta en https://apps.admob.com/
   - Crear app en AdMob
   - Crear unidad de anuncio recompensado
   - Agregar ID de producción a `.env`

3. **Testing:**
   - Hacer build de development para probar funcionalidad completa
   - Usar TestFlight Internal Testing primero
   - Solo después de verificar, pasar a External Testing

---

## Comandos Útiles

```bash
# Desarrollo local
npm run dev                    # Iniciar Expo dev server
npm run clean                  # Limpiar node_modules y caché
npm run reinstall              # Limpieza completa + reinstalación

# Builds nativos locales
npx expo run:ios              # Build y correr en iOS
npx expo run:android          # Build y correr en Android

# EAS Build
eas build --platform ios --profile development  # Build de desarrollo
eas build --platform ios --profile production   # Build de producción
eas build --platform ios --clear-cache          # Con caché limpio

# Debugging
npx expo-doctor               # Verificar problemas de configuración
npx expo config               # Ver configuración resoluta
eas secret:list               # Ver secrets configurados

# Pods (solo iOS)
cd ios && pod install && cd ..
cd ios && pod update && cd ..
```

---

## Contacto de Soporte

Si después de seguir todos estos pasos el problema persiste:

1. Recopila los siguientes logs:
   - Output de `npx expo-doctor`
   - Logs de Xcode (Window > Devices and Simulators > View Device Logs)
   - Output de `eas build` con el error
   - Contenido de `.env` (sin las claves reales)

2. Verifica estos puntos:
   - ¿La app funciona en development build? (`npx expo run:ios`)
   - ¿La app funciona en Expo Go?
   - ¿Es solo en TestFlight/producción donde falla?
   - ¿Qué versión de iOS estás usando?

---

## Resumen de Cambios Clave

✅ Dependencias actualizadas y compatibles
✅ Variables de entorno documentadas y configuradas
✅ Inicialización de servicios robusta con timeouts
✅ SplashScreen con timeout de seguridad
✅ Detección de entorno mejorada
✅ Sistema de logs optimizado
✅ Pantalla de error de fallback
✅ La app SIEMPRE inicia, incluso si servicios opcionales fallan

**La app ahora es resiliente y debería funcionar correctamente en TestFlight.**

# Troubleshooting: Errores de TurboModules en React Native

## Error Específico
```
[runtime not ready]: Invariant Violation:
TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found.
Verify that a module by this name is registered in the native binary.
```

## ¿Qué son TurboModules?

TurboModules es el nuevo sistema de módulos nativos de React Native que forma parte de la "Nueva Arquitectura". Permite una comunicación más eficiente entre JavaScript y código nativo.

## Causas Comunes del Error

### 1. Conflictos de Versiones de Dependencias ✅ CORREGIDO
**Problema:** Versiones incompatibles entre paquetes de Expo/React Native
**Síntoma:** El error aparece al iniciar la app en iOS
**Solución aplicada:**
- Corregida versión de `expo-linking` de `^7.1.7` a `~7.0.5`
- Esto resuelve el conflicto con `expo-router@4.0.21`

### 2. Caché Corrupto
**Problema:** Metro bundler o npm tienen caché desactualizado
**Síntoma:** Los cambios en package.json no se reflejan
**Solución:**
```bash
# Limpia todos los cachés
npm run clean
npx expo start --clear
rm -rf .expo
```

### 3. Nueva Arquitectura Habilitada Sin Soporte Completo
**Problema:** `newArchEnabled: true` sin todos los módulos nativos actualizados
**Síntoma:** Módulos nativos fallan al inicializar
**Solución:** ✅ Ya está configurado correctamente en app.json:
```json
{
  "newArchEnabled": false
}
```

### 4. Módulos Nativos Sin Compilar
**Problema:** Módulos como AdMob o Purchases necesitan compilación nativa
**Síntoma:** Funciona en web pero falla en iOS/Android
**Solución:**
- No usar Expo Go para probar estos módulos
- Usar desarrollo build: `npx expo run:ios`
- O usar EAS Build para generar un build de desarrollo

## Diferencias: Expo Go vs Desarrollo Native

### Expo Go (Cliente Expo)
- ✅ Rápido para probar
- ✅ No requiere compilación
- ❌ Limitado a módulos incluidos en Expo Go
- ❌ No soporta módulos nativos personalizados como:
  - `react-native-google-mobile-ads`
  - `react-native-purchases`
  - Módulos nativos custom

### Desarrollo Native (npx expo run:ios)
- ✅ Soporta todos los módulos nativos
- ✅ Compilación nativa completa
- ❌ Requiere Xcode (iOS) o Android Studio (Android)
- ❌ Compilación más lenta

## Checklist de Diagnóstico

Cuando encuentres este error, verifica en orden:

- [ ] ¿Las versiones de dependencias son compatibles?
  ```bash
  npx expo-doctor
  ```

- [ ] ¿El caché está limpio?
  ```bash
  npm run clean
  npx expo start --clear
  ```

- [ ] ¿La nueva arquitectura está deshabilitada?
  ```bash
  # Verifica en app.json
  "newArchEnabled": false
  ```

- [ ] ¿Estás usando Expo Go con módulos nativos?
  ```bash
  # Si es así, cambia a:
  npx expo run:ios
  ```

- [ ] ¿node_modules está actualizado?
  ```bash
  npm run reinstall
  ```

- [ ] ¿Metro config está configurado correctamente?
  - Verifica que existe `metro.config.js` ✅

## Módulos Nativos en Tu Proyecto

Tu proyecto usa estos módulos que **requieren compilación nativa**:

1. **react-native-google-mobile-ads**
   - Para anuncios de AdMob
   - No funciona en Expo Go
   - Mock implementation proporcionada para desarrollo

2. **react-native-purchases**
   - Para compras in-app con RevenueCat
   - No funciona en Expo Go
   - Requiere configuración en App Store Connect/Play Console

3. **expo-camera**
   - Funciona en Expo Go con permisos
   - Requiere configuración en app.json ✅ Ya configurado

4. **expo-notifications**
   - Funciona en Expo Go con configuración
   - Requiere permisos y tokens

## Estrategia de Desarrollo Recomendada

### Para Desarrollo Rápido (Sin AdMob/Purchases)
```bash
# 1. Usa Expo Go
npx expo start

# 2. Escanea QR con Expo Go app
# 3. Los anuncios usarán mock implementation
```

### Para Probar Funcionalidades Nativas Completas
```bash
# 1. Genera build de desarrollo
npx expo run:ios

# O usa EAS Build
eas build --profile development --platform ios
```

## Logs de Diagnóstico

Cuando reportes un problema, incluye estos logs:

```bash
# Versiones de dependencias
npm list expo expo-router expo-linking react-native

# Doctor de Expo
npx expo-doctor

# Logs de inicio
npx expo start --clear 2>&1 | tee expo-start.log
```

## Recursos Adicionales

- [Expo SDK 54 Release Notes](https://expo.dev/changelog/2024/12-03-sdk-54)
- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [TurboModules Documentation](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)

## Estado Actual de Tu Proyecto

✅ **Corregido:**
- Versión de expo-linking compatible
- Metro config optimizado
- Babel config correcto para reanimated
- Nueva arquitectura deshabilitada

⚠️ **Requiere Atención en Tu Máquina:**
- Reinstalación completa de node_modules
- Limpieza de cachés
- Compilación nativa para probar AdMob/Purchases

🎯 **Siguiente Paso:**
Ejecuta `npm run reinstall` en tu máquina local

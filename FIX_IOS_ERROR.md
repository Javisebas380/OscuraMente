# Solución para el Error de TurboModule en iOS

## Problema
Error: `[runtime not ready]: Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found.`

## Causa
Conflicto de dependencias entre `expo-router@4.0.21` y `expo-linking@7.1.7`. Expo Router requiere específicamente `expo-linking@~7.0.5`.

## Solución Implementada

### 1. Dependencias Corregidas
- ✅ `expo-linking` actualizado de `^7.1.7` a `~7.0.5` en package.json
- ✅ Archivo `metro.config.js` creado con configuración optimizada para React Native

### 2. Pasos a Seguir en Tu Máquina Local

**IMPORTANTE:** Estos pasos deben ejecutarse en tu computadora, no en Bolt.

#### Opción A: Usando el Script Automatizado (Recomendado)

```bash
# Ejecuta el script de reinstalación
npm run reinstall
```

#### Opción B: Pasos Manuales

```bash
# 1. Limpia completamente el proyecto
rm -rf node_modules package-lock.json
npm cache clean --force

# 2. Si estás en macOS/iOS, limpia también el caché de Expo
rm -rf ~/Library/Caches/Expo
rm -rf .expo

# 3. Reinstala las dependencias con el flag --legacy-peer-deps
npm install --legacy-peer-deps

# 4. (Opcional) Si usas Expo Doctor, verifica las dependencias
npx expo-doctor

# 5. Limpia el caché de Metro y reinicia el servidor
npx expo start --clear
```

### 3. Comandos Adicionales para iOS

Si el error persiste después de los pasos anteriores:

```bash
# Si has generado carpetas nativas (ios/):
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..

# Si usas EAS Build:
eas build --platform ios --clear-cache

# Si usas expo run:ios:
npx expo run:ios --clear
```

### 4. Verificación

Para verificar que el problema está resuelto:

1. Inicia el servidor con caché limpio:
   ```bash
   npx expo start --clear
   ```

2. Prueba primero en web (debe funcionar):
   - Presiona `w` en la terminal

3. Luego prueba en iOS:
   - Si usas Expo Go: Escanea el QR
   - Si es desarrollo nativo: `npx expo run:ios`

4. Verifica los logs de consola. Deberías ver:
   ```
   [AdsManager] Initializing ads manager...
   [UnlockManager] Initializing unlock manager...
   Services initialized successfully
   ```

### 5. Cambios Realizados en el Proyecto

#### package.json
- Corregida versión de `expo-linking` a `~7.0.5`
- Agregado script `clean` para limpiar node_modules y caché
- Agregado script `reinstall` para reinstalación completa

#### metro.config.js (NUEVO)
- Configuración optimizada para resolver módulos nativos
- Soporte para extensiones `.mjs` y `.cjs`
- Configuración de transformer para mejor rendimiento

### 6. Notas Importantes

- ✅ La nueva arquitectura (`newArchEnabled`) está **desactivada** en `app.json` - esto es correcto
- ✅ El código de tu app está bien estructurado, el problema es solo de dependencias
- ✅ React Native 0.76.5 es compatible con Expo SDK 54
- ⚠️ `react-native-google-mobile-ads` y `react-native-purchases` requieren compilación nativa - no funcionarán en Expo Go
- ⚠️ Para probar estas funcionalidades, necesitas un build de desarrollo o EAS Build

### 7. Si el Problema Persiste

Si después de seguir todos los pasos el error continúa:

1. Verifica que `expo-linking` esté en la versión correcta:
   ```bash
   npm list expo-linking
   ```
   Debe mostrar: `expo-linking@7.0.5`

2. Regenera las carpetas nativas:
   ```bash
   npx expo prebuild --clean
   ```

3. Verifica incompatibilidades con Expo Doctor:
   ```bash
   npx expo-doctor
   ```

4. Como último recurso, prueba con un proyecto nuevo:
   ```bash
   npx create-expo-app test-app
   # Copia tus archivos de app/ y components/ al nuevo proyecto
   # Instala dependencias una por una
   ```

## Resumen

El error se debe a un conflicto de versiones de paquetes. La solución principal es:
1. ✅ Corregir `expo-linking` a `~7.0.5`
2. ✅ Limpiar completamente node_modules y caché
3. ✅ Reinstalar con `--legacy-peer-deps`
4. ✅ Usar la configuración de Metro proporcionada

Después de estos pasos, tu app debería funcionar correctamente tanto en web como en iOS.

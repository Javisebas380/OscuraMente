# Configuración de Producción - OscuraMente

## CAMBIOS REALIZADOS

### 1. Archivo `.env` actualizado
- Agregadas variables de AdMob (ya configuradas correctamente)
- Agregados placeholders para RevenueCat (necesitas reemplazar con tus claves reales)
- Todas las variables usan el prefijo `EXPO_PUBLIC_` para que estén disponibles en el cliente

### 2. Creado `app.config.js`
- Reemplaza el antiguo `app.json` (ahora renombrado a `app.json.backup`)
- Lee las variables de entorno automáticamente
- Tiene valores de fallback por si las variables no están disponibles

### 3. Actualizado `.npmrc`
- Agregada la línea `legacy-peer-deps=true` para solucionar conflictos de dependencias
- Esto permite que React 19 funcione con lucide-react-native

---

## PRÓXIMOS PASOS

### PASO 1: Obtener Claves de RevenueCat

1. Ve a https://app.revenuecat.com
2. Inicia sesión o crea una cuenta
3. Crea un proyecto nuevo (o selecciona el existente)
4. Ve a Settings > API Keys
5. Copia la **Public API Key for iOS** (empieza con `appl_`)
6. Copia la **Public API Key for Android** (empieza con `goog_`)

### PASO 2: Actualizar el archivo `.env`

Abre el archivo `.env` y reemplaza estas líneas:

```bash
EXPO_PUBLIC_RC_API_KEY_IOS=tu_clave_ios_revenuecat_aqui
EXPO_PUBLIC_RC_API_KEY_ANDROID=tu_clave_android_revenuecat_aqui
```

Por tus claves reales, por ejemplo:

```bash
EXPO_PUBLIC_RC_API_KEY_IOS=appl_xXxXxXxXxXxXxXxXxXxX
EXPO_PUBLIC_RC_API_KEY_ANDROID=goog_yYyYyYyYyYyYyYyYyYyY
```

### PASO 3: Reinstalar Dependencias

Ejecuta en tu terminal:

```bash
npm run clean
npm install
```

El flag `legacy-peer-deps=true` en `.npmrc` se aplicará automáticamente.

### PASO 4: Hacer Prebuild

Una vez que hayas actualizado las claves de RevenueCat en `.env`, ejecuta:

```bash
npx expo prebuild --clean
```

**IMPORTANTE:** Ya NO deberías ver el error:
- ❌ "No 'androidAppId' was provided"
- ❌ "No 'iosAppId' was provided"

### PASO 5: Verificar que los IDs se aplicaron

**Para Android:**
```bash
cat android/app/src/main/AndroidManifest.xml | grep ca-app-pub
```

Deberías ver:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-9521354088644356~6949695611"/>
```

**Para iOS:**
```bash
cat ios/*/Info.plist | grep -A 1 GADApplicationIdentifier
```

Deberías ver:
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-9521354088644356~4323532279</string>
```

---

## PASO 6: Testing en Sandbox

### Para iOS:

1. **Crear Sandbox Tester en App Store Connect:**
   - Ve a https://appstoreconnect.apple.com
   - Users and Access > Sandbox Testers
   - Crea un nuevo tester con un email que NO esté asociado a ninguna Apple ID real

2. **Configurar tu iPhone:**
   - Ve a Ajustes > App Store
   - Desplázate hasta abajo
   - Toca "Sandbox Account"
   - Cierra sesión de cualquier cuenta existente
   - NO inicies sesión aún (lo harás cuando hagas la compra en la app)

3. **Compilar e instalar en dispositivo físico:**
   ```bash
   npx expo run:ios --device
   ```

   O con Xcode:
   ```bash
   open ios/*.xcworkspace
   ```
   - Selecciona tu equipo de desarrollo
   - Conecta tu iPhone (simulador NO funciona para compras)
   - Presiona Play

4. **Probar compra:**
   - Abre la app
   - Ve a la pantalla de suscripción
   - Intenta comprar un plan
   - Cuando aparezca el prompt, inicia sesión con tu Sandbox Tester
   - Confirma la compra (es gratis en sandbox)
   - Verás "Environment: Sandbox" en el diálogo

### Para Android:

1. **Agregar License Testers en Google Play Console:**
   - Ve a https://play.google.com/console
   - Setup > License testing
   - Agrega tu email de Google como tester

2. **Compilar e instalar:**
   ```bash
   npx expo run:android
   ```

   O manualmente:
   ```bash
   cd android
   ./gradlew assembleDebug
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Probar compra:**
   - Abre la app
   - Ve a la pantalla de suscripción
   - Intenta comprar un plan
   - Verás una advertencia de que es una compra de prueba
   - Confirma (es gratis para testers)

---

## PASO 7: Monitorear en RevenueCat Dashboard

Durante las pruebas:

1. Ve a https://app.revenuecat.com
2. Selecciona tu proyecto
3. Ve a "Customers"
4. Deberías ver aparecer nuevos customers cuando hagas compras
5. Verifica que:
   - La suscripción esté activa
   - El entitlement "premium" esté activo
   - Las transacciones se registren correctamente

---

## CHECKLIST DE VALIDACIÓN

Antes de ir a producción, confirma:

- [ ] Claves de RevenueCat agregadas en `.env`
- [ ] `npx expo prebuild --clean` ejecutado sin errores de AdMob
- [ ] IDs de AdMob presentes en AndroidManifest.xml e Info.plist
- [ ] Compra semanal funciona en iOS sandbox
- [ ] Compra anual funciona en iOS sandbox
- [ ] Compra semanal funciona en Android sandbox
- [ ] Compra anual funciona en Android sandbox
- [ ] Restauración funciona en ambas plataformas
- [ ] Estado Premium se refleja correctamente en la UI
- [ ] Anuncios desaparecen para usuarios Premium
- [ ] RevenueCat dashboard muestra las transacciones
- [ ] Los logs no muestran errores críticos

---

## TROUBLESHOOTING

### Si aparece "Cannot connect to iTunes Store" en iOS:
- Verifica que estés usando un dispositivo físico (no simulador)
- Cierra sesión del Sandbox Account y vuelve a intentar
- Reinicia el dispositivo

### Si no aparecen los productos:
- Verifica que los productos estén aprobados en App Store Connect
- Espera 2-3 horas después de crear los productos
- Verifica que los Product IDs coincidan exactamente en código y tienda

### Si RevenueCat dice "invalid credentials":
- Verifica las API Keys en tu archivo `.env`
- Asegúrate de usar las Public API Keys, no las Secret Keys
- Verifica que el Bundle ID/Package Name coincida

### Si la compra se completa pero no se activa Premium:
- Revisa que el entitlement se llame exactamente "premium"
- Verifica que los productos estén vinculados al entitlement en RevenueCat
- Checa los logs de `[RevenueCat]` en la consola

---

## ARCHIVOS MODIFICADOS

- ✅ `.env` - Agregadas variables de AdMob y placeholders para RevenueCat
- ✅ `.npmrc` - Agregado `legacy-peer-deps=true`
- ✅ `app.config.js` - Creado (lee variables de entorno)
- ✅ `app.json` - Renombrado a `app.json.backup`

## IMPORTANTE

- **NUNCA** subas el archivo `.env` al repositorio (ya está en `.gitignore`)
- **SIEMPRE** usa las Public API Keys de RevenueCat, no las Secret Keys
- **VERIFICA** que el Bundle ID coincida en todos lados: `com.psicologiaoscura.darkpsychology`

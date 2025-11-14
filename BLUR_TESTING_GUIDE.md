# Guía de Testing: Blur en Android

## 🧪 Preparación del Entorno

### Prerrequisitos
```bash
# Asegúrate de tener el proyecto compilado
npm install --legacy-peer-deps

# Para Android
npx expo prebuild --platform android

# Opcional: Limpiar cache si hay problemas
npx expo start --clear
```

### Build para Testing
```bash
# Development build para iOS
EXPO_PUBLIC_APP_ENV=development eas build --profile development --platform ios

# Development build para Android
EXPO_PUBLIC_APP_ENV=development eas build --profile development --platform android
```

## 📱 Escenarios de Testing

### Escenario 1: Blur Exitoso (Android 12+)
**Objetivo**: Verificar que el blur se renderiza correctamente en dispositivos modernos

**Dispositivos Objetivo**:
- Pixel 6/7/8 (Android 13/14)
- Samsung Galaxy S22+ (Android 13+)
- Emulador API 34

**Pasos**:
1. Abre la app
2. Navega a cualquier test y complétalo
3. Ve a la página de resultados
4. Expande cualquier sección de análisis detallado
5. Observa las secciones bloqueadas (gris con overlay blur)

**Resultado Esperado**:
- ✅ Contenido bloqueado visible pero borroso
- ✅ CTAs de desbloqueo claramente legibles
- ✅ Efecto blur suave y natural
- ✅ Sin lag al hacer scroll
- ✅ Transición suave al desbloquear

**Cómo Verificar que Blur Funciona**:
```
Abrir Chrome DevTools en Android Studio:
1. Conecta dispositivo Android
2. Chrome > More tools > Remote devices
3. Inspecciona la WebView
4. Console debe mostrar: NO logs de error sobre blur
```

### Escenario 2: Blur Legacy (Android 8-11)
**Objetivo**: Validar RenderScriptBlur en dispositivos Android legacy

**Dispositivos Objetivo**:
- Samsung Galaxy A50 (Android 9)
- Xiaomi Redmi Note 8 (Android 10)
- Emulador API 28

**Pasos**:
1-5. Igual que Escenario 1

**Resultado Esperado**:
- ✅ Blur funcional (puede ser ligeramente menos suave)
- ✅ Performance aceptable (puede tener leve lag en scroll)
- ✅ Fallback NO activado (sin overlay sólido)

**Logs Esperados**:
```javascript
// En la consola NO debe aparecer:
"[LockedSection] Android blur failed, switching to fallback"
```

### Escenario 3: Fallback Activado (Error o Android Antiguo)
**Objetivo**: Verificar que el fallback funciona correctamente

**Dispositivos Objetivo**:
- Android 4.4 o inferior (muy raro)
- Dispositivos con GPU desactualizado
- Emuladores con graphics acceleration deshabilitado

**Pasos**:
1-5. Igual que Escenario 1

**Resultado Esperado**:
- ✅ Overlay sólido oscuro (rgba(13,13,13,0.96))
- ✅ Contenido casi completamente oculto
- ✅ CTAs claramente legibles
- ✅ Sin crashes o errores visibles
- ✅ Funcionalidad de desbloqueo intacta

**Logs Esperados**:
```javascript
// En la consola debe aparecer:
"[SafeBlurView] Blur rendering failed: [error details]"
"[LockedSection] Android blur failed, switching to fallback"
```

### Escenario 4: Performance en Scroll
**Objetivo**: Validar que el blur no afecta negativamente el performance

**Dispositivos Objetivo**:
- Todos los anteriores

**Pasos**:
1. Abre página de resultados con múltiples secciones bloqueadas
2. Haz scroll rápido arriba y abajo
3. Observa fluidez del scroll
4. Mide FPS si es posible (Chrome DevTools > Performance)

**Resultado Esperado**:
- ✅ Scroll fluido (>50 FPS en dispositivos modernos)
- ✅ Sin lag perceptible
- ✅ Blur se mantiene estable durante scroll
- ✅ Animaciones suaves

**Benchmarks**:
- Android 12+: >55 FPS
- Android 8-11: >45 FPS
- Fallback: >58 FPS (sin blur, debería ser más rápido)

### Escenario 5: Animaciones de Unlock
**Objetivo**: Verificar transiciones al desbloquear contenido

**Pasos**:
1. Ve a sección bloqueada con blur
2. Toca "Ver Anuncio para Desbloquear" o "Desbloquear con Premium"
3. Observa la transición de blur a contenido visible

**Resultado Esperado**:
- ✅ Fade out suave del blur
- ✅ Contenido aparece gradualmente
- ✅ Badge "Desbloqueado" aparece correctamente
- ✅ Sin flashes o parpadeos
- ✅ Animación dura ~300-500ms

### Escenario 6: Múltiples Secciones Bloqueadas
**Objetivo**: Validar performance con muchas secciones con blur

**Pasos**:
1. Completa un test con múltiples rasgos
2. Ve a resultados (debe tener 5+ secciones expandibles)
3. Expande todas las secciones
4. Haz scroll por toda la página

**Resultado Esperado**:
- ✅ Todas las secciones muestran blur correctamente
- ✅ Performance aceptable con múltiples blurs activos
- ✅ Sin memory leaks
- ✅ App no se ralentiza con el tiempo

**Cómo Verificar Memory Leaks**:
```
Android Studio > Profiler > Memory
1. Navega a resultados
2. Expande todas las secciones
3. Scroll arriba/abajo varias veces
4. Sal y vuelve a entrar
5. Observa: Memory usage NO debe crecer constantemente
```

## 🔍 Debugging

### Habilitar Logs Detallados
En el código, los componentes ya incluyen logs de debug:

```javascript
// SafeBlurView.tsx
console.warn('[SafeBlurView] Blur rendering failed:', error);

// LockedSection.tsx
console.warn('[LockedSection] Android blur failed, switching to fallback');
```

### Ver Logs en Tiempo Real
```bash
# Android
adb logcat | grep -E "(SafeBlurView|LockedSection)"

# iOS
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Expo"' | grep -E "(SafeBlurView|LockedSection)"
```

### Forzar Fallback para Testing
Para probar el fallback manualmente, puedes modificar temporalmente:

```typescript
// En LockedSection.tsx, línea ~51
const [androidBlurFailed, setAndroidBlurFailed] = React.useState(true); // true en lugar de false
```

## 📊 Matriz de Testing

| Escenario | Android 12+ | Android 8-11 | Fallback | iOS | Web |
|-----------|-------------|--------------|----------|-----|-----|
| Blur visible | ✅ | ✅ | ❌ (sólido) | ✅ | ✅ |
| Performance | Excelente | Bueno | Excelente | Excelente | Bueno |
| CTAs legibles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sin lag scroll | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Animaciones | ✅ | ✅ | ✅ | ✅ | ✅ |

**Leyenda**:
- ✅ Pasa testing
- ⚠️ Aceptable con observaciones
- ❌ No aplica o esperado

## 🐛 Problemas Conocidos y Soluciones

### Problema 1: Blur no aparece en emulador
**Causa**: Graphics acceleration deshabilitado

**Solución**:
```bash
# En AVD Manager > Edit AVD > Graphics: Hardware - GLES 2.0
```

### Problema 2: Blur causa lag en scroll
**Causa**: blurReductionFactor muy bajo o dispositivo antiguo

**Solución**: El fallback se activará automáticamente si hay problemas

### Problema 3: Blur muy intenso o muy suave
**Causa**: Parámetros de intensity necesitan calibración

**Solución**: Ajustar `intensity` en LockedSection.tsx:
```typescript
// Android blur (línea ~222)
<SafeBlurView
  intensity={35} // Aumentar = más blur, Reducir = menos blur
  ...
/>
```

### Problema 4: Contenido no legible sobre blur
**Causa**: Overlay adicional necesita ajuste

**Solución**: Ajustar opacidad del overlay (línea ~235):
```typescript
<View
  style={[
    StyleSheet.absoluteFillObject,
    { backgroundColor: 'rgba(13,13,13,0.65)' } // Aumentar para más oscuro
  ]}
/>
```

## ✅ Checklist de Testing

### Pre-Testing
- [ ] Código compilado sin errores
- [ ] Linter ejecutado (`npm run lint`)
- [ ] Build de desarrollo generado

### Testing Funcional
- [ ] Blur funciona en Android 12+
- [ ] Blur funciona en Android 8-11
- [ ] Fallback funciona en Android antiguo
- [ ] CTAs legibles en todas las plataformas
- [ ] Animaciones suaves de unlock
- [ ] Sin crashes o errores

### Testing de Performance
- [ ] Scroll fluido (>50 FPS)
- [ ] Sin memory leaks
- [ ] Multiple blurs sin degradación
- [ ] Battery drain aceptable (<5% extra)

### Testing Cross-Platform
- [ ] iOS blur funciona igual
- [ ] Web blur funciona correctamente
- [ ] Experiencia consistente entre plataformas

### Testing de Regresión
- [ ] Funcionalidad de unlock intacta
- [ ] Anuncios siguen funcionando
- [ ] Premium subscription funciona
- [ ] Navegación correcta

## 📝 Reportar Resultados

### Template de Reporte
```markdown
## Testing Report: Blur en Android

**Fecha**: YYYY-MM-DD
**Tester**: [Tu nombre]
**Dispositivo**: [Marca/Modelo] (Android [Version])

### Resultados

#### Escenario 1: Blur Exitoso
- [ ] Blur visible: ✅ / ❌
- [ ] CTAs legibles: ✅ / ❌
- [ ] Performance: Excelente / Bueno / Pobre
- **Observaciones**: [Notas]

#### Escenario 2: Performance
- FPS promedio: [XX] FPS
- Lag perceptible: ✅ / ❌
- **Observaciones**: [Notas]

#### Escenario 3: Animaciones
- Transición suave: ✅ / ❌
- Duración: [XXX]ms
- **Observaciones**: [Notas]

### Issues Encontrados
1. [Descripción del issue]
2. [Descripción del issue]

### Recomendaciones
- [Recomendación 1]
- [Recomendación 2]
```

## 🚀 Próximos Pasos

1. **Testing Inicial**: Probar en 3-5 dispositivos Android representativos
2. **Ajustes Finos**: Calibrar parámetros basándose en resultados
3. **Beta Testing**: Desplegar a grupo pequeño de usuarios
4. **Monitoreo**: Trackear métricas de performance en producción
5. **Optimización**: Ajustar basándose en telemetría real

## 📞 Soporte

Si encuentras problemas durante el testing:
1. Revisa la sección "Problemas Conocidos"
2. Verifica logs de consola
3. Documenta el issue con capturas de pantalla
4. Incluye información del dispositivo y logs relevantes

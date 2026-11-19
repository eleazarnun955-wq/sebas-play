# Android APK

SEBAS PLAY usa Capacitor 8 para empaquetar el cliente público en un contenedor Android nativo.

- Nombre: SEBAS PLAY
- Application ID: `com.eleazarcompany.sebasplay`
- Cliente Android abre el visor público, no el panel de administración.
- El APK de depuración se genera automáticamente con GitHub Actions.
- No contiene credenciales administrativas ni claves `service_role`.
- La aplicación requiere conexión a Internet para consultar el catálogo Supabase y reproducir medios remotos.
- El APK de Actions es de depuración y no está firmado para publicación en Google Play. La firma de distribución debe configurarse con un keystore privado guardado como GitHub Actions secrets, nunca en el repositorio.

## Generar APK

En GitHub: Actions → SEBAS PLAY Android APK → Run workflow. Al finalizar, descargar el artefacto `SEBAS-PLAY-Android-debug`.

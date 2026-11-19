# Configurar el panel de SEBAS PLAY

## 1. Variables del panel

Crea variables de entorno en el proveedor de hosting o en un archivo local `.env`:

- `VITE_SUPABASE_URL`: URL del proyecto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: clave publicable del proyecto.

No configures una clave `service_role`, una secret key ni contraseñas dentro de variables `VITE_*`. Vite incorpora esas variables al código que recibe el navegador.

## 2. Crear el primer administrador

1. En Supabase, abre Authentication → Users y crea/invita la cuenta administradora.
2. Usa un mecanismo de confianza del lado de servidor o el editor administrativo de Supabase para asignar a esa cuenta el atributo **app_metadata** `{"role":"admin"}`.
3. No pongas ese valor en `user_metadata`: el propio usuario puede modificar sus metadatos de usuario.
4. Cierra la sesión del panel y vuelve a entrar para obtener un JWT actualizado con el rol.

El panel comprueba `user.app_metadata.role === "admin"`. La base de datos también verifica ese rol en RLS; ocultar la interfaz por sí solo no es una medida de seguridad.

## 3. Publicar como sitio estático

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Variables: las dos variables públicas de Supabase del apartado 1.

El sitio estático no necesita claves de servidor. La autenticación y las políticas RLS protegen las operaciones del catálogo.

## 4. Publicar contenido

El panel guarda películas, series y canales como borradores. Antes de pulsar Publicar, confirma que la URL de video/stream y sus derechos de uso están autorizados. El panel guarda direcciones de reproducción; no sube ni transcodifica archivos de video.

## 5. Estado actual y siguientes etapas

Este primer panel permite registrar, buscar, publicar/retirar y eliminar películas, series y canales. La gestión de temporadas y episodios, cargas directas a Storage, edición completa de fichas, y los clientes Android/Roku se implementarán en etapas siguientes.
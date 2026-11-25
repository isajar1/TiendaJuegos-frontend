INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, fecha_registro)
VALUES ('Admin de pruebas', 'admin@example.test', '$2b$12$i7AXrgLxRiAttvb9ep7tVO518EbzbPvQ/9idrpISN0iJSANRcYC3W', 'admin', CURRENT_TIMESTAMP);
INSERT INTO categorias (nombre) VALUES ('Aventura');
INSERT INTO plataformas (nombre) VALUES ('PC');

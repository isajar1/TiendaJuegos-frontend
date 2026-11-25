# language: es
Característica: Recorrido de cliente y administración en la tienda de juegos

  Escenario: 01 HU-01 Registro de un cliente nuevo
    Dado que un visitante usa un correo que todavía no está registrado
    Cuando registra su nombre, correo y contraseña
    Entonces se abre el catálogo con su nombre y el menú de cliente

  Escenario: 02 HU-02 Login con credenciales correctas
    Dado que el cliente tiene una cuenta registrada
    Cuando ingresa su correo y contraseña correctos
    Entonces la tienda muestra su nombre y la opción de cerrar sesión

  Escenario: 03 HU-02 Contraseña incorrecta
    Dado que el correo pertenece a un cliente registrado
    Cuando intenta entrar con otra contraseña
    Entonces ve un mensaje de credenciales incorrectas y permanece en el formulario

  Escenario: 04 HU-04 Listar juegos activos
    Dado que hay un juego activo para PC de región Global y precio 60
    Cuando el visitante abre el catálogo
    Entonces la tarjeta del juego muestra su título, plataforma, región y precio

  Escenario: 05 HU-08 Crear un juego
    Dado que el administrador está en el formulario de alta
    Cuando crea un juego para PC con precio 75
    Entonces aparece en la tabla con ese precio y se publica en el catálogo

  Escenario: 06 HU-08 Editar el precio
    Dado que el administrador tiene un juego publicado a 60
    Cuando cambia su precio a 85 y guarda
    Entonces la tabla muestra 85 y el catálogo conserva el precio después de recargar

  Escenario: 07 HU-08 y HU-04 Desactivar un juego
    Dado que el administrador tiene dos juegos activos
    Cuando desactiva uno de ellos
    Entonces desaparece del catálogo y el otro sigue visible

  Escenario: 08 HU-12 Agregar y quitar un juego
    Dado que un cliente tiene el carrito vacío y hay un juego de 60 disponible
    Cuando agrega el juego y recarga la página
    Entonces el carrito conserva el juego y su total de 60
    Cuando el cliente quita el juego
    Entonces aparece el mensaje de carrito vacío

  Escenario: 09 HU-14 Pago aprobado
    Dado que el cliente tiene en el carrito un juego de 60 con una clave disponible
    Cuando confirma el pago simulado
    Entonces recibe la clave del juego
    Y la orden aparece en el historial como pagada por 60 con el juego comprado

  Escenario: 10 HU-14 Pago rechazado
    Dado que el cliente tiene un juego de 60 en el carrito
    Cuando simula el rechazo del pago
    Entonces recibe el aviso de pago no aprobado sin entrega de claves
    Y el carrito conserva el juego y el total de 60

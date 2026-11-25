#!/usr/bin/env bash
set -eu
archivos="$(cd "$(dirname "$0")" && pwd)"
backend="${TIENDA_BACKEND:-/workspaces/TiendaJuegos-backend}"
cache="${XDG_CACHE_HOME:-$HOME/.cache}/tienda-e2e"
mkdir -p "$cache"
cd "$backend"
bash mvnw -q -DskipTests package
driver="$cache/h2-2.3.232.jar"
if [[ ! -f "$driver" ]]; then
  tmp="$(mktemp "$cache/h2.XXXXXX")"
  curl -fsSL --retry 2 https://repo.maven.apache.org/maven2/com/h2database/h2/2.3.232/h2-2.3.232.jar -o "$tmp"
  mv "$tmp" "$driver"
fi
echo "8dae62d22db8982c3dcb3826edb9c727c5d302063a67eef7d63d82de401f07d3  $driver" | sha256sum -c
exec java -Dloader.path="$driver" -cp target/tienda-juegos-api-0.0.1-SNAPSHOT.jar org.springframework.boot.loader.launch.PropertiesLauncher \
  --server.address=127.0.0.1 --server.port=18080 \
  '--spring.datasource.url=jdbc:h2:mem:tienda_e2e;MODE=MySQL;DB_CLOSE_DELAY=-1' \
  --spring.datasource.driver-class-name=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= \
  --spring.jpa.hibernate.ddl-auto=create --spring.jpa.defer-datasource-initialization=true \
  --spring.sql.init.mode=always "--spring.sql.init.data-locations=file:$archivos/datos.sql"

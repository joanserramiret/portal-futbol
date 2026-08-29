# En qué canal juega mi equipo

Portal casero para saber en qué canal dan cada partido de los equipos
españoles, con los resultados en directo.

Esta es la **copia de seguridad pública**. El portal de verdad se sirve desde
un ordenador de casa, en <https://futbol.js-tech.es>, y allí los marcadores
van al minuto.

Existe esta copia porque, por orden judicial, los operadores españoles
bloquean rangos de IP de Cloudflare durante los partidos de LaLiga para cortar
las emisiones piratas, y las IP donde está alojado el dominio caen dentro. El
resultado es que el portal se vuelve inaccesible desde España justo cuando hay
fútbol. GitHub Pages no está en esos rangos.

La página intenta primero leer los marcadores del servidor de casa; si no
responde, usa el archivo `datos/resultados.json` de este repositorio, que se
actualiza cada pocos minutos.

Uso personal y familiar. Los horarios y canales proceden de fuentes públicas y
pueden cambiar.

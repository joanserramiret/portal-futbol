/* Service worker del portal.

   Regla sencilla, para no quedarse nunca con una version vieja:
     - la pagina y los datos (datos/*.json) van A LA RED PRIMERO; si no hay
       cobertura, se sirve lo ultimo que se guardo.
     - los escudos, los iconos y las fuentes van A LA CACHE PRIMERO, que no
       cambian casi nunca.

   Al cambiar index.html conviene subir el numero de VERSION de aqui abajo:
   asi se tira la cache vieja al entrar. Aunque no se suba, la pagina se pide
   siempre a la red, de modo que el peor caso es que sobren unos escudos.
*/
var VERSION = "portal-2026-09-02a";
var ESTATICOS = [
 "./",
 "index.html",
 "manifest.webmanifest",
 "icono/favicon.ico",
 "icono/icono-180.png",
 "icono/icono-192.png",
 "icono/icono-512-maskable.png",
 "icono/icono-512.png",
 "escudos/aek.webp",
 "escudos/alaves.webp",
 "escudos/arsenal.webp",
 "escudos/astonvilla.webp",
 "escudos/athletic.webp",
 "escudos/atletico.webp",
 "escudos/barcelona.webp",
 "escudos/bayern.webp",
 "escudos/betis.webp",
 "escudos/bodo.webp",
 "escudos/celta.webp",
 "escudos/como.webp",
 "escudos/deportivo.webp",
 "escudos/dortmund.webp",
 "escudos/elche.webp",
 "escudos/espanyol.webp",
 "escudos/fenerbahce.webp",
 "escudos/feyenoord.webp",
 "escudos/galatasaray.webp",
 "escudos/getafe.webp",
 "escudos/inter.webp",
 "escudos/lask.webp",
 "escudos/leipzig.webp",
 "escudos/levante.webp",
 "escudos/lille.webp",
 "escudos/liverpool.webp",
 "escudos/malaga.webp",
 "escudos/mancity.webp",
 "escudos/manutd.webp",
 "escudos/napoli.webp",
 "escudos/osasuna.webp",
 "escudos/porto.webp",
 "escudos/psg.webp",
 "escudos/psv.webp",
 "escudos/racing.webp",
 "escudos/rayo.webp",
 "escudos/realmadrid.webp",
 "escudos/realsociedad.webp",
 "escudos/roma.webp",
 "escudos/sevilla.webp",
 "escudos/shakhtar.webp",
 "escudos/slavia.webp",
 "escudos/sporting.webp",
 "escudos/stuttgart.webp",
 "escudos/valencia.webp",
 "escudos/viking.webp",
 "escudos/villarreal.webp"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSION)
      .then(function(c){ return c.addAll(ESTATICOS); })
      .then(function(){ return self.skipWaiting(); })
      .catch(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.map(function(k){
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* La pagina pide datos/resultados.json?t=<reloj> para saltarse la cache del
   navegador. Si guardaramos la peticion tal cual, cada refresco dejaria una
   entrada nueva y la cache creceria sin freno: se guarda sin la parte del ?. */
function claveLimpia(req){
  var u = new URL(req.url);
  u.search = "";
  return u.toString();
}

function aLaRedPrimero(req){
  var clave = claveLimpia(req);
  return fetch(req).then(function(res){
    if(res && res.ok){
      var copia = res.clone();
      caches.open(VERSION).then(function(c){ c.put(clave, copia); });
    }
    return res;
  }).catch(function(){
    return caches.match(clave).then(function(hit){
      return hit || caches.match("index.html");
    });
  });
}

function aLaCachePrimero(req){
  return caches.match(req).then(function(hit){
    if(hit) return hit;
    return fetch(req).then(function(res){
      if(res && (res.ok || res.type === "opaque")){
        var copia = res.clone();
        caches.open(VERSION).then(function(c){ c.put(req, copia); });
      }
      return res;
    });
  });
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch(err){ return; }

  /* fuentes de Google: a la cache primero, y si no hay, a la red */
  if(url.origin !== self.location.origin){
    if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
      e.respondWith(aLaCachePrimero(req));
    }
    return;
  }

  /* la pagina y los datos, siempre frescos si hay red */
  /* ojo con el indexOf: la copia de GitHub Pages cuelga de
     /portal-futbol/, asi que /datos/ no esta al principio de la ruta */
  if(req.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname) || url.pathname.indexOf("/datos/") >= 0){
    e.respondWith(aLaRedPrimero(req));
    return;
  }

  e.respondWith(aLaCachePrimero(req));
});

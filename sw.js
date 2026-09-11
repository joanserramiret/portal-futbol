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
var VERSION = "portal-2026-09-11a";
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
 "escudos/villarreal.webp",
 "canales/mlaliga.webp",
 "canales/mplus.webp",
 "canales/mchamp.webp",
 "canales/dazn.webp",
 "canales/dazn2.webp",
 "canales/orange.webp",
 "canales/copa.webp",
 "canales/la1.webp",
 "canales/tdp.webp"
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

/* ---------- avisos al movil ----------
   El buzon del telefono (Apple o Google) despierta a este archivo aunque la
   web este cerrada y le pasa el texto que ha mandado el ordenador de casa. */
self.addEventListener("push", function(e){
  var d = {titulo: "Portal de futbol", cuerpo: ""};
  try { if (e.data) d = e.data.json(); } catch (err) { try { d.cuerpo = e.data.text(); } catch (err2) {} }
  e.waitUntil(self.registration.showNotification(d.titulo || "Portal de futbol", {
    body: d.cuerpo || "",
    icon: "icono/icono-192.png",
    badge: "icono/icono-192.png",
    lang: "es",
    /* mismo tag por partido y tipo: un gol no se apila con el anterior, pero
       tampoco salen dos veces si el buzon repite el envio */
    tag: (d.partido || "portal") + "|" + (d.tipo || ""),
    renotify: true,
    data: {partido: d.partido || ""}
  }));
});

/* Al tocar el aviso: si la web ya esta abierta se trae al frente, y si no se
   abre. En los dos casos se le dice que partido era, para poder ir a el. */
self.addEventListener("notificationclick", function(e){
  e.notification.close();
  var partido = (e.notification.data || {}).partido || "";
  e.waitUntil(clients.matchAll({type: "window", includeUncontrolled: true}).then(function(lista){
    for (var i = 0; i < lista.length; i++){
      if (lista[i].url.indexOf(self.registration.scope) === 0){
        lista[i].postMessage({abrirPartido: partido});
        return lista[i].focus();
      }
    }
    return clients.openWindow(self.registration.scope + (partido ? "#p=" + encodeURIComponent(partido) : ""));
  }));
});

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

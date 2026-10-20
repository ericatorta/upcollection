// ============================================================
//  DATI DEL NEGOZIO
//  I prodotti sono in assets/data/prodotti.json (pannello /admin).
// ============================================================

// Newsletter (Brevo): incollare qui l'indirizzo "action" del modulo Brevo
// (Moduli > il modulo > Condividi > HTML). Vuoto = iscrizioni non ancora attive.
const NEWSLETTER = { action: "https://c0cea40f.sibforms.com/serve/MUIFAO0J49i_RYzYZ-FH0vz0jv4wC4Mp63fm6_3BIZnsZ0nDirdZPtgTRmtD_yIbCOoNFITWzdEwANN82ZfM21in_McSBInlr4WTSdJdqdbo3EtOAxpWEoVBdF0S3xYj0KbRKC8kLmArmKzV0yc1qBGEEwdmw8vlgV-uPmGH3GvpJRR7GPkc-f_K1TWuRRUKPmF0O1VokiZqdxisMQ==" }; // modulo Brevo "Modulo sito" (lista Newsletter sito, doppia conferma)

const SHOP = {
  name: "Up Collection",
  // Dati societari (obbligatori sul sito di una società, art. 2250 c.c. e art. 35 DPR 633/72)
  company: {
    legalName: "UP COLLECTION DI TORTA FEDERICO E C. S.A.S.",
    vat: "04924200019",
    rea: "TO-670774",
    seat: "Corso Racconigi 159/D, 10141 Torino (TO)",
    pec: "upcollectionsas@pec.it"
  },
  address: "Corso Racconigi 159D, Torino",
  mapsUrl: "https://maps.app.goo.gl/FM2YBDB1PjBqrfrq5",
  phone: "011 331867",
  phoneHref: "+39011331867",
  mobile: "011 331867",
  whatsapp: "39011331867",
  email: "info@upcollectiontorino.com",
  instagram: "https://www.instagram.com/upcollection.torino/",
  facebook: "https://www.facebook.com/p/Up-Collection-Abbigliamento-Torino-100046418003879/",
  tiktok: "https://www.tiktok.com/@upcollection.torino",
  // Marchi venduti. Per aggiungerne uno: metti il logo in assets/img/marchi/ (ritagliato senza margini).
  // ratio: larghezza / altezza del logo. Serve a farli sembrare tutti della stessa grandezza.
  // weight: correzione a occhio (>1 per loghi sottili o chiari, <1 per quelli pieni e pesanti).
  // Se logo è vuoto si vede il nome scritto.
  brands: [
    { name: "Liu Jo", logo: "assets/img/marchi/liu-jo.svg", ratio: 3.47, page: "liu-jo-torino.html" },
    { name: "Armani Exchange", logo: "assets/img/marchi/armani-exchange.svg", ratio: 2.17, weight: 1.35, page: "armani-exchange-torino.html" },
    { name: "Blauer", logo: "assets/img/marchi/blauer.png", ratio: 3.47, weight: 1.05, page: "blauer-torino.html" },
    { name: "Happy Socks", logo: "assets/img/marchi/happy-socks.svg", ratio: 10.45, weight: 0.95, page: "happy-socks-torino.html",
      // fascia nel catalogo: le box regalo invece della foto indossata
      banner: { images: ["assets/img/banner/hs-box-peanuts.jpg", "assets/img/banner/hs-box-merry-cracker.jpg"], type: "regali" } },
    { name: "Gallo", logo: "assets/img/marchi/gallo.svg", ratio: 2.51, weight: 1.05, page: "gallo-torino.html" },
    { name: "North Sails", logo: "assets/img/marchi/north-sails.svg", ratio: 1, weight: 0.92, page: "north-sails-torino.html" },
    { name: "Take Two", logo: "assets/img/marchi/take-two.png", ratio: 2.94, weight: 0.95, page: "take-two-torino.html" },
    { name: "Bomboogie", logo: "assets/img/marchi/bomboogie.png", ratio: 3.35, page: "bomboogie-torino.html" },
    { name: "Jeckerson", logo: "assets/img/marchi/jeckerson.svg", ratio: 10.77, weight: 1.12, page: "jeckerson-torino.html" },
    { name: "Roy Roger's", logo: "assets/img/marchi/roy-rogers.svg", ratio: 9.69, weight: 0.95, page: "roy-rogers-torino.html" },
    { name: "Sun68", logo: "assets/img/marchi/sun68.svg", ratio: 1.9, page: "sun68-torino.html" }
  ],
  hours: [
    { it: "Lunedì", en: "Monday", time: "15:30 – 19:30" },
    { it: "Martedì", en: "Tuesday", time: "9:30 – 12:30 · 15:30 – 19:30" },
    { it: "Mercoledì", en: "Wednesday", time: "9:30 – 12:30 · 15:30 – 19:30" },
    { it: "Giovedì", en: "Thursday", time: "9:30 – 12:30 · 15:30 – 19:30" },
    { it: "Venerdì", en: "Friday", time: "9:30 – 12:30 · 15:30 – 19:30" },
    { it: "Sabato", en: "Saturday", time: "9:30 – 12:30 · 15:30 – 19:30" },
    { it: "Domenica", en: "Sunday", time: { it: "Chiuso", en: "Closed" } }
  ]
};

// I prodotti stanno in assets/data/prodotti.json: si modificano dal pannello /admin
// (o a mano nel file). site.js li carica prima di disegnare le pagine.
let PRODUCTS = [];

// ============================================================
//  HOME: foto dell'apertura (assets/img/hero/) e riquadri per tipo di capo
//  tiles: [tipo di capo, id del prodotto da cui prendere la foto indossata]
// ============================================================
const HERO = {
  images: [1, 2, 3, 4].map((n) => `assets/img/hero/${n}.jpg`),
  tiles: [
    ["donna", "lj-giaccone-montone"],
    ["uomo", "bl-piumino-ballard-nero"]
  ]
};

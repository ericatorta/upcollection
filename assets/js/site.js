// Logica comune: header, footer, lingua e contenuto di ogni pagina.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);

  // ---------- lingua ----------
  let lang = "it";
  try { lang = localStorage.getItem("lang") || "it"; } catch (e) {}
  if (!I18N[lang]) lang = "it";

  const t = (key, vars = {}) =>
    (I18N[lang][key] || key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  // testo nella lingua scelta; se la traduzione inglese manca si usa l'italiano
  const L = (obj) => {
    const v = obj[lang];
    return (Array.isArray(v) ? v.length : v) ? v : obj.it;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const price = (n) => new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-GB", {
    style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0
  }).format(n);
  const waLink = (msg) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(msg)}`;

  const brandNames = () => new Intl.ListFormat(lang, { type: "conjunction" })
    .format(SHOP.brands.map((b) => b.name));

  // aggiorna titolo e descrizione (anche quelli per l'anteprima social)
  function setMeta(title, desc) {
    document.title = title;
    const set = (sel, v) => { const m = document.querySelector(sel); if (m) m.setAttribute("content", v); };
    set('meta[name="description"]', desc);
    set('meta[property="og:title"]', title);
    set('meta[property="og:description"]', desc);
  }

  function setLang(l) {
    lang = l;
    try { localStorage.setItem("lang", l); } catch (e) {}
    render();
  }

  // ---------- pezzi riutilizzabili ----------
  const logo = () => `
    <svg class="logo" viewBox="0 0 600 150" role="img" aria-label="Up Collection">
      <ellipse cx="300" cy="75" rx="296" ry="71" fill="none" stroke="currentColor" stroke-width="3"/>
      <text x="300" y="95" text-anchor="middle" textLength="470" lengthAdjust="spacing"
        font-family="'Times New Roman', Times, serif" font-size="58" fill="currentColor">UP COLLECTION</text>
    </svg>`;

  const photos = (p) => p.images || (p.img ? [p.img] : []);
  // schede: il browser sceglie tra la foto piccola (600 px, "-s.jpg", creata da strumenti/ottimizza-foto.sh)
  // e quella grande in base a quanto è larga la scheda (cardSizes cambia con la vista a 2/3/4 colonne)
  let cardSizes = "(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw";
  const srcset = (src) => /^assets\/img\/(prodotti|banner)\/.+\.jpg$/.test(src || "") && !/\/caricate\//.test(src)
    ? `${src.replace(/\.jpg$/, "-s.jpg")} 600w, ${src} 1200w` : "";
  const cardImg = (src, alt) => srcset(src)
    ? `<img src="${esc(src)}" srcset="${esc(srcset(src))}" sizes="${cardSizes}" alt="${alt}" loading="lazy">`
    : `<img src="${esc(src)}" alt="${alt}" loading="lazy">`;
  const media = (p, full) => photos(p).length
    ? (full ? `<img src="${esc(photos(p)[0])}" alt="${esc(L(p.name))}" loading="lazy">` : cardImg(photos(p)[0], esc(L(p.name))))
    : `<div class="ph" style="--tone:${p.tone}"><span>UP</span><small>${t("ph.photo")}</small></div>`;

  // scheda prodotto: /prodotto/<id> (pagina vera per Google, creata da strumenti/build.py)
  const prodUrl = (p) => `/prodotto/${encodeURIComponent(p.id)}`;
  const fullNameOf = (p) => (p.brand ? p.brand + " – " : "") + L(p.name);
  const chevron = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`;

  // card prodotto: foto (con frecce per sfogliarle), nome, prezzo, colore e link WhatsApp
  const card = (p) => `
    <div class="card" data-id="${p.id}">
      <div class="card-media">
        <a class="card-img" href="${prodUrl(p)}" tabindex="-1">${media(p)}${photos(p)[1] ? cardImg(photos(p)[1], "").replace("<img ", '<img class="alt" aria-hidden="true" ') : ""}</a>
        ${photos(p).length > 1 ? `
          <button class="card-arrow prev" data-step="-1" aria-label="‹">${chevron("M15 5l-7 7 7 7")}</button>
          <button class="card-arrow next" data-step="1" aria-label="›">${chevron("M9 5l7 7-7 7")}</button>` : ""}
        ${p.isNew || p.lowStock || p.collection || p.type === "regali" ? `<span class="tags">${
          p.type === "regali" ? `<em class="tag tag-gift">${t("tag.gift")}</em>` : ""}${
          p.collection ? `<em class="tag tag-special">${esc(p.collection)}</em>` : ""}${
          p.isNew && p.type !== "regali" ? `<em class="tag">${t("tag.new")}</em>` : ""}${
          p.lowStock ? `<em class="tag tag-low">${t("tag.low")}</em>` : ""}</span>` : ""}
      </div>
      <a class="card-info" href="${prodUrl(p)}">
        ${p.brand ? `<span class="card-brand">${esc(p.brand)}</span>` : ""}
        <span class="card-name">${esc(L(p.name))}</span>
        <span class="card-price">${price(p.price)}</span>
        <span class="card-color">${esc(L(p.color))}</span>
      </a>
      <a class="card-cta" href="${waLink(t("wa.msg", { name: fullNameOf(p), size: "" }))}" target="_blank" rel="noopener">${t("card.cta")}</a>
    </div>`;

  // fila orizzontale "Selezionato per te"
  const track = (list, attrs = "") => `
      <div class="carousel-wrap" ${attrs}>
        <button class="carousel-arrow prev" data-scroll="-1" aria-label="‹">${chevron("M15 5l-7 7 7 7")}</button>
        <div class="carousel-track${list.length <= 4 ? " few" : ""}">${list.map(card).join("")}</div>
        <button class="carousel-arrow next" data-scroll="1" aria-label="›">${chevron("M9 5l7 7-7 7")}</button>
      </div>`;
  const carousel = (list, title, more) => list.length ? `
    <section class="carousel">
      <h2 class="carousel-title">${title}</h2>
      ${more ? `<a class="carousel-more" href="${more}">${t("carousel.all")}</a>` : ""}
      ${track(list)}
    </section>` : "";
  // più file con le schede in alto (es. Potrebbe piacerti | Visti di recente); le schede vuote non si vedono
  const tabbedCarousel = (tabs) => {
    tabs = tabs.filter(([, , list]) => list.length);
    if (!tabs.length) return "";
    return `
    <section class="carousel">
      <div class="ctabs">${tabs.map(([k, title], i) =>
        `<button class="ctab${i ? "" : " on"}" data-tab="${k}">${title}</button>`).join("")}</div>
      ${tabs.map(([k, , list], i) => track(list, `data-pane="${k}"${i ? " hidden" : ""}`)).join("")}
    </section>`;
  };

  // galleria della scheda: in colonna su computer, a scorrimento su telefono
  const gallery = (p) => {
    const list = photos(p);
    if (list.length < 2) return media(p, true);
    return `<div class="gallery">${list.map((src, i) =>
      `<img src="${esc(src)}" alt="${esc(L(p.name))} – ${t("p.photo", { n: i + 1, tot: list.length })}"
        ${i ? 'loading="lazy"' : ""}>`).join("")}</div>
      <p class="gallery-count"><span>1</span> / ${list.length}</p>`;
  };

  // dati del prodotto per Google (prezzo, marchio, foto, disponibilità in negozio)
  function productSchema(p) {
    $$("script[data-product-ld]").forEach((x) => x.remove());
    // senza foto Google scarta la scheda prodotto: niente dati strutturati
    if (!photos(p).length) return;
    const abs = (u) => new URL(u, location.href).href;
    const ld = {
      "@context": "https://schema.org", "@type": "Product",
      name: L(p.name), description: L(p.bullets).join(". "), sku: p.code || p.id,
      image: photos(p).map(abs),
      color: L(p.color),
      offers: { "@type": "Offer", price: p.price, priceCurrency: "EUR",
        availability: "https://schema.org/InStoreOnly", url: location.href }
    };
    if (p.brand) ld.brand = { "@type": "Brand", name: p.brand };
    const el = document.createElement("script");
    el.type = "application/ld+json"; el.dataset.productLd = "";
    el.textContent = JSON.stringify(ld);
    document.head.appendChild(el);
  }

  // reparti e tipi di capo, nell'ordine del menu; i tipi non elencati finiscono in fondo
  const GENDERS = ["donna", "uomo"];
  const CLOTHES = ["capispalla", "maglieria", "felpe", "camicie", "tshirt", "pantaloni", "abiti"];
  const ACCESSORIES = ["regali", "borse", "calze", "sciarpe", "cappelli", "cinture"];
  // in evidenza: prima le confezioni regalo, poi le collezioni speciali, poi le novità
  const highlight = (p) => (p.type === "regali") * 2 + !!p.collection;
  const byHighlight = (a, b) => (highlight(b) - highlight(a)) || (b.isNew - a.isNew);
  // ordine del catalogo: prima le novità, alternando i marchi (un capo per marchio a giro)
  const mixBrands = (list) => {
    const groups = {};
    [...list].sort((a, b) => b.isNew - a.isNew).forEach((p) => (groups[p.brand || ""] ||= []).push(p));
    const out = [], qs = Object.values(groups);
    while (out.length < list.length) qs.forEach((q) => { if (q.length) out.push(q.shift()); });
    return out;
  };
  // stesso articolo in uomo e donna (stesso codice e colore): nelle file e nella pagina marchio basta una card
  const uniqueByCode = (list) => {
    const seen = new Set();
    return list.filter((p) => {
      if (!p.code) return true;
      const key = p.code + "|" + p.color.it;
      return seen.has(key) ? false : seen.add(key);
    });
  };
  const groupOf = (type) => ACCESSORIES.includes(type) ? "accessori" : "abbigliamento";
  const typeRank = (ty) => {
    const i = [...CLOTHES, ...ACCESSORIES].indexOf(ty);
    return i < 0 ? 99 : i;
  };

  const navLinks = () => GENDERS
    .map((c) => `<a href="${c}.html">${t("nav." + c)}</a>`).join("")
    + `<a href="negozio.html">${t("nav.negozio")}</a>`;

  // colonne del menu (come liujo.com): solo i tipi che hanno davvero dei capi in quel reparto
  function megaCols(cat) {
    const mine = PRODUCTS.filter((p) => p.cat === cat);
    const url = (q) => `catalogo.html?cat=${cat}&${q}`;
    const cols = [];
    const fresh = ["abbigliamento", "accessori"].filter((g) => mine.some((p) => p.isNew && groupOf(p.type) === g));
    if (fresh.length) cols.push([t("nav.nuovi"), url("nuovi=1"),
      fresh.map((g) => [t("nav." + g), url("nuovi=1&gruppo=" + g)])]);
    ["abbigliamento", "accessori"].forEach((g) => {
      const types = [...new Set(mine.filter((p) => groupOf(p.type) === g).map((p) => p.type))]
        .sort((a, b) => typeRank(a) - typeRank(b));
      if (types.length) cols.push([t("nav." + g), url("gruppo=" + g),
        types.map((ty) => [t("type." + ty), url("type=" + ty)])]);
    });
    // marchi del reparto: portano a tutti i capi di quel marchio
    const brands = [...new Set(mine.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    if (brands.length) cols.push([t("nav.marchi"), "",
      brands.map((b) => [b, url("brand=" + encodeURIComponent(b))])]);
    return cols.map(([title, href, links]) => `
      <div class="mega-col">
        ${href ? `<a class="mega-title" href="${href}">${title}</a>` : `<span class="mega-title">${title}</span>`}
        ${links.map(([label, h]) => `<a href="${h}">${label}</a>`).join("")}
      </div>`).join("");
  }

  const megaNav = () => GENDERS.map((c) => `
      <div class="nav-item">
        <a href="${c}.html">${t("nav." + c)}</a>
        <div class="mega"><div class="mega-inner">${megaCols(c)}</div></div>
      </div>`).join("")
    + `<a href="negozio.html">${t("nav.negozio")}</a>`;

  const drawerNav = () => GENDERS.map((c) => `
      <details class="dgroup">
        <summary>${t("nav." + c)}</summary>
        <div class="dlinks">
          <a class="mega-title" href="${c}.html">${t("nav.vedi")}</a>
          ${megaCols(c)}
        </div>
      </details>`).join("")
    + `<a href="negozio.html">${t("nav.negozio")}</a>`;

  const langSwitch = () => `
    <div class="lang">
      <button data-lang="it" class="${lang === "it" ? "on" : ""}">IT</button>
      <span>/</span>
      <button data-lang="en" class="${lang === "en" ? "on" : ""}">EN</button>
    </div>`;

  // ---------- header e footer ----------
  function header() {
    const el = $("#site-header");
    el.innerHTML = `
      <div class="bar">
        <button class="menu-btn" aria-label="${t("nav.menu")}" aria-expanded="false"><span></span><span></span></button>
        <a href="index.html" class="brand">${logo()}</a>
        <nav class="nav">${megaNav()}</nav>
        <div class="bar-right">
          <a class="search-link" href="catalogo.html?cerca=1" aria-label="${t("f.search")}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.4"/></svg>
          </a>
          ${langSwitch()}
        </div>
      </div>
      <div class="drawer">
        <nav>${drawerNav()}</nav>
        <div class="drawer-foot">
          <a href="tel:${SHOP.phoneHref}">${SHOP.phone}</a>
          <a href="${SHOP.instagram}" target="_blank" rel="noopener">Instagram</a>
        </div>
      </div>`;
  }

  // icone social (tratto sottile, colore del testo)
  const ICONS = {
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/>',
    facebook: '<path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z" fill="currentColor"/>',
    tiktok: '<path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z" fill="currentColor"/>',
    whatsapp: '<path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.2 8.3c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.4.5c-.1.1-.2.3 0 .5.3.6.8 1.2 1.3 1.6.6.5 1.1.7 1.5.9.2.1.4 0 .5-.1l.6-.7c.2-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.4 0 .5-.2 1.1-.6 1.4-.5.4-1.1.6-1.8.5-1.3-.2-2.7-.9-3.9-2s-2-2.4-2.3-3.6c-.2-.8.1-1.6.5-2.3z" fill="currentColor"/>'
  };
  const social = (name, href) => `<a class="social" href="${href}" target="_blank" rel="noopener" aria-label="${name}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg></a>`;

  function footer() {
    const c = SHOP.company;
    $("#site-footer").innerHTML = `
      <div class="wrap foot-grid">
        <div class="foot-brand">${logo()}</div>
        <div>
          <h4>${t("footer.contacts")}</h4>
          <!-- contatti una volta sola: stesso numero per telefono e WhatsApp -->
          <a href="${SHOP.mapsUrl}" target="_blank" rel="noopener">${SHOP.address}</a>
          <span><a href="tel:${SHOP.phoneHref}">${SHOP.phone}</a> · <a href="${waLink(t("wa.generic"))}" target="_blank" rel="noopener">WhatsApp</a></span>
          <a href="mailto:${SHOP.email}">${SHOP.email}</a>
        </div>
        <div>
          <h4>${t("footer.shop")}</h4>
          <a href="abbigliamento-donna-torino">${t("footer.seo.donna")}</a>
          <a href="abbigliamento-uomo-torino">${t("footer.seo.uomo")}</a>
          <a href="piumini-torino">${t("footer.seo.piumini")}</a>
        </div>
        <div>
          <h4>${t("footer.visit")}</h4>
          <a href="negozio.html">${t("footer.about")}</a>
          <a href="index.html#marchi">${t("footer.brands")}</a>
          <a href="privacy.html">${t("footer.privacy")}</a>
        </div>
      </div>
      <div class="wrap foot-bar">
        <div class="foot-social">
          ${social("instagram", SHOP.instagram)}
          ${social("facebook", SHOP.facebook)}
          ${social("tiktok", SHOP.tiktok)}
          ${social("whatsapp", waLink(t("wa.generic")))}
        </div>
      </div>
      <div class="wrap foot-legal">
        © ${new Date().getFullYear()} ${c.legalName} ${t("footer.rights")}
        ${t("footer.vat")} ${c.vat}. ${t("footer.rea")} ${c.rea}. ${t("footer.seat")}: ${c.seat}.
      </div>`;
  }


  // ogni contatto ha la sua etichetta: [etichetta, testo, link, apre in nuova scheda]
  const contacts = () => [
    [t("c.address"), SHOP.address, SHOP.mapsUrl, true],
    [t("c.phone"), SHOP.phone, `tel:${SHOP.phoneHref}`, false],
    [t("c.whatsapp"), SHOP.mobile, waLink(t("wa.generic")), true],
    [t("c.email"), SHOP.email, `mailto:${SHOP.email}`, false]
  ];
  const ext = (blank) => blank ? ` target="_blank" rel="noopener"` : "";

  const contactList = () => `
    <ul class="info-list">${contacts().map(([label, text, href, blank]) =>
      `<li><span class="label">${label}</span><a href="${href}"${ext(blank)}>${text}</a></li>`).join("")}
    </ul>`;

  const hoursList = () => SHOP.hours.length
    ? `<ul class="info-list hours">${SHOP.hours.map((h, i) =>
        // SHOP.hours parte da lunedì, getDay() da domenica
        `<li class="${i === (new Date().getDay() + 6) % 7 ? "today" : ""}"><span>${L(h)}</span>` +
        `<span>${typeof h.time === "string" ? h.time : L(h.time)}</span></li>`).join("")}</ul>`
    : `<p class="muted">${t("hours.tbd")}</p>`;

  // stessa "superficie" per tutti i loghi: quelli lunghi diventano più bassi, quelli quadrati più alti
  const logoScale = (b) => ((b.weight || 1) / Math.sqrt(b.ratio || 3)).toFixed(3);

  const brandList = () => `
    <ul class="brands">${SHOP.brands.map((b) => b.logo
      ? `<li class="has-logo">${b.page ? `<a href="${b.page}">` : ""}<img src="${esc(b.logo)}" alt="${esc(b.name)}" loading="lazy"
          style="--k:${logoScale(b)}">${b.page ? "</a>" : ""}</li>`
      : `<li>${esc(b.name)}</li>`).join("")}</ul>
    <p class="eyebrow muted brands-more">${t("brands.more")}</p>
    <p class="brands-text">${t("brands.text", { brands: brandNames() })}</p>`;

  const storeActions = () => `
    <a class="btn btn-solid" href="${SHOP.mapsUrl}" target="_blank" rel="noopener">${t("store.directions")}</a>
    <a class="btn btn-line" href="tel:${SHOP.phoneHref}">${t("store.call")}</a>
    <a class="btn btn-line" href="${waLink(t("wa.generic"))}" target="_blank" rel="noopener">${t("store.whatsapp")}</a>`;

  let mapLoaded = false;
  function mapBoxes() {
    $$(".map-box").forEach((box) => {
      if (mapLoaded) {
        if (!box.querySelector("iframe")) {
          box.innerHTML = `<iframe title="${t("map.title")}" src="${box.dataset.map}"></iframe>`;
        }
        return;
      }
      box.innerHTML = `
        <div class="map-consent">
          <svg class="map-pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
          <p class="map-addr">${SHOP.address}</p>
          <button class="btn btn-solid map-show">${t("map.show")}</button>
          <a class="link-under eyebrow" href="${SHOP.mapsUrl}" target="_blank" rel="noopener">${t("map.open")}</a>
          <p class="map-note">${t("map.note")}</p>
        </div>`;
    });
  }

  // ---------- filtri del catalogo (Ordina e filtra) ----------
  const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const sizeRank = (v) => {
    const i = SIZE_ORDER.indexOf(v);
    return i >= 0 ? i : v === "U" ? 999 : 100 + parseFloat(v);
  };
  const PRICE_BANDS = [[0, 100], [100, 150], [150, 200], [200, Infinity]];
  const priceBand = (n) => PRICE_BANDS.findIndex(([a, b]) => n >= a && n < b);
  const norm = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const FACETS = ["type", "brand", "size", "color", "price"];

  // stato dei filtri, letto dall'indirizzo (così un link filtrato si può condividere)
  const st = { cat: params.get("cat") || "tutto", q: params.get("q") || "", sort: params.get("sort") || "new" };
  FACETS.forEach((f) => { st[f] = new Set((params.get(f) || "").split(",").filter(Boolean)); });
  st.nuovi = params.get("nuovi") === "1";
  st.gruppo = params.get("gruppo") || "";
  if (st.cat === "accessori") { st.cat = "tutto"; st.gruppo = "accessori"; } // vecchi link

  const facetVals = (p, f) => ({
    // le confezioni regalo di calze compaiono anche tra le Calze
    type: p.type === "regali" ? ["regali", "calze"] : [p.type], brand: p.brand ? [p.brand] : [], size: p.sizes,
    color: [p.color.it], price: [String(priceBand(p.price))]
  })[f];
  const colorOf = (v) => PRODUCTS.find((p) => p.color.it === v);
  const facetLabel = (f, v) =>
    f === "type" ? t("type." + v) :
    f === "size" ? (v === "U" ? t("size.U") : v) :
    f === "color" ? L(colorOf(v).color) :
    f === "price" ? t("price." + v) : v;

  // un capo passa i filtri? (skip = filtro da ignorare, serve per contare le opzioni)
  function matches(p, skip) {
    if (st.cat !== "tutto" && p.cat !== st.cat) return false;
    if (st.nuovi && !p.isNew) return false;
    if (st.gruppo && groupOf(p.type) !== st.gruppo) return false;
    if (st.q) {
      const hay = norm([p.name.it, p.name.en, p.brand, p.color.it, p.color.en,
        I18N.it["type." + p.type], I18N.en["type." + p.type], ...p.bullets.it, ...p.bullets.en, p.code].join(" "));
      if (!norm(st.q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false;
    }
    return FACETS.every((f) => f === skip || !st[f].size || facetVals(p, f).some((v) => st[f].has(v)));
  }

  function facetOptions(f) {
    const counts = new Map();
    PRODUCTS.filter((p) => matches(p, f)).forEach((p) =>
      facetVals(p, f).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1)));
    st[f].forEach((v) => { if (!counts.has(v)) counts.set(v, 0); });
    const keys = [...counts.keys()];
    if (f === "size") keys.sort((a, b) => sizeRank(a) - sizeRank(b));
    else if (f === "price") keys.sort();
    else keys.sort((a, b) => facetLabel(f, a).localeCompare(facetLabel(f, b)));
    return keys.map((k) => [k, counts.get(k)]);
  }

  function saveState() {
    const q = new URLSearchParams();
    if (st.cat !== "tutto") q.set("cat", st.cat);
    if (st.nuovi) q.set("nuovi", "1");
    if (st.gruppo) q.set("gruppo", st.gruppo);
    if (st.q) q.set("q", st.q);
    if (st.sort !== "new") q.set("sort", st.sort);
    FACETS.forEach((f) => { if (st[f].size) q.set(f, [...st[f]].join(",")); });
    history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
  }

  const activeCount = () => FACETS.reduce((n, f) => n + st[f].size, 0) + (st.q ? 1 : 0);

  // titolo della pagina: reparto · nuovi arrivi · abbigliamento/accessori (o il tipo, se è uno solo)
  const catTitle = () => [
    st.cat !== "tutto" && t("nav." + st.cat),
    st.nuovi && t("nav.nuovi"),
    st.gruppo && t("nav." + st.gruppo),
    !st.gruppo && st.type.size === 1 && t("type." + [...st.type][0]),
    st.brand.size === 1 && [...st.brand][0]
  ].filter(Boolean).join(" · ");

  function updateCatalog() {
    let list = PRODUCTS.filter((p) => matches(p));
    if (st.sort === "asc") list.sort((a, b) => a.price - b.price);
    if (st.sort === "desc") list.sort((a, b) => b.price - a.price);
    if (st.sort === "new") list = mixBrands(list);

    $("#cat-title").textContent = catTitle() || t("nav.tutto");
    $("#filters").innerHTML = ["tutto", ...GENDERS].map((c) =>
      `<button data-cat="${c}" class="${c === st.cat ? "on" : ""}">${t("nav." + c)}</button>`).join("");
    $("#count").textContent = list.length === 1 ? t("count.one") : t("count.many", { n: list.length });
    const sections = sectionsOf(list);
    const grouped = isGrouped(sections);
    $("#grid").className = grouped ? "pgroups" : "pgrid";
    $("#cattiles").innerHTML = grouped ? catTiles(sections) : "";
    $("#catnav").innerHTML = catNav(grouped);
    $("#catnav").hidden = !$("#catnav").innerHTML;
    const b = bannerFor(list);
    if (grouped) {
      gridCols = curCols();
      const html = sectionRows(sections, gridCols).map(rowHtml);
      if (b && html.length > 2) html.splice(2, 0, b);
      $("#grid").innerHTML = html.join("");
    } else {
      const cards = list.map(card);
      if (b && cards.length > 8) cards.splice(8, 0, b);
      $("#grid").innerHTML = cards.length ? cards.join("")
        : `<p class="empty">${t("f.none")} <button class="link-under" data-clear>${t("f.clear")}</button></p>`;
    }
    // le prime foto sono subito visibili: caricarle senza aspettare (lazy solo per quelle sotto)
    $$("#grid .card-img img:not(.alt)").slice(0, 4).forEach((i) => { i.loading = "eager"; });
    renderViews();

    // "Selezionato per te": capi con foto che non sono già nella griglia
    const shown = new Set(list.map((p) => p.id));
    const picks = PRODUCTS.filter((p) => photos(p).length && !shown.has(p.id));
    const extra = picks.length >= 4 ? picks : [...picks, ...PRODUCTS.filter((p) => photos(p).length && shown.has(p.id))];
    $("#picks").innerHTML = carousel(extra.slice(0, 12), t("carousel.picks"), "catalogo.html");

    // filtri attivi sotto la barra, ognuno si toglie con la ×
    const chips = [];
    if (st.nuovi) chips.push(`<button class="chip" data-nuovi>${t("nav.nuovi")} <span>×</span></button>`);
    if (st.gruppo) chips.push(`<button class="chip" data-gruppo>${t("nav." + st.gruppo)} <span>×</span></button>`);
    if (st.q) chips.push(`<button class="chip" data-q>“${esc(st.q)}” <span>×</span></button>`);
    FACETS.forEach((f) => st[f].forEach((v) =>
      chips.push(`<button class="chip" data-f="${f}" data-v="${esc(v)}">${esc(facetLabel(f, v))} <span>×</span></button>`)));
    if (chips.length > 1) chips.push(`<button class="chip chip-clear" data-clear>${t("f.clear")}</button>`);
    $("#chips").innerHTML = chips.join("");

    // opzioni del pannello, con il numero di capi per ciascuna
    $$("#f-sort [data-sort]").forEach((b) => b.classList.toggle("on", b.dataset.sort === st.sort));
    FACETS.forEach((f) => {
      const opts = facetOptions(f);
      $("#f-" + f).innerHTML = opts.map(([v, n]) => {
        const on = st[f].has(v) ? " on" : "";
        const dis = !n && !on ? " disabled" : "";
        if (f === "size") return `<button class="fopt-size${on}" data-f="size" data-v="${esc(v)}"${dis}>${esc(facetLabel(f, v))}</button>`;
        const sw = f === "color" ? `<i class="swatch" style="--c:${colorOf(v).tone}"></i>` : "";
        return `<button class="fopt${on}" data-f="${f}" data-v="${esc(v)}"${dis}><span class="fbox"></span>${sw}${esc(facetLabel(f, v))}<em>${n}</em></button>`;
      }).join("");
      $(`.fsec[data-sec="${f}"]`).classList.toggle("has-on", st[f].size > 0);
      $(`.fsec[data-sec="${f}"]`).hidden = !opts.length;
    });
    $("#f-show").textContent = list.length === 1 ? t("f.show1") : t("f.show", { n: list.length });
    $(".tool-main").dataset.n = activeCount() || "";

    saveState();
    const catName = catTitle() || t("seo.catalog");
    setMeta(t("seo.cat.title", { cat: catName }), t("seo.cat.desc", { cat: catName }));
  }

  // ---------- catalogo diviso per tipo di capo (Giacche, Maglieria, Calze…) ----------
  // con l'ordine "Novità" e nessun tipo scelto i capi sono raggruppati in sezioni, nell'ordine del menu;
  // con un ordine per prezzo, una ricerca o un tipo scelto resta la griglia unica
  const sectionsOf = (list) => {
    const by = {};
    list.forEach((p) => (by[p.type] ||= []).push(p));
    return Object.keys(by).sort((a, b) => typeRank(a) - typeRank(b)).map((type) => ({ type, items: by[type] }));
  };
  const isGrouped = (sections) => st.sort === "new" && !st.type.size && !st.q && sections.length > 1;
  const openSecs = new Set(); // sezioni lunghe aperte con "Mostra tutti"

  // riquadri in alto: una foto per categoria, portano alla sezione
  const coverOf = (items) => items.find((p) => photos(p).length && p.isNew) || items.find((p) => photos(p).length);
  const catTiles = (sections) => `
    <div class="cattiles">${sections.map(({ type, items }) => {
      const cover = coverOf(items);
      return `<a class="cattile" href="#sec-${type}" data-go="${type}">
        <span class="cattile-img">${cover ? cardImg(photos(cover)[0], "")
          .replace('loading="lazy"', 'loading="eager"').replace(/sizes="[^"]*"/, 'sizes="200px"') : ""}</span>
        <span class="cattile-name">${t("type." + type)}</span>
        <span class="cattile-n">${items.length}</span>
      </a>`;
    }).join("")}</div>`;

  // barra delle categorie sotto "Ordina e filtra": con le sezioni porta alla sezione,
  // con un tipo scelto cambia tipo ("Tutto" torna alle sezioni)
  function catNav(grouped) {
    if (st.q || st.type.size > 1) return "";
    const counts = {};
    // con le sezioni i numeri sono quelli delle sezioni; come filtro le confezioni regalo contano anche tra le Calze
    PRODUCTS.filter((p) => matches(p, "type")).forEach((p) =>
      (grouped ? [p.type] : facetVals(p, "type")).forEach((ty) => { counts[ty] = (counts[ty] || 0) + 1; }));
    const types = Object.keys(counts).sort((a, b) => typeRank(a) - typeRank(b));
    if (types.length < 2) return "";
    const cur = [...st.type][0];
    // linea sottile tra abbigliamento e accessori
    const firstAcc = types.findIndex((ty) => groupOf(ty) === "accessori");
    const pill = (ty, label, n, cls) => `<button class="catpill${cls}" ${grouped ? "data-go" : "data-pick"}="${ty}">${label}${n ? `<sup>${n}</sup>` : ""}</button>`;
    return (grouped ? "" : pill("", t("nav.tutto"), 0, ""))
      + types.map((ty, i) => pill(ty, t("type." + ty), counts[ty],
        (ty === cur ? " on" : "") + (i && i === firstAcc ? " gap" : ""))).join("");
  }

  // le categorie con pochi capi (meno di una riga) stanno affiancate nella stessa riga,
  // così non restano righe quasi vuote; abbigliamento e accessori non si mescolano
  let gridCols = 0;
  function sectionRows(sections, cols) {
    const rows = [];
    let row = [], used = 0;
    const flush = () => { if (row.length) rows.push(row); row = []; used = 0; };
    sections.forEach((sec) => {
      const n = sec.items.length;
      const fits = n < cols && used + n <= cols && (!row.length || groupOf(row[0].type) === groupOf(sec.type));
      if (!fits) flush();
      row.push(sec);
      if (n < cols) used += n; else flush();
    });
    flush();
    return rows;
  }
  // "Accessori" scritto sopra la prima sezione di accessori (se prima c'è abbigliamento)
  let groupShown = false;
  const groupLabel = (sec, i) => {
    if (i === 0) { groupShown = groupOf(sec.type) === "accessori"; return ""; }
    if (groupShown || groupOf(sec.type) !== "accessori") return "";
    groupShown = true;
    return `<p class="eyebrow psec-group">${t("nav.accessori")}</p>`;
  };
  let secIndex = 0;
  const sectionHtml = ({ type, items }, mini) => `
    <section class="psec${mini ? " mini" : ""}${openSecs.has(type) ? " open" : ""}" id="sec-${type}" data-type="${type}"
      ${mini ? `style="--span:${items.length}"` : ""}>
      <header class="psec-head">
        <h2>${t("type." + type)}</h2>
        <span class="psec-n">${items.length === 1 ? t("count.one") : t("count.many", { n: items.length })}</span>
      </header>
      <div class="pgrid">${mixBrands(items).map(card).join("")}</div>
      ${mini ? "" : `<button class="psec-more" data-more="${type}" hidden></button>`}
    </section>`;
  const rowHtml = (row, i) => {
    if (i === 0) secIndex = 0;
    const label = groupLabel(row[0], secIndex);
    secIndex += row.length;
    return label + (row.length === 1 ? sectionHtml(row[0], false)
      : `<div class="psec-row">${row.map((sec) => sectionHtml(sec, true)).join("")}</div>`);
  };

  // sezioni lunghe: si vedono le prime righe (2 su computer, 3 su telefono), il resto con "Mostra tutti"
  function limitSections(cols) {
    const lim = cols * (cols >= 3 ? 2 : 3);
    $$(".psec:not(.mini)").forEach((sec) => {
      const cards = $$(".card", sec);
      const long = cards.length > Math.ceil(lim * 1.5);
      const open = sec.classList.contains("open");
      cards.forEach((c, i) => { c.hidden = long && !open && i >= lim; });
      const btn = $(".psec-more", sec);
      btn.hidden = !long;
      btn.textContent = open ? t("sec.less") : t("sec.more", { n: cards.length });
    });
  }

  // altezza delle barre fisse in alto: serve per fermarsi giusto sotto quando si salta a una sezione
  const stickyH = () => $("#site-header").offsetHeight + $(".catalog .toolbar").offsetHeight;
  function goToSection(type) {
    const sec = $("#sec-" + type) && ($("#sec-" + type).closest(".psec-row") || $("#sec-" + type));
    if (!sec) return;
    window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - stickyH() + 1, behavior: "smooth" });
  }
  // mentre si scorre si accende la categoria che si sta guardando
  function spySections() {
    const secs = $$(".psec");
    if (!secs.length) return;
    const line = stickyH() + 40;
    // tutte le sezioni della riga che si sta guardando (quelle piccole sono affiancate)
    const tops = secs.map((s) => (s.closest(".psec-row") || s).getBoundingClientRect().top);
    const passed = tops.filter((y) => y <= line);
    const rowTop = passed.length ? Math.max(...passed) : null;
    const cur = new Set(secs.filter((s, i) => rowTop !== null && Math.abs(tops[i] - rowTop) < 2).map((s) => s.dataset.type));
    const nav = $("#catnav");
    let first = true;
    $$("[data-go]", nav).forEach((b) => {
      const on = cur.has(b.dataset.go);
      if (on && first && !b.classList.contains("on")) nav.scrollTo({ left: b.offsetLeft - 24, behavior: "smooth" });
      if (on) first = false;
      b.classList.toggle("on", on);
    });
  }

  // banner a tutta larghezza dopo le prime righe: il marchio più presente tra i capi mostrati
  function bannerFor(list) {
    if (st.brand.size) return "";
    // conta solo i capi d'abbigliamento (calze e accessori no), se ce ne sono tra quelli mostrati
    const ACCESSORI = ["calze", "regali", "cinture", "sciarpe", "cappelli", "borse"];
    const clothes = list.filter((p) => !ACCESSORI.includes(p.type));
    const counts = {};
    (clothes.length ? clothes : list).forEach((p) => { if (p.brand && photos(p).length > 1) counts[p.brand] = (counts[p.brand] || 0) + 1; });
    const brand = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (!brand) return "";
    const hero = list.find((p) => p.brand === brand && photos(p).length > 1);
    const info = SHOP.brands.find((b) => b.name === brand) || {};
    const page = info.page;
    if (info.banner) {
      // fascia chiara con le foto scelte (es. box regalo Happy Socks) e link alla loro categoria
      const cat = st.cat !== "tutto" ? `cat=${st.cat}&` : "";
      return `<a class="pbanner pbanner-light" href="catalogo.html?${cat}type=${info.banner.type}">
        <span class="pbanner-text">
          <small>${esc(brand)}</small>
          <strong>${t("type." + info.banner.type)}</strong>
          <em>${t("banner.cta")}</em>
        </span>
        <span class="pbanner-imgs">${info.banner.images.map((src) =>
          `<img src="${esc(src)}" alt="" loading="lazy">`).join("")}</span>
      </a>`;
    }
    return `<a class="pbanner" href="${page || `catalogo.html?brand=${encodeURIComponent(brand)}`}">
      <img src="${esc(photos(hero)[1])}" alt="" loading="lazy">
      <span class="pbanner-text">
        <small>${t("banner.kicker")}</small>
        <strong>${esc(brand)}</strong>
        <em>${t("banner.cta")}</em>
      </span>
    </a>`;
  }

  // scelta di quante colonne vedere (come su Armani), ricordata nel browser
  const VIEWS_DESK = [2, 3, 4], VIEWS_MOB = [1, 2];
  let gridView = 0;
  try { gridView = +localStorage.getItem("gridView") || 0; } catch (e) {}
  const isMobile = () => matchMedia("(max-width: 640px)").matches;
  const defaultView = () => isMobile() ? 2 : matchMedia("(max-width: 860px)").matches ? 3 : 4;
  const curCols = () => {
    const opts = isMobile() ? VIEWS_MOB : VIEWS_DESK;
    return opts.includes(gridView) ? gridView : defaultView();
  };
  function renderViews() {
    // con le sezioni affiancate cambiare colonne vuol dire ridisporle
    if ($("#grid.pgroups") && gridCols && gridCols !== curCols()) { updateCatalog(); return; }
    const opts = isMobile() ? VIEWS_MOB : VIEWS_DESK;
    const cur = curCols();
    $("#grid").style.setProperty("--cols", cur);
    cardSizes = `${Math.ceil(100 / cur)}vw`;
    $$("#grid .card-img img[srcset]").forEach((i) => { i.sizes = cardSizes; });
    limitSections(cur);
    $("#views").innerHTML = opts.map((n) => `
      <button class="view-btn${n === cur ? " on" : ""}" data-view="${n}" aria-label="${n}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${Array.from({ length: n }, (_, i) => {
          const w = 18 / n;
          return `<rect x="${3 + i * w}" y="4" width="${w}" height="16" fill="none" stroke="currentColor" stroke-width="1.1"/>`;
        }).join("")}</svg>
      </button>`).join("");
  }
  window.addEventListener("resize", () => { if (page === "catalog") renderViews(); });

  function openPanel(sec) {
    document.body.classList.add("panel-open");
    $("#fpanel").setAttribute("aria-hidden", "false");
    if (sec) {
      const d = $(`.fsec[data-sec="${sec}"]`);
      d.open = true;
      setTimeout(() => d.scrollIntoView({ block: "start", behavior: "smooth" }), 250);
    }
  }
  function closePanel() {
    document.body.classList.remove("panel-open");
    $("#fpanel").setAttribute("aria-hidden", "true");
  }

  // ---------- pagine ----------
  const pages = {
    // reparto Donna / Uomo: un riquadro grande per tipo di capo, porta al catalogo di quel tipo;
    // foto = quella indossata (2ª) di un capo di quel tipo, meglio se nuovo
    reparto() {
      const cat = document.body.dataset.cat;
      const by = {};
      PRODUCTS.filter((p) => p.cat === cat && photos(p).length).forEach((p) => (by[p.type] ||= []).push(p));
      $("#tiles-cat").innerHTML = Object.keys(by).sort((a, b) => typeRank(a) - typeRank(b)).map((type) => {
        const items = by[type];
        const p = items.find((x) => x.isNew && photos(x)[1]) || items.find((x) => photos(x)[1]) || items[0];
        const name = t("rep." + type) === "rep." + type ? t("type." + type) : t("rep." + type);
        return `<a class="tile" href="catalogo.html?cat=${cat}&type=${type}">
          <img src="${esc(photos(p)[1] || photos(p)[0])}" alt="${esc(name)} ${esc(t("nav." + cat).toLowerCase())} – Up Collection Torino" loading="lazy">
          <span class="tile-text"><strong>${esc(name)}</strong><small>${t(items.length === 1 ? "rep.n1" : "rep.n", { n: items.length })}</small><em>${t("tile.cta")}</em></span>
        </a>`;
      }).join("");
      setMeta(t("rep.title", { cat: t("nav." + cat) }), t("rep.desc." + cat));
    },
    home() {
      // apertura: ogni colonna mostra le foto della campagna sfalsate, una sfuma nell'altra
      const lanes = $("#hero-lanes");
      if (lanes && !lanes.children.length) {
        const shots = HERO.images;
        lanes.innerHTML = [0, 1, 2].map((l) => `<div class="lane">${shots.map((src, i) =>
          `<img src="${src}" alt="" ${l || i ? 'loading="lazy"' : ""} data-i="${i}">`).join("")}</div>`).join("");
        let tick = 0;
        const show = () => {
          $$(".lane", lanes).forEach((lane, l) => {
            const on = (tick + l) % shots.length;
            $$("img", lane).forEach((img) => img.classList.toggle("on", +img.dataset.i === on));
          });
        };
        show();
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(() => { tick++; show(); }, 5000);
      }

      // nuovi arrivi: un capo per marchio a giro, così nessun marchio occupa tutta la fila
      const fresh = uniqueByCode(PRODUCTS.filter((p) => p.isNew && photos(p).length));
      const byBrand = {};
      fresh.forEach((p) => (byBrand[p.brand || ""] ||= []).push(p));
      const mixed = [];
      while (mixed.length < 12 && Object.values(byBrand).some((q) => q.length))
        Object.values(byBrand).forEach((q) => { if (q.length && mixed.length < 12) mixed.push(q.shift()); });
      $("#home-new").innerHTML = carousel(mixed, t("home.new"), "catalogo.html");

      // riquadri grandi: Donna/Uomo (portano alla categoria) o un tipo di capo;
      // foto = quella scelta a mano (foto) oppure la foto indossata del capo indicato
      $("#tiles").innerHTML = HERO.tiles.map(([type, id, foto]) => {
        const p = PRODUCTS.find((x) => x.id === id);
        const src = foto || (p && (photos(p)[1] || photos(p)[0]));
        if (!src) return "";
        const isCat = type === "donna" || type === "uomo";
        return `<a class="tile" href="${isCat ? `${type}.html` : `catalogo.html?type=${type}`}">
          <img src="${esc(src)}" alt="${esc(t(isCat ? `alt.${type}` : "type." + type))} – Up Collection Torino" loading="lazy">
          <span class="tile-text"><strong>${t((isCat ? "nav." : "type.") + type)}</strong><em>${t("tile.cta")}</em></span>
        </a>`;
      }).join("");

      // 4 vantaggi sotto l'apertura
      const ICONS = [
        '<path d="M12 4a2 2 0 1 1 2 2c-1 0-2 .7-2 1.8V9m0 0L3 15.5c-.9.6-.5 2 .6 2h16.8c1.1 0 1.5-1.4.6-2L12 9Z"/>',
        '<path d="M5 3h14v18l-7-4.5L5 21V3Z"/>',
        '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10.5h9M4 13.5h9"/>',
        '<path d="M3 21V10l9-6 9 6v11M9 21v-6h6v6"/>'
      ];
      $("#perks").innerHTML = ICONS.map((ic, i) => `<div class="perk">
          <svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg>
          <div><strong>${t(`perks.${i + 1}.t`)}</strong><span>${t(`perks.${i + 1}.d`)}</span></div></div>`).join("");

      // recensioni Google
      const R = SHOP.reviews;
      if (R && (R.lista || []).length) {
        $("#reviews").hidden = false;
        $("#reviews").innerHTML = `
          <p class="eyebrow">${t("reviews.kicker")}</p>
          <h2><span class="stars" aria-hidden="true">★★★★★</span> ${esc(t("reviews.title", { rating: R.voto, count: R.numero }))}</h2>
          <div class="review-list">${R.lista.slice(0, 3).map((r) => `<figure class="review">
            <blockquote>“${esc(r.testo)}”</blockquote><figcaption>${esc(r.autore || "")}</figcaption></figure>`).join("")}</div>
          ${R.link ? `<a class="eyebrow link-under" href="${esc(R.link)}" target="_blank" rel="noopener">${t("reviews.all")}</a>` : ""}`;
      }

      // foto da Instagram
      const IG = SHOP.igPhotos || [];
      if (IG.length) {
        $("#ig").hidden = false;
        $("#ig").innerHTML = `<p class="eyebrow">${t("ig.kicker")}</p>
          <a class="ig-handle" href="${SHOP.instagram}" target="_blank" rel="noopener">@upcollection.torino</a>
          <div class="ig-grid">${IG.slice(0, 6).map((f) => `<a href="${esc(f.link || SHOP.instagram)}" target="_blank" rel="noopener"><img src="${esc(f.foto)}" alt="" loading="lazy"></a>`).join("")}</div>`;
      }

      $("#home-brands").innerHTML = brandList();
      // contatti in un solo blocco: indicazioni, telefono (con il numero), WhatsApp e orari
      $("#home-contacts").innerHTML = `<div class="actions">${storeActions().replace(`>${t("store.call")}<`, `>${t("store.call")} ${SHOP.phone}<`)}</div>` + hoursList();
    },

    // pagina di un marchio (es. happy-socks-torino.html): capi del marchio, contatti, dati per Google
    brand() {
      const B = document.body.dataset;
      const name = B.brand || B.listName || "Up Collection";
      const types = (B.types || "").split(",").filter(Boolean);
      let list = uniqueByCode(PRODUCTS.filter((p) => (!B.brand || p.brand === B.brand) && (!B.cat || p.cat === B.cat)
        && (!types.length || types.includes(p.type)) && (!B.onlyNew || p.isNew)).sort(byHighlight));
      if (B.limit) list = list.slice(0, +B.limit);
      $("#brand-grid").innerHTML = list.map(card).join("");
      // marchio senza capi sul sito: niente titolo con la griglia vuota (restano testo, FAQ e contatti)
      $("#brand-grid").closest("section").hidden = !list.length;
      $("#brand-actions").innerHTML = storeActions();
      $("#brand-store").innerHTML = contactList() + hoursList();
      $$("script[data-brand-ld]").forEach((x) => x.remove());
      const abs = (u) => new URL(u, location.href).href;
      const el = document.createElement("script");
      el.type = "application/ld+json"; el.dataset.brandLd = "";
      el.textContent = JSON.stringify({
        "@context": "https://schema.org", "@type": "ItemList",
        name: `${name} · Up Collection Torino`,
        // solo capi con foto e marchio: senza, Google segna la scheda come non valida
        itemListElement: list.filter((p) => photos(p).length && p.brand).map((p, i) => ({
          "@type": "ListItem", position: i + 1, url: abs(prodUrl(p)),
          item: { "@type": "Product", name: fullNameOf(p), image: photos(p).slice(0, 1).map(abs),
            brand: { "@type": "Brand", name: p.brand }, sku: p.code || p.id,
            offers: { "@type": "Offer", price: p.price, priceCurrency: "EUR",
              availability: "https://schema.org/InStoreOnly" } }
        }))
      });
      document.head.appendChild(el);
    },

    catalog() {
      $("#fq").placeholder = t("f.searchph");
      $("#fq").value = st.q;
      $("#f-sort").innerHTML = ["new", "asc", "desc"].map((k) =>
        `<button class="fopt fradio" data-sort="${k}"><span class="fbox"></span>${t("sort." + k)}</button>`).join("");
      updateCatalog();
      if (params.get("cerca")) { openPanel(""); setTimeout(() => $("#fq").focus(), 300); }
    },

    product() {
      const pid = params.get("id") || decodeURIComponent((location.pathname.match(/\/prodotto\/([^/.]+)/) || [])[1] || "");
      const p = PRODUCTS.find((x) => x.id === pid);
      const box = $("#product");
      if (!p) {
        box.innerHTML = `<p class="empty">${t("p.notfound")} <a href="catalogo.html">${t("p.back")}</a></p>`;
        return;
      }
      const fullName = fullNameOf(p);
      setMeta(t("seo.product.title", { name: fullName }),
        t("seo.product.desc", { name: fullName, price: price(p.price), desc: L(p.bullets).join(", ") + "." }));
      if (photos(p)[0]) {
        const og = document.querySelector('meta[property="og:image"]');
        if (og) og.setAttribute("content", new URL(photos(p)[0], location.href).href);
      }
      // indirizzo unico della scheda (canonical + og:url)
      const url = new URL(prodUrl(p), location.href).href;
      document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
      document.querySelector('meta[property="og:url"]')?.setAttribute("content", url);
      productSchema(p);
      const single = p.sizes.length === 1;
      box.innerHTML = `
        <div class="pd-media${photos(p).length > 1 ? " has-gallery" : ""}">${gallery(p)}</div>
        <div class="pd-info">
          <p class="crumbs"><a class="crumb" href="${p.cat}.html">${t("nav." + p.cat)}</a>
            <span class="crumb">·</span>
            <a class="crumb" href="catalogo.html?cat=${p.cat}&type=${p.type}">${t("type." + p.type)}</a></p>
          ${p.brand ? `<p class="pd-brand">${(() => {
            const pg = SHOP.brands.find((b) => b.name === p.brand)?.page;
            return pg ? `<a href="${pg}">${esc(p.brand)}</a>` : esc(p.brand);
          })()}</p>` : ""}
          ${p.code ? `<p class="pd-code">${t("p.code")} ${esc(p.code)}</p>` : ""}
          <h1>${esc(L(p.name))}</h1>
          <p class="pd-price">${price(p.price)}${p.lowStock ? ` <span class="pd-low">${t("tag.low")}</span>` : ""}</p>
          ${p.collection ? `<p class="pd-row"><span>${t("p.collection")}</span>${esc(p.collection)}</p>` : ""}
          <p class="pd-row"><span>${t("p.color")}</span>${esc(L(p.color))}</p>
          ${single ? "" : `
            <p class="pd-label">${t("p.size")}</p>
            <div class="sizes">${p.sizes.map((s) => `<button data-size="${s}">${s}</button>`).join("")}</div>`}
          <a class="btn btn-solid" id="wa-btn" target="_blank" rel="noopener"></a>
          <a class="btn btn-line" href="tel:${SHOP.phoneHref}">${t("p.call")} · ${SHOP.phone}</a>
          <p class="pd-note">${t("p.note")}</p>
          <details open>
            <summary>${t("p.details")}</summary>
            <ul class="pd-details">${L(p.bullets).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          </details>
        </div>`;

      let size = single ? "" : null;
      const updateWa = () => {
        const extra = size ? t("wa.size", { s: size }) : "";
        $("#wa-btn").href = waLink(t("wa.msg", { name: fullName, size: extra }));
        $("#wa-btn").textContent = t("p.wa");
      };
      $$(".sizes button").forEach((b) => b.addEventListener("click", () => {
        $$(".sizes button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        size = b.dataset.size;
        updateWa();
      }));
      updateWa();

      const gal = $(".gallery");
      if (gal) gal.addEventListener("scroll", () => {
        $(".gallery-count span").textContent = Math.round(gal.scrollLeft / gal.clientWidth) + 1;
      }, { passive: true });

      // "Completa il look": i capi dello stesso completo (campo look in products.js)
      const look = (p.look || []).map((id) => PRODUCTS.find((x) => x.id === id)).filter(Boolean);

      // "Visti di recente": capi aperti da questo cliente, ricordati solo nel suo browser
      let recent = [];
      try { recent = JSON.parse(localStorage.getItem("recent") || "[]"); } catch (e) {}
      const recentList = recent.filter((id) => id !== p.id)
        .map((id) => PRODUCTS.find((x) => x.id === id)).filter(Boolean);
      try { localStorage.setItem("recent", JSON.stringify([p.id, ...recent.filter((id) => id !== p.id)].slice(0, 12))); } catch (e) {}

      const others = PRODUCTS.filter((x) => x.id !== p.id && !look.includes(x));
      const related = [...others.filter((x) => x.cat === p.cat && photos(x).length),
        ...others.filter((x) => x.cat !== p.cat && photos(x).length)].slice(0, 12);

      $("#related-wrap").innerHTML =
        (look.length ? carousel(look, t("p.look")) : "") +
        tabbedCarousel([
          ["rel", t("p.related"), related],
          ["recent", t("p.recent"), recentList]
        ]);
    },

    notfound() {
      $("#new-grid").innerHTML = PRODUCTS.filter((p) => p.isNew).slice(0, 4).map(card).join("");
      document.title = `${t("nf.title")} · Up Collection`;
    },

    store() {
      $("#store-brands").innerHTML = brandList();
      $("#store-contacts").innerHTML = contactList();
      $("#store-hours").innerHTML = hoursList();
      $("#store-actions").innerHTML = storeActions();
    }
  };

  // ---------- render ----------
  function announce() {
    let bar = $(".announce");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "announce";
      $("#site-header").before(bar);
    }
    bar.innerHTML = `<a href="#newsletter">${t("announce.text")} | <u>${t("announce.cta")}</u></a>`;
    // altezza della striscia: l'apertura blu occupa il resto dello schermo
    const setH = () => document.documentElement.style.setProperty("--announce-h", bar.offsetHeight + "px");
    setH();
    if (!announce.watching) { announce.watching = true; window.addEventListener("resize", setH); }
  }

  function helpBlock() {
    let box = $(".help");
    if (!box) {
      box = document.createElement("section");
      box.className = "help";
      $("#site-footer").before(box);
    }
    // pagina negozio e home hanno già i contatti: qui resta solo la newsletter
    const solo = page === "store" || page === "home";
    box.classList.toggle("solo", solo);
    box.innerHTML = (solo ? "" : `
      <div class="help-col">
        <h2>${t("help.title")}</h2>
        <p>${t("help.text")}</p>
        <div class="help-links">
          <a class="link-under" href="negozio.html">${t("help.contact")}</a>
          <a class="link-under" href="${waLink(t("wa.generic"))}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>`) + `
      <div class="help-col" id="newsletter">
        <h2>${t("stay.title")}</h2>
        <p>${t("stay.text")}</p>
        <form class="nl" novalidate>
          <div class="nl-row">
            <input type="email" name="EMAIL" required autocomplete="email" placeholder="${t("nl.email")}" aria-label="${t("nl.email")}">
            <button class="btn btn-solid" type="submit">${t("nl.submit")}</button>
          </div>
          <label class="nl-consent"><input type="checkbox" name="OPT_IN" value="1" required> <span>${t("nl.consent")}</span></label>
          <p class="nl-note">${t("nl.note")}</p>
          <p class="nl-msg" role="status" aria-live="polite"></p>
        </form>
      </div>`;
    newsletterForm($(".nl", box));
  }

  // Iscrizione: invia al modulo Brevo (doppia conferma via email gestita da Brevo).
  function newsletterForm(form) {
    const msg = $(".nl-msg", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.EMAIL, ok = form.OPT_IN;
      if (!email.checkValidity()) { email.reportValidity(); return; }
      if (!ok.checked) { ok.reportValidity(); return; }
      if (!NEWSLETTER.action) { msg.textContent = t("nl.soon"); return; }
      const data = new FormData(form);
      data.append("email_address_check", "");
      data.append("locale", lang);
      data.append("html_type", "simple");
      try {
        await fetch(NEWSLETTER.action, { method: "POST", body: data, mode: "no-cors" });
        form.reset();
        msg.textContent = t("nl.ok");
      } catch {
        msg.textContent = t("nl.err");
      }
    });
  }

  function render() {
    document.documentElement.lang = lang;
    announce();
    header();
    footer();
    if (page !== "notfound") helpBlock();
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n, { brands: brandNames() }); });
    if (pages[page]) pages[page]();
    mapBoxes();
    onScroll();
    waFloat();
    reveal();
  }

  // pulsante WhatsApp fisso in basso a destra (si accende dalla dashboard)
  function waFloat() {
    let b = $(".wa-float");
    if (!SHOP.waFloat) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("a"); b.className = "wa-float"; b.target = "_blank"; b.rel = "noopener"; document.body.appendChild(b); }
    b.href = waLink(t("wa.generic"));
    b.setAttribute("aria-label", t("wa.float"));
    b.innerHTML = `<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2 2.2.9 3 1 4.1.8.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4Z"/></svg><span>${t("wa.float")}</span>`;
  }

  // le sezioni compaiono con una leggera dissolvenza mentre si scorre
  let revealObs = null;
  function reveal() {
    const els = $$(".reveal:not(.in), .tile:not(.in)");
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in")); return;
    }
    revealObs = revealObs || new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => { el.classList.add("will-reveal"); revealObs.observe(el); });
  }

  // ---------- eventi (delegati, così sopravvivono ai re-render) ----------
  document.addEventListener("click", (e) => {
    const langBtn = e.target.closest("[data-lang]");
    if (langBtn) { setLang(langBtn.dataset.lang); return; }

    const menu = e.target.closest(".menu-btn");
    if (menu) {
      // il menu parte da sotto la barra (sopra c'è anche la striscia della newsletter)
      document.documentElement.style.setProperty("--drawer-top",
        $(".site-header .bar").getBoundingClientRect().bottom + "px");
      const open = document.body.classList.toggle("menu-open");
      menu.setAttribute("aria-expanded", open);
      return;
    }

    if (e.target.closest(".map-show")) { mapLoaded = true; mapBoxes(); return; }

    const arrow = e.target.closest(".card-arrow");
    if (arrow) {
      const c = arrow.closest(".card"), p = PRODUCTS.find((x) => x.id === c.dataset.id);
      const list = photos(p), i = ((+c.dataset.i || 0) + +arrow.dataset.step + list.length) % list.length;
      c.dataset.i = i;
      c.classList.add("browsing"); // con le frecce non serve più la seconda foto al passaggio del mouse
      const img = c.querySelector(".card-img img:not(.alt)");
      img.srcset = srcset(list[i]); img.src = list[i];
      return;
    }
    const tab = e.target.closest(".ctab");
    if (tab) {
      const sec = tab.closest(".carousel");
      $$(".ctab", sec).forEach((b) => b.classList.toggle("on", b === tab));
      $$("[data-pane]", sec).forEach((w) => { w.hidden = w.dataset.pane !== tab.dataset.tab; });
      return;
    }
    const cs = e.target.closest("[data-scroll]");
    if (cs) {
      const tr = cs.parentElement.querySelector(".carousel-track");
      tr.scrollBy({ left: +cs.dataset.scroll * tr.clientWidth * 0.8, behavior: "smooth" });
      return;
    }

    if (page !== "catalog") return;
    if (e.target.closest(".search-link")) {
      e.preventDefault(); openPanel(""); setTimeout(() => $("#fq").focus(), 300); return;
    }
    const filter = e.target.closest("#filters [data-cat]");
    if (filter) { st.cat = filter.dataset.cat; updateCatalog(); return; }
    // categorie: salto alla sezione, scelta di un tipo, "Mostra tutti" nelle sezioni lunghe
    const go = e.target.closest("[data-go]");
    if (go) { e.preventDefault(); goToSection(go.dataset.go); return; }
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      st.type = new Set(pick.dataset.pick ? [pick.dataset.pick] : []);
      updateCatalog();
      const top = $("#cat-title").getBoundingClientRect().top + window.scrollY - $("#site-header").offsetHeight - 16;
      if (window.scrollY > top) window.scrollTo({ top });
      return;
    }
    const more = e.target.closest("[data-more]");
    if (more) {
      const sec = more.closest(".psec");
      sec.classList.toggle("open");
      sec.classList.contains("open") ? openSecs.add(more.dataset.more) : openSecs.delete(more.dataset.more);
      renderViews();
      if (!sec.classList.contains("open")) goToSection(more.dataset.more);
      return;
    }

    const view = e.target.closest("[data-view]");
    if (view) {
      gridView = +view.dataset.view;
      try { localStorage.setItem("gridView", gridView); } catch (err) {}
      renderViews(); return;
    }
    const open = e.target.closest("[data-open-panel]");
    if (open) { openPanel(open.dataset.openPanel); return; }
    if (e.target.closest("[data-close-panel]")) { closePanel(); return; }

    const opt = e.target.closest("[data-f]");
    if (opt) {
      const set = st[opt.dataset.f], v = opt.dataset.v;
      set.has(v) ? set.delete(v) : set.add(v);
      updateCatalog(); return;
    }
    const sort = e.target.closest("[data-sort]");
    if (sort) { st.sort = sort.dataset.sort; updateCatalog(); return; }
    if (e.target.closest(".chip[data-q]")) { st.q = ""; $("#fq").value = ""; updateCatalog(); return; }
    if (e.target.closest(".chip[data-nuovi]")) { st.nuovi = false; updateCatalog(); return; }
    if (e.target.closest(".chip[data-gruppo]")) { st.gruppo = ""; updateCatalog(); return; }
    if (e.target.closest("[data-clear], #f-reset")) {
      FACETS.forEach((f) => st[f].clear());
      st.nuovi = false; st.gruppo = "";
      st.q = ""; $("#fq").value = "";
      updateCatalog();
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "fq") { st.q = e.target.value.trim(); updateCatalog(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("panel-open")) closePanel();
  });

  function onScroll() {
    const h = $("#site-header");
    const hero = $(".hero");
    const overHero = hero && window.scrollY < hero.offsetHeight - 70;
    h.classList.toggle("on-hero", !!overHero && !document.body.classList.contains("menu-open"));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", () => { if (page === "catalog") spySections(); }, { passive: true });

  // Prodotti dal file dati (modificato dal pannello /admin). "no-cache": il browser
  // ricontrolla sempre il file, così le modifiche di Federico si vedono subito.
  // Dati del negozio modificabili dal pannello (orari, contatti, barra in alto, riquadri home).
  // Se il file manca restano i valori scritti in products.js e i18n.js.
  const DAYS_EN = { "lunedì": "Monday", "martedì": "Tuesday", "mercoledì": "Wednesday", "giovedì": "Thursday",
    "venerdì": "Friday", "sabato": "Saturday", "domenica": "Sunday" };
  const applyShopData = (n) => {
    if (!n) return;
    if (n.telefono) { SHOP.phone = n.telefono; SHOP.phoneHref = "+39" + n.telefono.replace(/\D/g, ""); }
    if (n.whatsapp) { SHOP.mobile = n.whatsapp; SHOP.whatsapp = "39" + n.whatsapp.replace(/\D/g, "").replace(/^39(?=\d{9,})/, ""); }
    if (n.email) SHOP.email = n.email;
    if (n.indirizzo) SHOP.address = n.indirizzo;
    if (Array.isArray(n.orari) && n.orari.length) SHOP.hours = n.orari.map((o) => ({
      it: o.giorno, en: DAYS_EN[(o.giorno || "").toLowerCase()] || o.giorno,
      time: /^chius/i.test(o.orario || "") ? { it: "Chiuso", en: "Closed" } : (o.orario || "")
    }));
    if (n.annuncio && n.annuncio.it) I18N.it["announce.text"] = n.annuncio.it;
    if (n.annuncio && n.annuncio.en) I18N.en["announce.text"] = n.annuncio.en;
    if (n.recensioni) SHOP.reviews = n.recensioni;
    if (Array.isArray(n.instagram_foto)) SHOP.igPhotos = n.instagram_foto.filter((f) => f && f.foto);
    SHOP.waFloat = !!n.pulsante_whatsapp;
    if (Array.isArray(n.riquadri_home) && n.riquadri_home.length)
      HERO.tiles = n.riquadri_home.filter((r) => r.tipo).map((r) => [r.tipo, r.prodotto || "", r.foto || ""]);
  };
  const shopData = fetch("assets/data/negozio.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null)).then(applyShopData).catch(() => {});

  fetch("assets/data/prodotti.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((d) => {
      PRODUCTS = (d.prodotti || []).map((p) => ({
        ...p,
        sizes: [...(p.sizes || [])].map(String).sort((a, b) => sizeRank(a) - sizeRank(b)),
        images: (p.images || []).filter(Boolean),
        look: p.look || [],
        lowStock: !!p.lowStock,
        tone: p.tone || "#d9d4cc"
      }));
    })
    .catch(() => { PRODUCTS = []; })
    .then(() => shopData)
    .then(render);
})();

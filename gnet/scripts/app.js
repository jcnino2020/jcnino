(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const toggle = byId("menu-toggle");
  const menu = byId("site-menu");
  const mobile = window.matchMedia("(max-width: 959px)");

  function setMenu(open, restoreFocus = false) {
    if (!toggle || !menu) return;
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    toggle.querySelector("i").className = open ? "ri-close-line" : "ri-menu-line";
    if (restoreFocus) toggle.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", event => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setMenu(false, true);
    });
    document.addEventListener("click", event => {
      if (!event.target.closest(".site-header")) setMenu(false);
    });
    if (mobile.addEventListener) mobile.addEventListener("change", () => {
      const focusInMenu = menu.contains(document.activeElement);
      setMenu(false, mobile.matches && focusInMenu);
    });
  }

  document.querySelectorAll('input[name="fiber-plan"]').forEach(input => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      byId("selected-speed").textContent = input.value + " Mbps";
      byId("selected-price").textContent = "₱" + input.dataset.price + " / month";
    });
  });

  function status(element, message, error = false) {
    element.textContent = message;
    element.classList.toggle("error", error);
  }

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error("Service unavailable");
      // Keep the timeout active until the response body has finished loading.
      return options.json ? await response.json() : await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  const billForm = byId("bill-form");
  if (billForm) {
    const account = byId("account-number");
    const submit = byId("bill-submit");
    const message = byId("bill-status");
    const result = byId("bill-result");
    let pending = false;
    billForm.addEventListener("submit", async event => {
      event.preventDefault();
      if (pending) return;
      const number = account.value.trim();
      if (!number) {
        status(message, "Enter your GNET account number.", true);
        account.focus();
        return;
      }
      pending = true;
      submit.disabled = true;
      account.readOnly = true;
      billForm.setAttribute("aria-busy", "true");
      result.hidden = true;
      result.replaceChildren();
      status(message, "Looking up your account…");
      try {
        const html = await request("https://gnet.ph/front/view_bill", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: new URLSearchParams({ cek_bill: "1", no_services: number })
        });
        if (!html.trim()) throw new Error("Empty response");
        // Provider HTML is untrusted. An opaque, script-free frame isolates the result.
        const frame = document.createElement("iframe");
        frame.className = "bill-result-frame";
        frame.title = "GNET bill inquiry result";
        frame.setAttribute("sandbox", "");
        frame.setAttribute("referrerpolicy", "no-referrer");
        frame.srcdoc = '<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;"><style>body{font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#20252b;margin:20px;overflow-wrap:anywhere}table{border-collapse:collapse;max-width:100%;width:100%}td,th{padding:10px;border-bottom:1px solid #dce1e6}a{color:#ad1822}</style></head><body>' + html + '</body></html>';
        result.append(frame);
        result.hidden = false;
        status(message, "GNET’s response is shown below. Use the member portal for account actions.");
      } catch {
        status(message, "We couldn’t retrieve your bill. Try again, use the member portal, or call +63 960 922 5835.", true);
      } finally {
        pending = false;
        submit.disabled = false;
        account.readOnly = false;
        billForm.removeAttribute("aria-busy");
      }
    });
  }

  const mapElement = byId("mapid");
  if (mapElement) {
    const mapStatus = byId("map-status");
    const locationStatus = byId("location-status");
    const locate = byId("locate-button");
    const retry = byId("coverage-retry");
    if (!window.L) {
      status(mapStatus, "The map couldn’t load. Contact GNET to check your address.", true);
      mapElement.textContent = "Map unavailable.";
      locate.disabled = true;
      retry.disabled = true;
      return;
    }
    const office = [10.630793245589691, 122.95960396536431];
    const map = L.map("mapid", { fullscreenControl: true }).setView(office, 12);
    const fullscreen = document.querySelector(".leaflet-control-fullscreen a");
    if (fullscreen) {
      const glyph = document.createElement("i");
      glyph.className = "ri-fullscreen-line";
      glyph.setAttribute("aria-hidden", "true");
      fullscreen.append(glyph);
      map.on("fullscreenchange", () => {
        glyph.className = map.isFullscreen() ? "ri-fullscreen-exit-line" : "ri-fullscreen-line";
      });
    }
    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    let tileErrorShown = false;
    tiles.on("tileerror", () => {
      if (!tileErrorShown) {
        status(locationStatus, "Some map tiles couldn’t load. You can still contact GNET to confirm your address.", true);
        tileErrorShown = true;
      }
    });
    const officeIcon = L.icon({
      iconUrl: "/gnet/files/marker-icon-2x.png",
      shadowUrl: "/gnet/files/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    L.marker(office, { icon: officeIcon }).addTo(map).bindPopup("GNET Network and Data Solution office");
    const coverageLayer = L.layerGroup().addTo(map);
    let zones = null;
    let locationMarker;

    async function loadCoverage() {
      retry.disabled = true;
      zones = null;
      coverageLayer.clearLayers();
      status(mapStatus, "Loading coverage zones…");
      try {
        const data = await request("https://gnet.ph/coverage/getcoverage/", { json: true });
        if (!Array.isArray(data)) throw new Error("Invalid coverage response");
        const valid = data.filter(item => item && item.latitude !== "" && item.longitude !== "" && item.latitude != null && item.longitude != null &&
          Number.isFinite(Number(item.latitude)) && Math.abs(Number(item.latitude)) <= 90 &&
          Number.isFinite(Number(item.longitude)) && Math.abs(Number(item.longitude)) <= 180 &&
          Number.isFinite(Number(item.radius)) && Number(item.radius) > 0);
        if (!valid.length) throw new Error("No coverage zones");
        zones = valid;
        const coverageIcon = L.icon({ iconUrl: "/gnet/files/marker_green.png", iconSize: [32, 41], iconAnchor: [15, 41], popupAnchor: [0, -41] });
        zones.forEach(item => {
          const point = [Number(item.latitude), Number(item.longitude)];
          const popup = document.createElement("div");
          const title = document.createElement("strong");
          const address = document.createElement("p");
          title.textContent = item.c_name || "GNET service area";
          address.textContent = item.address || "";
          popup.append(title, address);
          L.marker(point, { icon: coverageIcon }).addTo(coverageLayer).bindPopup(popup);
          L.circle(point, { radius: Number(item.radius), color: "#198653", fillColor: "#198653", fillOpacity: 0.12, weight: 1 }).addTo(coverageLayer);
        });
        status(mapStatus, "Coverage zones loaded. Contact GNET to confirm service at your exact address.");
      } catch {
        status(mapStatus, "Coverage zones are unavailable right now. Reload the map or call GNET to check your address.", true);
      } finally {
        retry.disabled = false;
      }
    }
    retry.addEventListener("click", loadCoverage);
    loadCoverage();
    locate.addEventListener("click", () => {
      if (!navigator.geolocation) {
        status(locationStatus, "Location isn’t supported by your browser. Explore the map or contact GNET.", true);
        return;
      }
      locate.disabled = true;
      status(locationStatus, "Finding your location…");
      navigator.geolocation.getCurrentPosition(position => {
        locate.disabled = false;
        const point = [position.coords.latitude, position.coords.longitude];
        map.setView(point, 15);
        if (locationMarker) map.removeLayer(locationMarker);
        locationMarker = L.circleMarker(point, { color: "#2267c8", fillColor: "#2267c8", fillOpacity: 1, radius: 7 }).addTo(map).bindPopup("Your location");
        if (!zones) {
          status(locationStatus, "Your location is shown. Coverage data is unavailable; contact GNET to confirm service.");
          return;
        }
        const inZone = zones.some(item => map.distance(point, [Number(item.latitude), Number(item.longitude)]) <= Number(item.radius));
        status(locationStatus, inZone ? "Your location falls within a listed coverage zone. Confirm availability with GNET before applying." : "Your location is outside the currently listed zones. Contact GNET to ask about availability.");
      }, error => {
        locate.disabled = false;
        status(locationStatus, error.code === 1 ? "Location permission was denied. Explore the map manually or contact GNET." : "We couldn’t find your location. Try again or explore the map manually.", true);
      }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
    });
  }
})();

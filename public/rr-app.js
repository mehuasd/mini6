/* Renewal Radar — shared navigation, session & state glue for all screens */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const page = (location.pathname.split("/").pop() || "landing.html").toLowerCase();

  function currentUser() {
    try { return JSON.parse(localStorage.getItem("rr_current_user")) || null; } catch { return null; }
  }
  function userKey() {
    const u = currentUser();
    return "rr_renewals_" + ((u && u.email) || "guest");
  }
  function getItems() {
    try { return JSON.parse(localStorage.getItem(userKey())) || []; } catch { return []; }
  }
  function setItems(items) { localStorage.setItem(userKey(), JSON.stringify(items)); }
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

  /* ---------- Glass modal ---------- */
  function modal(title, html) {
    let m = $("#rr-modal");
    if (!m) {
      m = document.createElement("div");
      m.id = "rr-modal";
      m.innerHTML = `<style>
        #rr-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(2,6,15,.7);backdrop-filter:blur(6px);font-family:inherit;padding:16px}
        #rr-modal .rr-card{width:100%;max-width:520px;border-radius:20px;padding:28px;color:#e2e8f0;background:linear-gradient(135deg,rgba(30,41,59,.85),rgba(15,23,42,.92));border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(20px);box-shadow:0 30px 80px rgba(0,0,0,.5)}
        #rr-modal h3{margin:0 0 6px;font-size:20px;font-weight:800;color:#fff}
        #rr-modal .rr-sub{color:#94a3b8;font-size:13px;margin-bottom:18px}
        #rr-modal .rr-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:8px;font-size:13px}
        #rr-modal .rr-row b{color:#fff}
        #rr-modal button,#rr-modal a.rr-btn{cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(56,189,248,.18);color:#7dd3fc;font-weight:700;font-size:12px;padding:8px 14px;border-radius:10px;text-decoration:none}
        #rr-modal .rr-close{float:right;background:transparent;border:none;color:#94a3b8;font-size:22px;padding:0 4px}
        #rr-modal input{width:100%;box-sizing:border-box;background:rgba(2,6,23,.7);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:10px 12px;color:#fff;margin:4px 0 12px;font-size:13px}
        #rr-modal label{font-size:11px;font-weight:700;color:#cbd5e1;text-transform:uppercase;letter-spacing:.05em}
      </style><div class="rr-card"><button class="rr-close" aria-label="Close">×</button><div class="rr-body"></div></div>`;
      document.body.appendChild(m);
      m.addEventListener("click", (e) => { if (e.target === m || e.target.classList.contains("rr-close")) m.style.display = "none"; });
    }
    $(".rr-body", m).innerHTML = `<h3>${title}</h3>${html}`;
    m.style.display = "flex";
    return m;
  }

  function openVault() {
    const docs = ["Vehicle_PUC.pdf", "RC_Book_Scan.pdf"].concat(getItems().map((i) => i.name.replace(/\s+/g, "_") + "_Proof.pdf"));
    modal("Vault Archive", `<div class="rr-sub">Encrypted proofs stored locally on this device.</div>` +
      docs.map((d) => `<div class="rr-row"><span>📄 <b>${esc(d)}</b></span><button onclick="alert('Opening ${esc(d)} (demo preview)')">View</button></div>`).join(""));
  }
  function monthly(i) {
    const c = Number(i.cost) || 0;
    const f = (i.frequency || "").toLowerCase();
    if (f.startsWith("month")) return c;
    if (f.startsWith("quarter")) return c / 3;
    if (f.startsWith("annual")) return c / 12;
    return c / 36;
  }
  function openAnalytics() {
    const base = [
      { name: "Vehicle Insurance (PUC)", cost: 3333, frequency: "Annual" },
      { name: "Netflix Premium UHD", cost: 649, frequency: "Monthly" },
      { name: "AppleCare+ MacBook Pro", cost: 18000, frequency: "Multi-Year" },
      { name: "State Driving License (DL)", cost: 1000, frequency: "Multi-Year" },
    ];
    const items = getItems().length ? getItems() : base;
    const total = items.reduce((s, i) => s + monthly(i), 0);
    modal("Analytics — Normalized Burn Rate", `<div class="rr-sub">All costs normalized to a monthly equivalent.</div>` +
      items.map((i) => `<div class="rr-row"><span>${esc(i.name)}</span><b>${inr(Math.round(monthly(i)))}/mo</b></div>`).join("") +
      `<div class="rr-row" style="background:rgba(56,189,248,.12)"><span><b>Total monthly burn</b></span><b>${inr(Math.round(total))}/mo</b></div>
       <div class="rr-row"><span><b>Projected annual</b></span><b>${inr(Math.round(total * 12))}</b></div>`);
  }
  function openSettings() {
    const u = currentUser() || { name: "", email: "" };
    const m = modal("Profile Settings", `<div class="rr-sub">Manage your account preferences.</div>
      <label>Full name</label><input id="rr-set-name" value="${esc(u.name)}">
      <label>Email</label><input value="${esc(u.email)}" disabled>
      <div style="display:flex;gap:8px;justify-content:space-between;margin-top:6px">
        <button id="rr-logout" style="background:rgba(244,63,94,.15);color:#fda4af">Log out</button>
        <button id="rr-save">Save changes</button></div>`);
    $("#rr-save", m).onclick = () => {
      const name = $("#rr-set-name", m).value.trim() || u.name;
      localStorage.setItem("rr_current_user", JSON.stringify({ ...u, name }));
      m.style.display = "none";
      applyGreeting();
      alert("Settings saved.");
    };
    $("#rr-logout", m).onclick = () => { localStorage.removeItem("rr_current_user"); location.href = "login.html"; };
  }

  /* ---------- Generic link wiring ---------- */
  function wireLinks() {
    $$("a, button").forEach((el) => {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      const href = el.getAttribute("href");
      const dead = el.tagName === "A" && (!href || href === "#" || href === "vault.html");
      const go = (url) => (e) => { e.preventDefault(); location.href = url; };
      const run = (fn) => (e) => { e.preventDefault(); fn(); };
      if (text.includes("vault archive")) { el.removeAttribute("onclick"); el.onclick = run(openVault); return; }
      if (!dead) return;
      if (text === "dashboard" || text.includes("return to dashboard") || text.includes("back to dashboard")) { el.setAttribute("href", "dashboard.html"); el.removeAttribute("onclick"); }
      else if (text === "analytics") el.onclick = run(openAnalytics);
      else if (text === "settings") el.onclick = run(openSettings);
      else if (text.includes("add asset")) el.setAttribute("href", "add_asset.html");
      else if (text.includes("download renewal kit")) el.onclick = run(() => alert("Downloading bundled archive: Renewal_Kit.zip (demo)"));
      else if (text.includes("insurance category")) el.setAttribute("href", "dashboard.html#INSURANCE");
      else el.onclick = run(() => alert("This section is coming soon in the prototype."));
    });
  }

  function applyGreeting() {
    const u = currentUser();
    if (!u) return;
    $$("h1").forEach((h) => { if (/welcome back/i.test(h.textContent)) h.textContent = "Welcome back, " + u.name; });
  }

  /* ---------- Dashboard ---------- */
  const CAT = { Subscription: "SUBSCRIPTION", Insurance: "INSURANCE", Product: "WARRANTY", Civic: "CIVIC_ID" };
  const BADGE = { SUBSCRIPTION: "sky", INSURANCE: "emerald", WARRANTY: "amber", CIVIC_ID: "violet" };
  function daysLeft(d) { return Math.ceil((new Date(d) - new Date(new Date().toDateString())) / 86400000); }

  function dashboard() {
    // Top "+ Add Asset" button
    $$("button").forEach((b) => {
      if (/add asset|register/i.test(b.textContent) && /Registration/.test(b.getAttribute("onclick") || "")) {
        b.removeAttribute("onclick"); b.onclick = () => (location.href = "add_asset.html");
      }
      const oc = b.getAttribute("onclick") || "";
      if (/opening edit settings/i.test(oc)) { b.removeAttribute("onclick"); b.onclick = () => (location.href = "add_asset.html"); }
    });
    // Renew → concierge
    window.openRenewalModal = function (title, cost, provider) {
      const q = new URLSearchParams({ asset: title, cost, provider });
      location.href = "renewal_concierge.html?" + q.toString();
    };

    const items = getItems();
    const tbody = $("#assetTable tbody");
    if (tbody && items.length) {
      tbody.innerHTML = items.map((i, idx) => {
        const d = daysLeft(i.expiry);
        const status = d < 0 ? ["Expired", "rose"] : d <= 7 ? ["Expiring soon", "rose"] : d <= 30 ? ["Upcoming", "amber"] : ["Active", "emerald"];
        const col = BADGE[i.category] || "sky";
        return `<tr class="hover:bg-white/[0.03] transition-colors group" data-category="${i.category}">
          <td class="py-4 px-6"><div class="font-bold text-white text-sm">${esc(i.name)}</div>
            <span class="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-${col}-500/15 text-${col}-300 border border-${col}-500/30">${i.category}</span></td>
          <td class="py-4 px-6"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-${status[1]}-500/15 text-${status[1]}-300 border border-${status[1]}-500/30">${status[0]}</span></td>
          <td class="py-4 px-6"><div class="text-slate-200 font-semibold">${esc(i.expiry)}</div>
            <div class="text-[11px] text-slate-400 font-medium mt-0.5">${d < 0 ? Math.abs(d) + " days overdue" : d + " days remaining"}</div></td>
          <td class="py-4 px-6 font-semibold text-white">${inr(i.cost)} <span class="text-slate-400 font-normal">/ ${esc(i.frequency.toLowerCase())}</span></td>
          <td class="py-4 px-6"><span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-white/10">📄 <span class="truncate max-w-[120px] ml-1">${esc(i.name.replace(/\s+/g, "_"))}_Proof.pdf</span></span></td>
          <td class="py-4 px-6 text-right space-x-2">
            <button data-renew="${idx}" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500 text-white hover:bg-sky-400 shadow transition-all">Renew</button>
            <button data-del="${idx}" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 transition-all">Delete</button>
          </td></tr>`;
      }).join("");
      tbody.addEventListener("click", (e) => {
        const r = e.target.closest("[data-renew]"), del = e.target.closest("[data-del]");
        if (r) { const i = items[+r.dataset.renew]; window.openRenewalModal(i.name, inr(i.cost) + " / " + i.frequency.toLowerCase(), i.portal || "Provider portal"); }
        if (del && confirm("Remove this asset?")) { items.splice(+del.dataset.del, 1); setItems(items); location.reload(); }
      });
    }
    const hashCat = location.hash.slice(1);
    if (hashCat && typeof window.filterTable === "function" && document.getElementById("btn-" + hashCat)) window.filterTable(hashCat);
  }

  /* ---------- Add asset ---------- */
  function addAsset() {
    const form = $("form");
    if (!form) return;
    form.removeAttribute("onsubmit");
    form.onsubmit = (e) => {
      e.preventDefault();
      const inputs = $$("input", form), selects = $$("select", form);
      const text = inputs.find((i) => i.type === "text"), num = inputs.find((i) => i.type === "number");
      const date = inputs.find((i) => i.type === "date"), url = inputs.find((i) => i.type === "url");
      const catLabel = selects[0] ? selects[0].value : "Subscription";
      const category = CAT[catLabel.split(" ")[0]] || "SUBSCRIPTION";
      const items = getItems();
      items.push({ name: text.value.trim(), category, cost: Number(num.value), frequency: (selects[1] ? selects[1].value : "Annual").split(" ")[0].replace("One-Time", "One-time"), expiry: date.value, portal: url ? url.value : "", createdAt: Date.now() });
      setItems(items);
      alert("Asset successfully registered and saved to vault!");
      location.href = "dashboard.html";
    };
    $$("button[type=button]", form).forEach((b) => {
      if (/cancel/i.test(b.getAttribute("onclick") || b.textContent)) { b.removeAttribute("onclick"); b.onclick = () => (location.href = "dashboard.html"); }
    });
  }

  /* ---------- Concierge ---------- */
  function concierge() {
    const p = new URLSearchParams(location.search);
    const asset = p.get("asset");
    if (asset) {
      const h = $("h3"); if (h) h.textContent = asset;
    }
    $$("button").forEach((b) => {
      const t = b.textContent.toLowerCase();
      if (t.includes("mark as renewed")) {
        b.removeAttribute("onclick");
        b.onclick = () => {
          if (asset) {
            const items = getItems();
            const it = items.find((i) => i.name === asset);
            if (it && it.expiry) {
              const d = new Date(it.expiry), f = it.frequency.toLowerCase();
              if (f.startsWith("month")) d.setMonth(d.getMonth() + 1);
              else if (f.startsWith("quarter")) d.setMonth(d.getMonth() + 3);
              else d.setFullYear(d.getFullYear() + 1);
              it.expiry = d.toISOString().slice(0, 10); setItems(items);
            }
          }
          location.href = "screen5.html" + (asset ? "?asset=" + encodeURIComponent(asset) : "");
        };
      }
      if (t.includes("download renewal kit")) {
        b.removeAttribute("onclick");
        b.onclick = () => alert("Downloading bundled archive: " + (asset || "Vehicle_Insurance").replace(/[^\w]+/g, "_") + "_Renewal_Kit.zip");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (page === "dashboard.html") dashboard();
    if (page === "add_asset.html") addAsset();
    if (page === "renewal_concierge.html") concierge();
    wireLinks();
    applyGreeting();
  });
})();

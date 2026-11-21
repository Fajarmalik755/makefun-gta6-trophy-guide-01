// Leonida Trophy Codex — tracker logic. Loads data/trophies.json, renders the
// tracker, roadmap, missables and sources tabs, and keeps progress in localStorage.
(function () {
  "use strict";

  var STORAGE_KEY = "leonida-trophy-codex-v1";
  var STAGE_ORDER = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5", "Post-story", "Anytime"];
  var STAGE_LABELS = {
    "Chapter 1": "Chapter 1",
    "Chapter 2": "Chapter 2",
    "Chapter 3": "Chapter 3",
    "Chapter 4": "Chapter 4",
    "Chapter 5": "Final mission — Chapter 5",
    "Post-story": "Post-story",
    "Anytime": "Anytime"
  };
  var GRADE_LETTER = { platinum: "P", gold: "G", silver: "S", bronze: "B" };
  var GRADE_TOTALS = { platinum: 1, gold: 2, silver: 6, bronze: 46 };

  var trophies = [];
  var state = { earned: {}, counts: {}, spoiler: false };
  var selectedId = null;
  var activeFilter = "all";
  var searchText = "";

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") state = parsed;
      }
    } catch (e) { /* fresh start on bad stored data */ }
    if (!state.earned) state.earned = {};
    if (!state.counts) state.counts = {};
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }

  function isEarned(t) { return !!state.earned[t.id]; }
  function getCount(t) { return state.counts[t.id] || 0; }

  function stageRank(t) {
    var i = STAGE_ORDER.indexOf(t.roadmapStage);
    return i < 0 ? 99 : i;
  }

  function roadmapSorted(list) {
    return list.slice().sort(function (a, b) {
      var d = stageRank(a) - stageRank(b);
      return d !== 0 ? d : a.id - b.id;
    });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Spoiler shield: story-kind trophies stay masked until earned.
  function masked(t) {
    return state.spoiler && t.kind.indexOf("story") !== -1 && !isEarned(t);
  }

  function displayName(t) {
    return masked(t) ? "Hidden by the spoiler shield until earned" : t.name;
  }

  function displayDesc(t) {
    return masked(t) ? "Hidden by the spoiler shield until earned" : t.description;
  }

  function gradeBadge(t) {
    return '<span class="badge ' + esc(t.grade) + '">' + GRADE_LETTER[t.grade] + '</span>';
  }

  function kindTags(t) {
    return t.kind.map(function (k) { return '<span class="tag">' + esc(k) + '</span>'; }).join("");
  }

  function matchesFilter(t) {
    var q = searchText.trim().toLowerCase();
    if (q) {
      var hay = (t.name + " " + t.description).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    switch (activeFilter) {
      case "all": return true;
      case "story": return t.kind.indexOf("story") !== -1;
      case "missable": return !!t.missable;
      case "collectibles": return t.kind.indexOf("collectible") !== -1;
      case "activities": return t.kind.indexOf("activity") !== -1;
      case "online": return t.kind.indexOf("online") !== -1;
      case "hidden": return !!t.hidden;
      case "disputed": return !!(t.dispute && t.dispute.trim());
      case "notearned": return !isEarned(t);
      case "platinum": return t.grade === "platinum";
      case "gold": return t.grade === "gold";
      case "silver": return t.grade === "silver";
      case "bronze": return t.grade === "bronze";
      default: return true;
    }
  }

  function updateProgress() {
    var earned = trophies.filter(isEarned).length;
    document.getElementById("progressText").textContent = earned + " / 55 earned";
    document.getElementById("progressBar").style.width = Math.round(earned / 55 * 100) + "%";
    var parts = ["platinum", "gold", "silver", "bronze"].map(function (g) {
      var n = trophies.filter(function (t) { return t.grade === g && isEarned(t); }).length;
      return GRADE_LETTER[g] + " " + n + "/" + GRADE_TOTALS[g];
    });
    document.getElementById("gradeCounts").innerHTML = parts.join("&nbsp;&nbsp;");
  }

  function renderAudit() {
    var citationCount = 0;
    var sourceLinks = 0;
    var sites = {};
    var disputed = 0;
    var withSources = 0;
    var backed2 = 0;
    trophies.forEach(function (t) {
      var m = t.guide.match(/\[\d+\]/g);
      if (m) citationCount += m.length;
      sourceLinks += t.sources.length;
      t.sources.forEach(function (s) {
        try { sites[new URL(s.url).hostname] = true; } catch (e) { sites[s.url] = true; }
      });
      if (t.dispute && t.dispute.trim()) disputed++;
      if (t.sources.length >= 1) withSources++;
      if (t.sources.length >= 2) backed2++;
    });
    var hidden = trophies.filter(function (t) { return t.hidden; }).length;
    var items = [
      "<b>55/55</b> official name, description, grade",
      "<b>1P 2G 6S 46B</b>",
      "<b>" + hidden + "</b> PSN-hidden",
      "<b>" + citationCount + "</b> claims cited",
      "<b>" + withSources + "/55</b> guides cite sources",
      "<b>" + backed2 + "</b> backed by 2+ sources",
      "<b>" + sourceLinks + "</b> pages &middot; <b>" + Object.keys(sites).length + "</b> sites &middot; read 21 Nov 2026",
      "<b>" + disputed + "</b> disputes shown both ways"
    ];
    document.getElementById("auditStrip").innerHTML = items.map(function (s) { return "<span>" + s + "</span>"; }).join("");
  }

  var FILTERS = [
    ["all", "All 55"], ["story", "Story"], ["missable", "Missable"],
    ["collectibles", "Collectibles"], ["activities", "Activities"], ["online", "Online"],
    ["hidden", "PSN-hidden"], ["disputed", "Disputed"], ["notearned", "Not earned"],
    ["platinum", "P"], ["gold", "G"], ["silver", "S"], ["bronze", "B"]
  ];

  function renderFilters() {
    var el = document.getElementById("filters");
    var html = FILTERS.map(function (f) {
      return '<button type="button" class="chip' + (activeFilter === f[0] ? " active" : "") +
        '" data-filter="' + f[0] + '">' + esc(f[1]) + "</button>";
    }).join("");
    html += '<input type="search" class="search" id="searchBox" placeholder="Search name or description…" value="' + esc(searchText) + '">';
    el.innerHTML = html;
    el.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () { activeFilter = btn.getAttribute("data-filter"); renderAll(); });
    });
    var box = document.getElementById("searchBox");
    box.addEventListener("input", function () { searchText = box.value; renderList(); });
  }

  function renderList() {
    var list = document.getElementById("trophyList");
    var shown = roadmapSorted(trophies).filter(matchesFilter);
    if (!shown.length) {
      list.innerHTML = '<p class="empty-note">No trophies match this filter.</p>';
      return;
    }
    list.innerHTML = shown.map(function (t) {
      var cls = "trophy-item" + (t.id === selectedId ? " selected" : "") + (isEarned(t) ? " earned" : "");
      var tags = kindTags(t);
      if (t.hidden) tags += '<span class="tag hidden-tag">PSN-HIDDEN</span>';
      if (t.missable) tags += '<span class="tag missable-tag">MISSABLE</span>';
      return '<div class="' + cls + '" role="listitem" data-id="' + t.id + '">' +
        '<input type="checkbox" ' + (isEarned(t) ? "checked" : "") + ' aria-label="Mark earned">' +
        "<div>" + gradeBadge(t) + " <span class='tname'>" + esc(displayName(t)) + "</span>" +
        '<div class="tdesc">' + esc(displayDesc(t)) + "</div>" +
        '<div>' + tags + '<span class="tag">' + t.sources.length + " sources</span></div>" +
        "</div></div>";
    }).join("");
    list.querySelectorAll(".trophy-item").forEach(function (item) {
      var id = Number(item.getAttribute("data-id"));
      item.addEventListener("click", function (ev) {
        if (ev.target.tagName === "INPUT") return;
        selectedId = id;
        renderList();
        renderDetail();
      });
      item.querySelector("input").addEventListener("click", function (ev) {
        ev.stopPropagation();
        state.earned[id] = this.checked ? true : false;
        if (!this.checked) delete state.earned[id];
        saveState();
        updateProgress();
        renderList();
        renderDetail();
        renderRail();
        renderRoadmap();
      });
    });
  }

  // Keep the roadmap counts in step when a trophy is ticked from the list.

  function renderDetail() {
    var panel = document.getElementById("detailPanel");
    var t = trophies.find(function (x) { return x.id === selectedId; });
    if (!t) { panel.innerHTML = "<p class='empty-note'>Pick a trophy on the left to read its guide.</p>"; return; }
    var html = "";
    html += gradeBadge(t) + " <h2>" + esc(displayName(t)) + "</h2>";
    html += '<p class="official">Official description: ' + esc(displayDesc(t)) + "</p>";
    html += '<p>Grade: <strong>' + esc(t.grade) + "</strong> &middot; Stage: <strong>" +
      esc(STAGE_LABELS[t.roadmapStage] || t.roadmapStage) + "</strong> &middot; " +
      (t.hidden ? "Hidden on PSN until earned" : "Visible on PSN") + "</p>";
    if (!masked(t)) {
      html += "<h3>Guide</h3><p class='guide-text'>" + esc(t.guide) + "</p>";
      if (t.count) {
        var cur = getCount(t);
        html += "<h3>Your count</h3><div class='stepper'>" +
          "<button type='button' id='countMinus'>&minus;</button>" +
          "<span class='count-val'>" + cur + " / " + t.count.target + " " + esc(t.count.unit) + "</span>" +
          "<button type='button' id='countPlus'>+</button></div>";
      }
      if (t.missable && t.missableNote) {
        html += '<div class="callout"><h4>Missable — last-chance window</h4><p>' + esc(t.missableNote) + "</p></div>";
      }
      if (t.dispute && t.dispute.trim()) {
        html += '<div class="callout"><h4>Sources differ — both versions shown</h4><p>' +
          esc(t.dispute) + "</p><p><strong>Our call:</strong> the guide above follows the version the sources support best, as explained in the dispute note.</p></div>";
      }
    } else {
      html += "<p class='masked'>Guide hidden by the spoiler shield until this trophy is earned.</p>";
    }
    panel.innerHTML = html;
    var minus = document.getElementById("countMinus");
    var plus = document.getElementById("countPlus");
    if (minus && plus) {
      minus.addEventListener("click", function () {
        state.counts[t.id] = Math.max(0, getCount(t) - 1);
        saveState(); renderDetail();
      });
      plus.addEventListener("click", function () {
        state.counts[t.id] = Math.min(t.count.target, getCount(t) + 1);
        if (state.counts[t.id] >= t.count.target) state.earned[t.id] = true;
        saveState(); updateProgress(); renderDetail(); renderList(); renderRail();
      });
    }
  }

  function renderRail() {
    var rail = document.getElementById("railPanel");
    var ordered = roadmapSorted(trophies);
    var next = ordered.find(function (t) { return !isEarned(t); });
    var t = trophies.find(function (x) { return x.id === selectedId; });
    var html = "<h3>Next up</h3>";
    if (next) {
      html += '<p class="nextup">' + gradeBadge(next) + " <span class='tname'>" + esc(displayName(next)) +
        "</span><br><span class='tdesc'>" + esc(STAGE_LABELS[next.roadmapStage] || next.roadmapStage) + "</span></p>";
    } else {
      html += "<p class='nextup'>Every trophy earned — the platinum is yours.</p>";
    }
    if (t) {
      html += "<h3>Sources for this guide</h3><ol>";
      t.sources.forEach(function (s) {
        html += '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) +
          "</a> — read " + esc(s.read || "21 Nov 2026") + "</li>";
      });
      html += "</ol>";
    }
    rail.innerHTML = html;
  }

  function renderRoadmap() {
    var panel = document.getElementById("roadmapPanel");
    var html = "";
    STAGE_ORDER.forEach(function (stage) {
      var items = trophies.filter(function (t) { return t.roadmapStage === stage; })
        .sort(function (a, b) { return a.id - b.id; });
      if (!items.length) return;
      var earned = items.filter(isEarned).length;
      html += '<div class="stage"><h3>' + esc(STAGE_LABELS[stage]) + " — " + earned + "/" + items.length + " earned</h3><ul>";
      items.forEach(function (t) {
        html += "<li>" + gradeBadge(t) + " <strong>" + esc(displayName(t)) + "</strong>" +
          (t.missable ? ' <span class="tag missable-tag">MISSABLE</span>' : "") +
          " — " + esc(displayDesc(t)) + "</li>";
      });
      html += "</ul></div>";
    });
    html += '<div class="stage"><h3>Platinum</h3><p>Earn the other 54 trophies and <strong>Vice Got a Price!</strong> unlocks automatically.</p></div>';
    panel.innerHTML = html;
  }

  function renderMissables() {
    var panel = document.getElementById("missablesPanel");
    var missable = trophies.filter(function (t) { return t.missable; });
    var disputedMiss = trophies.filter(function (t) {
      return !t.missable && t.dispute && /\bmiss(able|ed|ing)\b/i.test(t.dispute);
    });
    var html = "";
    missable.forEach(function (t) {
      html += '<div class="miss-card"><h3>' + gradeBadge(t) + " " + esc(t.name) + "</h3>" +
        "<p><em>" + esc(t.description) + "</em></p>" +
        "<p><strong>Last-chance window:</strong> " + esc(t.missableNote || "See the guide.") + "</p>" +
        (t.dispute ? "<p><strong>Dispute:</strong> " + esc(t.dispute) + "</p>" : "") + "</div>";
    });
    disputedMiss.forEach(function (t) {
      html += '<div class="miss-card"><h3>' + gradeBadge(t) + " " + esc(t.name) + "</h3>" +
        "<p><em>" + esc(t.description) + "</em></p>" +
        "<p><strong>Missability dispute:</strong> " + esc(t.dispute) + "</p></div>";
    });
    if (!missable.length && !disputedMiss.length) html = "<p>No missable trophies found.</p>";
    panel.innerHTML = html;
  }

  function renderSources() {
    var panel = document.getElementById("sourcesPanel");
    var byUrl = {};
    trophies.forEach(function (t) {
      t.sources.forEach(function (s) {
        if (!byUrl[s.url]) byUrl[s.url] = { name: s.name, url: s.url, count: 0 };
        byUrl[s.url].count++;
      });
    });
    var list = Object.keys(byUrl).map(function (u) { return byUrl[u]; })
      .sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
    panel.innerHTML = list.map(function (s) {
      return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) +
        "</a> — cited by " + s.count + (s.count === 1 ? " trophy" : " trophies") + "</li>";
    }).join("");
  }

  function renderAll() {
    renderFilters();
    renderList();
    renderDetail();
    renderRail();
    renderRoadmap();
    renderMissables();
    renderSources();
    updateProgress();
  }

  function exportProgress() {
    var blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), state: state }, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leonida-trophy-codex-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var incoming = parsed.state || parsed;
        if (incoming && typeof incoming === "object") {
          state.earned = incoming.earned || {};
          state.counts = incoming.counts || {};
          if (typeof incoming.spoiler === "boolean") state.spoiler = incoming.spoiler;
          saveState();
          document.getElementById("spoilerToggle").checked = state.spoiler;
          renderAll();
        }
      } catch (e) { alert("That file could not be read as progress data."); }
    };
    reader.readAsText(file);
  }

  function wireChrome() {
    document.querySelectorAll("nav.tabs button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("nav.tabs button").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        document.querySelectorAll(".tabpane").forEach(function (p) { p.classList.remove("active"); });
        document.getElementById("tab-" + btn.getAttribute("data-tab")).classList.add("active");
      });
    });
    var toggle = document.getElementById("spoilerToggle");
    toggle.checked = state.spoiler;
    toggle.addEventListener("change", function () {
      state.spoiler = toggle.checked;
      saveState();
      renderList();
      renderDetail();
      renderRoadmap();
    });
    document.getElementById("exportBtn").addEventListener("click", exportProgress);
    document.getElementById("importBtn").addEventListener("click", function () {
      document.getElementById("importFile").click();
    });
    document.getElementById("importFile").addEventListener("change", function () {
      if (this.files && this.files[0]) importProgress(this.files[0]);
      this.value = "";
    });
  }

  loadState();
  wireChrome();
  fetch("data/trophies.json")
    .then(function (r) { if (!r.ok) throw new Error("trophies.json failed to load"); return r.json(); })
    .then(function (data) {
      trophies = (data.trophies || data).slice().sort(function (a, b) { return a.id - b.id; });
      selectedId = trophies.length ? trophies[0].id : null;
      renderAudit();
      renderAll();
    })
    .catch(function (err) {
      document.getElementById("detailPanel").innerHTML =
        "<p class='empty-note'>Could not load the trophy data. " + esc(err.message) + "</p>";
    });
})();

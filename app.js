const API_BASE = "https://tuenjai-bot.tor-newacc.workers.dev";
const LIFF_ID = "2009019120-2LfYAK9n"; // your LIFF id

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function setActiveTab(name){
  $all(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  $all(".page").forEach(p => p.classList.toggle("hidden", p.dataset.page !== name));
}

function authHeader(){
  const token = localStorage.getItem("sessionToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function ensureAuth(){
  // If already have sessionToken, done
  if (localStorage.getItem("sessionToken")) return;

  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return;
  }

  const idToken = liff.getIDToken();
  if (!idToken) throw new Error("No ID token");

  const res = await fetch(`${API_BASE}/auth/liff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(txt);

  const data = JSON.parse(txt);
  localStorage.setItem("sessionToken", data.sessionToken);
}

function renderList(el, items){
  if (!items.length) { el.innerHTML = `<div class="muted">ยังไม่มีรายการ</div>`; return; }
  el.innerHTML = items.map(it => `
    <div class="item">
      <div class="itemTop">
        <div class="time">${it.when}</div>
        <div class="muted small">${it.kind}</div>
      </div>
      <div>${it.desc}</div>
      ${it.loc ? `<div class="muted small">📍 ${it.loc}</div>` : ""}
    </div>
  `).join("");
}

async function loadOverview(){
  $("#todayList").textContent = "กำลังโหลด…";
  $("#upcomingList").textContent = "กำลังโหลด…";

  // TODO: replace with real endpoints
  // const res = await fetch(`${API_BASE}/reminders/upcoming?days=7`, { headers: authHeader() });
  // const data = await res.json();

  // Placeholder UI until endpoints exist
  const mockToday = [];
  const mockUpcoming = [];

  renderList($("#todayList"), mockToday);
  renderList($("#upcomingList"), mockUpcoming);
}

async function loadReminders(range="month"){
  $("#reminderList").textContent = "กำลังโหลด…";
  // TODO endpoint
  renderList($("#reminderList"), []);
}

async function loadTasks(status="scheduled"){
  $("#taskList").textContent = "กำลังโหลด…";
  // TODO endpoint
  renderList($("#taskList"), []);
}

function wireUI(){
  // tabs
  $all(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      setActiveTab(btn.dataset.tab);
      if (btn.dataset.tab === "overview") loadOverview();
      if (btn.dataset.tab === "reminders") loadReminders("month");
      if (btn.dataset.tab === "tasks") loadTasks("scheduled");
    });
  });

  $("#refreshBtn").addEventListener("click", () => {
    const active = document.querySelector(".tab.active")?.dataset.tab;
    if (active === "overview") loadOverview();
    if (active === "reminders") loadReminders("month");
    if (active === "tasks") loadTasks("scheduled");
  });

  // filters
  $all('[data-range]').forEach(chip => {
    chip.addEventListener("click", () => {
      $all('[data-range]').forEach(c => c.classList.toggle("active", c === chip));
      loadReminders(chip.dataset.range);
    });
  });

  $all('[data-status]').forEach(chip => {
    chip.addEventListener("click", () => {
      $all('[data-status]').forEach(c => c.classList.toggle("active", c === chip));
      loadTasks(chip.dataset.status);
    });
  });

  $("#signOutBtn").addEventListener("click", () => {
    localStorage.removeItem("sessionToken");
    location.reload();
  });

  // open LINE chat (replace with your bot URL later)
  $("#openLineBtn").addEventListener("click", (e) => {
    e.preventDefault();
    alert("ใส่ลิงก์เปิดแชท LINE ของบอทที่นี่");
  });

  setActiveTab("overview");
}

(async function start(){
  try {
    await ensureAuth();
    $("#debug").textContent = "✅ login ok";
    wireUI();
    await loadOverview();
  } catch (e) {
    document.body.innerHTML = `<div style="padding:16px"><h3>เกิดข้อผิดพลาด</h3><pre>${String(e.message||e)}</pre></div>`;
  }
})();

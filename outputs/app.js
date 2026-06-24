const adminToken = localStorage.getItem("havenlyToken");
if (!adminToken) location.replace("/");
const apiState = { rooms:[], residents:[], dashboard:null };
const apiHeaders = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${adminToken}` });
async function adminApi(path, options={}) {
  const response = await fetch(path, { ...options, headers:{...apiHeaders(), ...(options.headers || {})} });
  if (response.status === 401) { localStorage.clear(); location.replace("/"); throw new Error("Session expired"); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
const initialsFor = name => String(name || "Resident").split(" ").map(part=>part[0]).slice(0,2).join("").toUpperCase();

const maintenance = [
  { id:"MR-1428", room:"B-108", title:"Water leak under washbasin", desc:"Continuous dripping has caused water to collect below the sink.", resident:"Kasun Mendis", initials:"KM", status:"In progress", priority:"High", time:"12 min ago" },
  { id:"MR-1427", room:"A-204", title:"Ceiling fan making noise", desc:"Fan makes a loud rattling noise at medium and high speed.", resident:"Ayesha Perera", initials:"AP", status:"Pending", priority:"Medium", time:"36 min ago" },
  { id:"MR-1426", room:"C-312", title:"Study light not working", desc:"The desk lamp stopped working after last night's power cut.", resident:"Ruwan Silva", initials:"RS", status:"Pending", priority:"Low", time:"1 hr ago" },
  { id:"MR-1425", room:"B-202", title:"Bathroom door lock jammed", desc:"The lock is difficult to turn and occasionally gets stuck.", resident:"Dinesh Fernando", initials:"DF", status:"In progress", priority:"High", time:"2 hrs ago" },
  { id:"MR-1424", room:"A-116", title:"Wi-Fi signal is unstable", desc:"Connection drops frequently during the evening.", resident:"Nimali Jayasinghe", initials:"NJ", status:"Resolved", priority:"Medium", time:"Yesterday" },
  { id:"MR-1423", room:"C-104", title:"Window latch broken", desc:"Window cannot be secured properly from inside.", resident:"Tharushi De Mel", initials:"TD", status:"Resolved", priority:"High", time:"Yesterday" }
];

const rooms = [
  ["A-101","Block A · Floor 1","4-bed room","4 / 4","Occupied"],
  ["A-102","Block A · Floor 1","4-bed room","3 / 4","Available"],
  ["A-108","Block A · Floor 1","2-bed room","0 / 2","Maintenance"],
  ["A-204","Block A · Floor 2","4-bed room","4 / 4","Occupied"],
  ["B-108","Block B · Floor 1","2-bed room","2 / 2","Occupied"],
  ["B-202","Block B · Floor 2","4-bed room","3 / 4","Available"],
  ["C-104","Block C · Floor 1","3-bed room","3 / 3","Occupied"],
  ["C-312","Block C · Floor 3","4-bed room","2 / 4","Available"]
];

const residents = [
  ["Ayesha Perera","AP","Computer Science · Year 2","STU-2024-0182","A-204","077 842 1930","Paid"],
  ["Kasun Mendis","KM","Engineering · Year 3","STU-2023-0441","B-108","071 325 6812","Paid"],
  ["Ruwan Silva","RS","Business · Year 1","STU-2025-0107","C-312","076 119 4875","Pending"],
  ["Nimali Jayasinghe","NJ","Medicine · Year 4","STU-2022-0316","A-116","075 631 9082","Paid"],
  ["Dinesh Fernando","DF","Architecture · Year 2","STU-2024-0520","B-202","077 549 0264","Overdue"],
  ["Tharushi De Mel","TD","Law · Year 3","STU-2023-0228","C-104","072 873 4451","Paid"]
];

const payments = [
  ["Ayesha Perera","A-204","LKR 16,500","05 Jun 2026","Paid"],
  ["Kasun Mendis","B-108","LKR 16,500","05 Jun 2026","Paid"],
  ["Ruwan Silva","C-312","LKR 16,500","05 Jun 2026","Pending"],
  ["Nimali Jayasinghe","A-116","LKR 16,500","05 Jun 2026","Paid"],
  ["Dinesh Fernando","B-202","LKR 33,000","05 May 2026","Overdue"],
  ["Tharushi De Mel","C-104","LKR 16,500","05 Jun 2026","Paid"]
];

const visitors = [
  { name:"Malith Perera", initials:"MP", relation:"Brother", for:"Ayesha Perera", room:"A-204", date:"Today · 5:30 PM", status:"Pending" },
  { name:"Sajini Mendis", initials:"SM", relation:"Mother", for:"Kasun Mendis", room:"B-108", date:"Today · 3:00 PM", status:"Pending" },
  { name:"Hiruni Silva", initials:"HS", relation:"Friend", for:"Ruwan Silva", room:"C-312", date:"Tomorrow · 10:00 AM", status:"Pending" },
  { name:"Asanka Jayasinghe", initials:"AJ", relation:"Father", for:"Nimali Jayasinghe", room:"A-116", date:"24 Jun · 11:20 AM", status:"Approved" },
  { name:"Dinuka Fernando", initials:"DF", relation:"Brother", for:"Dinesh Fernando", room:"B-202", date:"23 Jun · 4:45 PM", status:"Checked out" }
];

const notices = [
  { type:"Important", title:"Scheduled water interruption", body:"Water supply to Blocks A and B will be paused for maintenance from 10:00 AM to 1:00 PM tomorrow.", date:"24 Jun 2026", audience:"Blocks A & B" },
  { type:"Event", title:"Residents’ monthly meeting", body:"The monthly residents’ meeting will be held in the common hall this Friday at 6:30 PM.", date:"23 Jun 2026", audience:"All residents" },
  { type:"Reminder", title:"June fee payment reminder", body:"Residents with pending accommodation fees are requested to settle payments before 30 June.", date:"22 Jun 2026", audience:"24 residents" },
  { type:"Maintenance", title:"Wi-Fi upgrade — Block C", body:"Network equipment will be upgraded on Saturday. Brief interruptions may occur between 8:00 AM and noon.", date:"20 Jun 2026", audience:"Block C" },
  { type:"General", title:"Keep shared kitchens clean", body:"Please label personal food items and clean all cooking surfaces immediately after use.", date:"18 Jun 2026", audience:"All residents" }
];

const statusClass = status => {
  const map = {"In progress":"progressing","Pending":"pending","Resolved":"resolved","Paid":"paid","Overdue":"overdue","Available":"available","Occupied":"occupied","Maintenance":"maintenance"};
  return map[status] || "resolved";
};

function renderDashboardRequests() {
  document.querySelector("#recentRequests").innerHTML = maintenance.slice(0,4).map(r => `
    <div class="request-row">
      <div class="request-room">${r.room}</div>
      <div class="request-info"><strong>${r.title}</strong><span>${r.id} · ${r.time}</span></div>
      <span class="priority ${r.priority.toLowerCase()}">${r.priority}</span>
      <span class="status ${statusClass(r.status)}">${r.status}</span>
    </div>`).join("");
}

function renderRooms() {
  document.querySelector("#roomsBody").innerHTML = rooms.map(r => `<tr>
    <td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td>
    <td><span class="status ${statusClass(r[4])}">${r[4]}</span></td>
    <td><button class="more-btn"><svg><use href="#i-more"/></svg></button></td></tr>`).join("");
}

function renderResidents() {
  document.querySelector("#residentsBody").innerHTML = residents.map(r => `<tr>
    <td><div class="table-person"><span class="table-avatar">${r[1]}</span><div><strong>${r[0]}</strong><small>${r[2]}</small></div></div></td>
    <td>${r[3]}</td><td><strong>${r[4]}</strong></td><td>${r[5]}</td>
    <td><span class="status ${statusClass(r[6])}">${r[6]}</span></td>
    <td><button class="more-btn"><svg><use href="#i-more"/></svg></button></td></tr>`).join("");
}

function renderPayments() {
  document.querySelector("#paymentsBody").innerHTML = payments.map(r => `<tr>
    <td><strong>${r[0]}</strong></td><td>${r[1]}</td><td><strong>${r[2]}</strong></td><td>${r[3]}</td>
    <td><span class="status ${statusClass(r[4])}">${r[4]}</span></td>
    <td><button class="more-btn"><svg><use href="#i-more"/></svg></button></td></tr>`).join("");
}

function renderMaintenance(filter="all") {
  const list = filter === "all" ? maintenance : maintenance.filter(r => r.status === filter);
  document.querySelector("#requestBoard").innerHTML = list.map(r => `<article class="request-ticket">
    <div class="ticket-top"><span class="status ${statusClass(r.status)}">${r.status}</span><small>${r.id} · ${r.time}</small></div>
    <h3>${r.title}</h3><p>${r.desc}</p>
    <div class="ticket-meta"><span class="table-avatar">${r.initials}</span><p><strong>${r.resident}</strong><span>Room ${r.room}</span></p><b class="priority ${r.priority.toLowerCase()}">${r.priority}</b></div>
    <div class="ticket-actions"><button>View details</button>${r.status !== "Resolved" ? `<button class="accent resolve-request" data-id="${r.id}">${r.status === "Pending" ? "Start work" : "Mark resolved"}</button>` : ""}</div>
  </article>`).join("") || `<div class="panel">No requests match this filter.</div>`;
}

function renderVisitors() {
  document.querySelector("#visitorGrid").innerHTML = visitors.map((v,i) => `<article class="visitor-card">
    <div class="visitor-head"><span class="table-avatar">${v.initials}</span><div><strong>${v.name}</strong><small>${v.relation} of ${v.for}</small></div><span class="status ${v.status === "Pending" ? "pending" : "resolved"}">${v.status}</span></div>
    <div class="visitor-details"><div><small>Visiting</small><strong>${v.for} · ${v.room}</strong></div><div><small>Expected</small><strong>${v.date}</strong></div></div>
    <div class="visitor-actions">${v.status === "Pending" ? `<button class="outline-btn visitor-decline" data-index="${i}">Decline</button><button class="primary-btn visitor-approve" data-index="${i}">Approve</button>` : `<button class="outline-btn">View record</button>`}</div>
  </article>`).join("");
}

function renderNotices() {
  document.querySelector("#noticeGrid").innerHTML = notices.map(n => `<article class="notice-card"><span class="notice-type">${n.type}</span><h3>${n.title}</h3><p>${n.body}</p><div class="notice-footer"><span>${n.date}</span><span>${n.audience}</span></div></article>`).join("");
}

const titles = {
  dashboard:"Good morning, Nadeesha", rooms:"Rooms & beds", residents:"Resident directory",
  complaints:"Maintenance", visitors:"Visitor management", payments:"Payments", notices:"Notices", settings:"Settings"
};

function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === id));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === id));
  document.querySelector("#pageTitle").textContent = titles[id];
  document.querySelector("#sidebar").classList.remove("open");
  document.querySelector("#sidebarScrim").classList.remove("open");
  window.scrollTo({top:0, behavior:"smooth"});
}

document.querySelectorAll("[data-page]").forEach(btn => btn.addEventListener("click", () => switchPage(btn.dataset.page)));
document.querySelectorAll("[data-page-link]").forEach(btn => btn.addEventListener("click", () => switchPage(btn.dataset.pageLink)));
document.querySelector("#menuBtn").addEventListener("click", () => {
  document.querySelector("#sidebar").classList.add("open");
  document.querySelector("#sidebarScrim").classList.add("open");
});
document.querySelector("#sidebarScrim").addEventListener("click", () => {
  document.querySelector("#sidebar").classList.remove("open");
  document.querySelector("#sidebarScrim").classList.remove("open");
});

document.querySelectorAll(".table-search").forEach(input => input.addEventListener("input", () => {
  const query = input.value.toLowerCase();
  document.querySelectorAll(`#${input.dataset.target} tbody tr`).forEach(row => row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none");
}));

document.querySelector("#requestTabs").addEventListener("click", e => {
  const btn = e.target.closest("button"); if (!btn) return;
  document.querySelectorAll("#requestTabs button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active"); renderMaintenance(btn.dataset.filter);
});

document.addEventListener("click", e => {
  const resolve = e.target.closest(".resolve-request");
  if (resolve) {
    const item = maintenance.find(r => r.id === resolve.dataset.id);
    const nextStatus = item.status === "Pending" ? "In progress" : "Resolved";
    adminApi(`/api/complaints/${item.id}`, {method:"PATCH", body:JSON.stringify({status:nextStatus})}).then(updated => {
      item.status = updated.status;
      renderMaintenance(document.querySelector("#requestTabs .active").dataset.filter);
      renderDashboardRequests(); showToast("Request updated", `${item.id} is now ${item.status.toLowerCase()}.`);
    }).catch(error => showToast("Update failed", error.message));
  }
  const approve = e.target.closest(".visitor-approve");
  if (approve) {
    const visitor = visitors[+approve.dataset.index];
    adminApi(`/api/visitors/${visitor.id}`, {method:"PATCH", body:JSON.stringify({status:"Approved"})}).then(() => {
      visitor.status = "Approved"; renderVisitors(); showToast("Visitor approved", "The resident will be notified.");
    }).catch(error => showToast("Update failed", error.message));
  }
  const decline = e.target.closest(".visitor-decline");
  if (decline) {
    const visitor = visitors[+decline.dataset.index];
    adminApi(`/api/visitors/${visitor.id}`, {method:"PATCH", body:JSON.stringify({status:"Declined"})}).then(() => {
      visitor.status = "Declined"; renderVisitors(); showToast("Request declined", "The resident will be notified.");
    }).catch(error => showToast("Update failed", error.message));
  }
});

const modalConfigs = {
  residentModal: { eyebrow:"RESIDENT MANAGEMENT", title:"Add new resident", fields:`
    <label>Full name<input required placeholder="e.g. Amaya Fernando"></label><label>Student ID<input required placeholder="STU-2026-0001"></label>
    <label>Email address<input type="email" placeholder="student@university.lk"></label><label>Phone number<input placeholder="+94 77 000 0000"></label>
    <label>Assign room<select><option>A-102 · 1 bed available</option><option>B-202 · 1 bed available</option><option>C-312 · 2 beds available</option></select></label><label>Check-in date<input type="date" value="2026-06-24"></label>` },
  roomModal: { eyebrow:"ACCOMMODATION", title:"Add a new room", fields:`
    <label>Room number<input required placeholder="e.g. C-315"></label><label>Block<select><option>Block A</option><option>Block B</option><option>Block C</option></select></label>
    <label>Floor<input type="number" value="1" min="1"></label><label>Number of beds<input type="number" value="4" min="1"></label>` },
  requestModal: { eyebrow:"MAINTENANCE", title:"Create maintenance request", fields:`
    <label>Resident<select class="resident-options" required></select></label><label>Issue title<input required placeholder="Briefly describe the issue"></label>
    <label>Priority<select><option>Low</option><option>Medium</option><option>High</option></select></label><label class="full">Description<textarea placeholder="Add relevant details..."></textarea></label>` },
  noticeModal: { eyebrow:"COMMUNICATIONS", title:"Publish a new notice", fields:`
    <label class="full">Notice title<input required placeholder="Enter a clear title"></label><label>Category<select><option>General</option><option>Important</option><option>Event</option><option>Maintenance</option></select></label>
    <label>Audience<select name="audience"><option>All residents</option><option>Block A</option><option>Block B</option><option>Block C</option></select></label><label class="full">Message<textarea name="message" required placeholder="Write your announcement..."></textarea></label>` },
  visitorModal: { eyebrow:"VISITOR MANAGEMENT", title:"Log a visitor request", fields:`
    <label>Resident<select name="residentId" class="resident-options" required></select></label><label>Visitor name<input name="visitorName" required placeholder="Full name"></label>
    <label>Phone<input name="visitorPhone" placeholder="+94 77 000 0000"></label><label>Relationship<input name="relationship" placeholder="Parent, friend..."></label>
    <label class="full">Visit date and time<input name="visitDate" type="datetime-local" required></label>` },
  paymentModal: { eyebrow:"FEE MANAGEMENT", title:"Record a fee or payment", fields:`
    <label>Resident<select name="residentId" class="resident-options" required></select></label><label>Amount (LKR)<input name="amount" type="number" value="16500" required></label>
    <label>Period<input name="period" type="month" value="2026-06" required></label><label>Due date<input name="dueDate" type="date" value="2026-06-30" required></label>
    <label>Status<select name="status"><option>Pending</option><option>Paid</option><option>Overdue</option></select></label><label>Reference<input name="reference" placeholder="Bank or receipt reference"></label>` }
};

const modalBackdrop = document.querySelector("#modalBackdrop");
let activeModalId = "residentModal";
function openModal(id="residentModal") {
  activeModalId = id;
  const config = modalConfigs[id];
  document.querySelector("#modalEyebrow").textContent = config.eyebrow;
  document.querySelector("#modalTitle").textContent = config.title;
  document.querySelector("#modalFields").innerHTML = config.fields;
  document.querySelectorAll(".resident-options").forEach(select => select.innerHTML = apiState.residents.map(r => `<option value="${r.id}">${r.user.name} · ${r.studentId}</option>`).join(""));
  if (id === "residentModal") {
    const select = document.querySelector("#modalFields select");
    if (select) select.innerHTML = apiState.rooms.filter(r => r.status !== "Maintenance" && r.occupants.length < r.capacity).map(r => `<option value="${r.id}">${r.number} · ${r.capacity-r.occupants.length} bed(s) available</option>`).join("");
  }
  modalBackdrop.classList.add("open");
}
function closeModal() { modalBackdrop.classList.remove("open"); }
document.querySelectorAll(".open-modal").forEach(b => b.addEventListener("click", () => openModal(b.dataset.modal)));
document.querySelectorAll(".close-modal").forEach(b => b.addEventListener("click", closeModal));
modalBackdrop.addEventListener("click", e => { if (e.target === modalBackdrop) closeModal(); });
document.querySelector("#quickActionBtn").addEventListener("click", () => openModal("residentModal"));
document.querySelector("#modalForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const values = Object.fromEntries(form.entries());
  const fieldInputs = [...e.target.querySelectorAll("input,select,textarea")];
  fieldInputs.forEach(input => { if (input.name) values[input.name] = input.value; });
  try {
    if (activeModalId === "roomModal") {
      const inputs = fieldInputs; await adminApi("/api/rooms",{method:"POST",body:JSON.stringify({number:inputs[0].value,block:inputs[1].value,floor:inputs[2].value,capacity:inputs[3].value})});
    } else if (activeModalId === "residentModal") {
      await adminApi("/api/residents",{method:"POST",body:JSON.stringify({name:fieldInputs[0].value,studentId:fieldInputs[1].value,email:fieldInputs[2].value,phone:fieldInputs[3].value,roomId:fieldInputs[4].value,checkInDate:fieldInputs[5].value})});
    } else if (activeModalId === "requestModal") {
      await adminApi("/api/complaints",{method:"POST",body:JSON.stringify({residentId:fieldInputs[0].value,title:fieldInputs[1].value,priority:fieldInputs[2].value,description:fieldInputs[3].value})});
    } else if (activeModalId === "noticeModal") {
      await adminApi("/api/notices",{method:"POST",body:JSON.stringify({title:fieldInputs[0].value,category:fieldInputs[1].value,audience:fieldInputs[2].value,message:fieldInputs[3].value})});
    } else if (activeModalId === "visitorModal") {
      await adminApi("/api/visitors",{method:"POST",body:JSON.stringify(values)});
    } else if (activeModalId === "paymentModal") {
      await adminApi("/api/payments",{method:"POST",body:JSON.stringify(values)});
    }
    closeModal(); showToast("Details saved", "The record has been added successfully."); await loadAdminData();
  } catch(error) { showToast("Unable to save", error.message); }
});

let toastTimer;
function showToast(title, body) {
  const toast = document.querySelector("#toast");
  toast.querySelector("strong").textContent = title; toast.querySelector("small").textContent = body;
  toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
document.querySelector("#saveSettings").addEventListener("click", () => showToast("Settings saved", "Your residence details have been updated."));

document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); document.querySelector("#globalSearch").focus(); }
  if (e.key === "Escape") closeModal();
});
document.querySelector("#globalSearch").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.value.trim()) { switchPage("residents"); const search = document.querySelector('[data-target="residentsTable"]'); search.value = e.target.value; search.dispatchEvent(new Event("input")); }
});

async function loadAdminData() {
  try {
    const [me,dashboardData,roomData,residentData,complaintData,visitorData,paymentData,noticeData] = await Promise.all([
      adminApi("/api/me"),adminApi("/api/dashboard"),adminApi("/api/rooms"),adminApi("/api/residents"),adminApi("/api/complaints"),adminApi("/api/visitors"),adminApi("/api/payments"),adminApi("/api/notices")
    ]);
    if (me.user.role === "student") { location.replace("/student/"); return; }
    apiState.rooms=roomData; apiState.residents=residentData; apiState.dashboard=dashboardData;
    document.querySelector(".sidebar-profile strong").textContent=me.user.name;
    document.querySelector(".sidebar-profile .avatar").textContent=initialsFor(me.user.name);
    document.querySelector("#dashboardResidents").textContent=dashboardData.residents;
    document.querySelector("#dashboardBeds").textContent=`of ${dashboardData.totalBeds} beds`;
    document.querySelector("#dashboardRequests").textContent=dashboardData.openComplaints;
    document.querySelector("#dashboardPriority").textContent=`${dashboardData.highPriorityComplaints} high priority`;
    document.querySelector("#dashboardVisitors").textContent=`${dashboardData.pendingVisitors} awaiting approval`;
    rooms.splice(0,rooms.length,...roomData.map(r=>[r.number,`${r.block} · Floor ${r.floor}`,r.type,`${r.occupants.length} / ${r.capacity}`,r.status]));
    residents.splice(0,residents.length,...residentData.map(r=>[r.user.name,initialsFor(r.user.name),`${r.faculty} · ${r.year}`,r.studentId,r.room?.number||"Unassigned",r.user.phone||"—",paymentData.find(p=>p.residentId===r.id)?.status||"Pending"]));
    maintenance.splice(0,maintenance.length,...complaintData.map(c=>({id:c.id,room:c.room?.number||"—",title:c.title,desc:c.description,resident:c.residentName,initials:initialsFor(c.residentName),status:c.status,priority:c.priority,time:new Date(c.createdAt).toLocaleDateString()})));
    visitors.splice(0,visitors.length,...visitorData.map(v=>({id:v.id,name:v.visitorName,initials:initialsFor(v.visitorName),relation:v.relationship,for:v.residentName,room:v.room?.number||"—",date:new Date(v.visitDate).toLocaleString(),status:v.status})));
    payments.splice(0,payments.length,...paymentData.map(p=>[p.residentName,p.room?.number||"—",`LKR ${Number(p.amount).toLocaleString()}`,new Date(p.dueDate).toLocaleDateString(),p.status]));
    notices.splice(0,notices.length,...noticeData.map(n=>({type:n.category,title:n.title,body:n.message,date:new Date(n.publishedAt).toLocaleDateString(),audience:n.audience})));
    renderDashboardRequests();renderRooms();renderResidents();renderPayments();renderMaintenance(document.querySelector("#requestTabs .active")?.dataset.filter||"all");renderVisitors();renderNotices();
  } catch(error) { showToast("Unable to load data", error.message); }
}
loadAdminData();
document.querySelector("#adminLogout").addEventListener("click", async () => {
  try { await adminApi("/api/auth/logout",{method:"POST",body:"{}"}); } catch {}
  localStorage.clear(); location.replace("/");
});

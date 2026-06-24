const token = localStorage.getItem("havenlyToken");
if (!token) location.replace("/");

const state = { me:null, complaints:[], visitors:[], payments:[], notices:[], notifications:[], requestFilter:"all", noticeFilter:"all", image:null };
const headers = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${token}` });
async function api(path, options={}) {
  const response = await fetch(path, { ...options, headers:{...headers(), ...(options.headers || {})} });
  if (response.status === 401) { localStorage.clear(); location.replace("/"); throw new Error("Session expired"); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data;
}
const $ = selector => document.querySelector(selector);
const formatDate = value => new Intl.DateTimeFormat("en-LK",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value));
const formatDateTime = value => new Intl.DateTimeFormat("en-LK",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}).format(new Date(value));
const statusClass = value => value.replaceAll(" ","-");
const initials = name => name.split(" ").map(part=>part[0]).slice(0,2).join("").toUpperCase();

function showToast(message) {
  const toast=$("#mobileToast"); toast.textContent=message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove("show"),2600);
}

function switchScreen(id) {
  document.querySelectorAll(".screen").forEach(screen=>screen.classList.toggle("active",screen.id===id));
  document.querySelectorAll(".bottom-nav button").forEach(button=>button.classList.toggle("active",button.dataset.screen===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click", event => {
  const screenButton=event.target.closest("[data-screen]");
  if(screenButton) switchScreen(screenButton.dataset.screen);
  const sheetButton=event.target.closest("[data-sheet]");
  if(sheetButton) openSheet(sheetButton.dataset.sheet);
});

function openSheet(id) {
  document.querySelectorAll(".sheet").forEach(sheet=>sheet.classList.toggle("active",sheet.id===id));
  $("#sheetBackdrop").classList.add("open");
}
function closeSheet(){ $("#sheetBackdrop").classList.remove("open"); }
document.querySelectorAll(".close-sheet").forEach(button=>button.addEventListener("click",closeSheet));
$("#sheetBackdrop").addEventListener("click",event=>{if(event.target===$("#sheetBackdrop"))closeSheet()});
$("#notificationButton").addEventListener("click",()=>openSheet("notificationsSheet"));

function renderProfile() {
  const { user,resident,room }=state.me;
  $("#firstName").textContent=user.name.split(" ")[0];
  $("#profileName").textContent=user.name; $("#profileAvatar").textContent=initials(user.name);
  $("#profileId").textContent=resident.studentId;
  $("#homeRoom").textContent=room.number; $("#homeBlock").textContent=`${room.block} · Floor ${room.floor}`;
  $("#roomNumber").textContent=room.number; $("#roomLocation").textContent=`${room.block} · Floor ${room.floor}`;
  $("#roomType").textContent=room.type; $("#roomOccupancy").textContent=`${room.occupants.length} of ${room.capacity}`;
  $("#checkInDate").textContent=formatDate(resident.checkInDate);
  $("#amenities").innerHTML=room.amenities.map(item=>`<span>✓ ${item}</span>`).join("");
}
function renderNotices() {
  const filtered=state.noticeFilter==="all"?state.notices:state.notices.filter(item=>item.category===state.noticeFilter);
  const card=n=>`<article class="notice-card"><span class="notice-tag">${n.category}</span><h3>${n.title}</h3><p>${n.message}</p><footer><span>${formatDate(n.publishedAt)}</span><span>${n.audience}</span></footer></article>`;
  $("#noticeList").innerHTML=filtered.map(card).join("")||`<div class="info-banner">No notices in this category.</div>`;
  $("#latestNotice").innerHTML=state.notices.length?card(state.notices[0]):`<div class="info-banner">No new notices.</div>`;
}
function renderRequests() {
  const filtered=state.requestFilter==="all"?state.complaints:state.complaints.filter(item=>item.status===state.requestFilter);
  $("#requestList").innerHTML=filtered.map(item=>`<article class="request-card"><div class="card-top"><span class="status ${statusClass(item.status)}">${item.status}</span><small>${item.id}</small></div><h3>${item.title}</h3><p>${item.description}</p><div class="card-footer"><span>${item.category} · ${item.priority}</span><span>${formatDate(item.createdAt)}</span></div></article>`).join("")||`<div class="info-banner">No maintenance requests found.</div>`;
  $("#homeRequests").innerHTML=state.complaints.slice(0,2).map(item=>`<article class="request-compact"><span class="request-symbol">⌁</span><div><strong>${item.title}</strong><small>${item.id} · ${formatDate(item.createdAt)}</small></div><span class="status ${statusClass(item.status)}">${item.status}</span></article>`).join("")||`<div class="info-banner">No maintenance requests yet.</div>`;
}
function renderPayments() {
  const outstanding=state.payments.filter(item=>item.status!=="Paid").reduce((sum,item)=>sum+item.amount,0);
  $("#currentBalance").textContent=`LKR ${outstanding.toLocaleString()}`;
  $("#paymentMessage").textContent=outstanding?"Outstanding accommodation fees":"You're all caught up.";
  $("#paymentList").innerHTML=state.payments.map(item=>`<article class="payment-card"><span class="payment-icon">▣</span><div><strong>${item.period}</strong><small>Due ${formatDate(item.dueDate)}</small></div><div><strong>LKR ${item.amount.toLocaleString()}</strong><small class="status ${statusClass(item.status)}">${item.status}</small></div></article>`).join("")||`<div class="info-banner">No fee records available.</div>`;
}
function renderVisitors() {
  $("#visitorHistory").innerHTML=state.visitors.map(item=>`<article class="visitor-mini"><span class="request-symbol">♙</span><div><strong>${item.visitorName}</strong><small>${item.relationship} · ${formatDateTime(item.visitDate)}</small></div><span class="status ${statusClass(item.status)}">${item.status}</span></article>`).join("")||`<div class="info-banner">No visitor requests yet.</div>`;
}
function renderNotifications() {
  const unread=state.notifications.filter(item=>!item.read).length;
  $("#notificationCount").textContent=unread||"";
  $("#notificationList").innerHTML=state.notifications.map(item=>`<article class="notification-card ${item.read?"":"unread"}" data-notification="${item.id}"><h3>${item.title}</h3><p>${item.message}</p><footer>${formatDateTime(item.createdAt)}</footer></article>`).join("")||`<div class="info-banner">You're all caught up.</div>`;
}

$("#requestFilters").addEventListener("click",event=>{const button=event.target.closest("button");if(!button)return;document.querySelectorAll("#requestFilters button").forEach(item=>item.classList.remove("active"));button.classList.add("active");state.requestFilter=button.dataset.filter;renderRequests()});
$("#noticeFilters").addEventListener("click",event=>{const button=event.target.closest("button");if(!button)return;document.querySelectorAll("#noticeFilters button").forEach(item=>item.classList.remove("active"));button.classList.add("active");state.noticeFilter=button.dataset.filter;renderNotices()});
$("#notificationList").addEventListener("click",async event=>{const card=event.target.closest("[data-notification]");if(!card||!card.classList.contains("unread"))return;await api(`/api/notifications/${card.dataset.notification}/read`,{method:"PATCH",body:"{}"});const item=state.notifications.find(n=>n.id===card.dataset.notification);item.read=true;renderNotifications()});

$("#complaintImage").addEventListener("change",event=>{
  const file=event.target.files[0]; if(!file)return;
  if(file.size>4*1024*1024){showToast("Please choose an image under 4 MB");event.target.value="";return}
  const reader=new FileReader();reader.onload=()=>{state.image=reader.result;$("#uploadText").textContent=`Selected: ${file.name}`};reader.readAsDataURL(file);
});
$("#complaintForm").addEventListener("submit",async event=>{
  event.preventDefault();const form=new FormData(event.target);const button=event.target.querySelector("button[type=submit]");button.disabled=true;button.textContent="Submitting…";
  try{const complaint=await api("/api/complaints",{method:"POST",body:JSON.stringify({title:form.get("title"),category:form.get("category"),priority:form.get("priority"),description:form.get("description"),image:state.image})});state.complaints.unshift(complaint);renderRequests();event.target.reset();state.image=null;$("#uploadText").textContent="Tap to choose an image";closeSheet();showToast("Maintenance request submitted")}
  catch(error){showToast(error.message)}finally{button.disabled=false;button.textContent="Submit request"}
});
$("#visitorForm").addEventListener("submit",async event=>{
  event.preventDefault();const form=new FormData(event.target);const button=event.target.querySelector("button[type=submit]");button.disabled=true;button.textContent="Sending…";
  try{const visitor=await api("/api/visitors",{method:"POST",body:JSON.stringify(Object.fromEntries(form.entries()))});state.visitors.unshift(visitor);renderVisitors();event.target.reset();closeSheet();showToast("Visitor request sent for approval")}
  catch(error){showToast(error.message)}finally{button.disabled=false;button.textContent="Send for approval"}
});
$("#logoutButton").addEventListener("click",async()=>{try{await api("/api/auth/logout",{method:"POST",body:"{}"})}catch{}localStorage.clear();location.replace("/")});

let deferredInstall;
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstall=event;$("#installButton").hidden=false});
$("#installButton").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installButton").hidden=true});
if("serviceWorker" in navigator) navigator.serviceWorker.register("/student/sw.js");

async function initialize() {
  try{
    [state.me,state.complaints,state.visitors,state.payments,state.notices,state.notifications]=await Promise.all([
      api("/api/me"),api("/api/complaints"),api("/api/visitors"),api("/api/payments"),api("/api/notices"),api("/api/notifications")
    ]);
    if(state.me.user.role!=="student"){location.replace("/admin");return}
    renderProfile();renderRequests();renderVisitors();renderPayments();renderNotices();renderNotifications();
  }catch(error){showToast(error.message)}
}
initialize();

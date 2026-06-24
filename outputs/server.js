"use strict";

const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");

const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(DATA_DIR, "seed.json");
const PORT = Number(process.env.PORT || 4173);
const sessions = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json"
};

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

async function initializeDatabase() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const seed = JSON.parse(await fsp.readFile(SEED_FILE, "utf8"));
    seed.users = seed.users.map(user => ({
      ...user,
      passwordHash: hashPassword(user.password),
      password: undefined
    }));
    await writeDatabase(seed);
  }
}

async function readDatabase() {
  return JSON.parse(await fsp.readFile(DB_FILE, "utf8"));
}

let writeQueue = Promise.resolve();
function writeDatabase(data) {
  writeQueue = writeQueue.then(async () => {
    const temporary = `${DB_FILE}.tmp`;
    await fsp.writeFile(temporary, JSON.stringify(data, null, 2), "utf8");
    await fsp.rename(temporary, DB_FILE);
  });
  return writeQueue;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": MIME[".json"],
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message, details) {
  sendJson(res, status, { error: message, ...(details ? { details } : {}) });
}

async function parseBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 6 * 1024 * 1024) throw Object.assign(new Error("Request too large"), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
  }
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function bearerToken(req) {
  const value = req.headers.authorization || "";
  return value.startsWith("Bearer ") ? value.slice(7) : null;
}

async function authenticate(req) {
  const token = bearerToken(req);
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  const db = await readDatabase();
  const user = db.users.find(item => item.id === session.userId && item.active !== false);
  return user ? { user, token, db } : null;
}

function requireRole(auth, roles, res) {
  if (!auth) {
    sendError(res, 401, "Authentication required");
    return false;
  }
  if (roles && !roles.includes(auth.user.role)) {
    sendError(res, 403, "You do not have permission to perform this action");
    return false;
  }
  return true;
}

function nextId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function now() {
  return new Date().toISOString();
}

function createNotification(db, userId, title, message, type = "general") {
  db.notifications.unshift({
    id: nextId("NOT"),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: now()
  });
}

function studentRecord(db, user) {
  return db.residents.find(item => item.userId === user.id);
}

function scopedRecords(db, resource, user) {
  if (user.role !== "student") return db[resource];
  const resident = studentRecord(db, user);
  if (!resident) return [];
  if (resource === "complaints" || resource === "visitorRequests" || resource === "payments") {
    return db[resource].filter(item => item.residentId === resident.id);
  }
  if (resource === "notices") {
    return db.notices.filter(item =>
      item.audience === "All residents" ||
      item.audience === resident.block ||
      item.audience === resident.id
    );
  }
  return [];
}

async function apiHandler(req, res, url) {
  const method = req.method;
  const pathname = url.pathname;

  if (method === "GET" && pathname === "/api/health") {
    return sendJson(res, 200, {
      status: "ok",
      service: "havenly-hostel-management",
      time: now()
    });
  }

  if (method === "POST" && pathname === "/api/auth/login") {
    const { email, password } = await parseBody(req);
    const db = await readDatabase();
    const user = db.users.find(item => item.email.toLowerCase() === String(email || "").toLowerCase());
    if (!user || user.active === false || !verifyPassword(String(password || ""), user.passwordHash)) {
      return sendError(res, 401, "Invalid email or password");
    }
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
    return sendJson(res, 200, {
      token,
      user: publicUser(user),
      redirect: user.role === "student" ? "/student/" : "/admin"
    });
  }

  const auth = await authenticate(req);

  if (method === "POST" && pathname === "/api/auth/logout") {
    if (auth) sessions.delete(auth.token);
    return sendJson(res, 200, { success: true });
  }
  if (method === "GET" && pathname === "/api/me") {
    if (!requireRole(auth, null, res)) return;
    const resident = auth.user.role === "student" ? studentRecord(auth.db, auth.user) : null;
    const room = resident ? auth.db.rooms.find(item => item.id === resident.roomId) : null;
    return sendJson(res, 200, { user: publicUser(auth.user), resident, room });
  }

  if (!requireRole(auth, null, res)) return;
  const { user, db } = auth;

  if (method === "GET" && pathname === "/api/dashboard") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const occupied = db.rooms.reduce((sum, room) => sum + room.occupants.length, 0);
    const totalBeds = db.rooms.reduce((sum, room) => sum + room.capacity, 0);
    const openComplaints = db.complaints.filter(item => item.status !== "Resolved");
    const overdue = db.payments.filter(item => item.status === "Overdue");
    const pendingVisitors = db.visitorRequests.filter(item => item.status === "Pending");
    return sendJson(res, 200, {
      residents: db.residents.length,
      occupied,
      totalBeds,
      occupancyRate: totalBeds ? Math.round((occupied / totalBeds) * 100) : 0,
      openComplaints: openComplaints.length,
      highPriorityComplaints: openComplaints.filter(item => item.priority === "High").length,
      overduePayments: overdue.length,
      overdueAmount: overdue.reduce((sum, item) => sum + item.amount, 0),
      pendingVisitors: pendingVisitors.length
    });
  }

  if (method === "GET" && pathname === "/api/rooms") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    return sendJson(res, 200, db.rooms);
  }
  if (method === "POST" && pathname === "/api/rooms") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const body = await parseBody(req);
    if (!body.number || !body.block || !Number(body.capacity)) return sendError(res, 400, "Room number, block, and capacity are required");
    if (db.rooms.some(room => room.number.toLowerCase() === body.number.toLowerCase())) return sendError(res, 409, "Room number already exists");
    const room = {
      id: nextId("ROOM"),
      number: body.number,
      block: body.block,
      floor: Number(body.floor || 1),
      type: body.type || `${body.capacity}-bed room`,
      capacity: Number(body.capacity),
      occupants: [],
      status: body.status || "Available",
      amenities: body.amenities || []
    };
    db.rooms.push(room);
    await writeDatabase(db);
    return sendJson(res, 201, room);
  }

  const roomMatch = pathname.match(/^\/api\/rooms\/([^/]+)$/);
  if (roomMatch && method === "PATCH") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const room = db.rooms.find(item => item.id === roomMatch[1]);
    if (!room) return sendError(res, 404, "Room not found");
    const body = await parseBody(req);
    Object.assign(room, ["number", "block", "floor", "type", "capacity", "status", "amenities"].reduce((out, key) => {
      if (body[key] !== undefined) out[key] = body[key];
      return out;
    }, {}));
    await writeDatabase(db);
    return sendJson(res, 200, room);
  }

  if (method === "GET" && pathname === "/api/residents") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    return sendJson(res, 200, db.residents.map(resident => ({
      ...resident,
      room: db.rooms.find(room => room.id === resident.roomId) || null,
      user: publicUser(db.users.find(account => account.id === resident.userId) || {})
    })));
  }
  if (method === "POST" && pathname === "/api/residents") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const body = await parseBody(req);
    if (!body.name || !body.studentId || !body.email || !body.roomId) return sendError(res, 400, "Name, student ID, email, and room are required");
    const room = db.rooms.find(item => item.id === body.roomId);
    if (!room) return sendError(res, 404, "Selected room was not found");
    if (room.occupants.length >= room.capacity || room.status === "Maintenance") return sendError(res, 409, "Selected room has no available bed");
    const userAccount = {
      id: nextId("USR"),
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      role: "student",
      active: true,
      passwordHash: hashPassword(body.password || "student123")
    };
    const resident = {
      id: nextId("RES"),
      userId: userAccount.id,
      studentId: body.studentId,
      faculty: body.faculty || "",
      year: body.year || "",
      guardianName: body.guardianName || "",
      guardianPhone: body.guardianPhone || "",
      roomId: room.id,
      block: room.block,
      checkInDate: body.checkInDate || now().slice(0, 10),
      status: "Active"
    };
    db.users.push(userAccount);
    db.residents.push(resident);
    room.occupants.push(resident.id);
    room.status = room.occupants.length >= room.capacity ? "Occupied" : "Available";
    createNotification(db, userAccount.id, "Welcome to Havenly", `You have been allocated to room ${room.number}.`, "allocation");
    await writeDatabase(db);
    return sendJson(res, 201, { ...resident, room, user: publicUser(userAccount) });
  }

  const allocationMatch = pathname.match(/^\/api\/residents\/([^/]+)\/allocate$/);
  if (allocationMatch && method === "PATCH") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const resident = db.residents.find(item => item.id === allocationMatch[1]);
    if (!resident) return sendError(res, 404, "Resident not found");
    const { roomId } = await parseBody(req);
    const target = db.rooms.find(item => item.id === roomId);
    if (!target) return sendError(res, 404, "Room not found");
    if (target.occupants.length >= target.capacity || target.status === "Maintenance") return sendError(res, 409, "Room has no available bed");
    const previous = db.rooms.find(item => item.id === resident.roomId);
    if (previous) {
      previous.occupants = previous.occupants.filter(id => id !== resident.id);
      previous.status = previous.occupants.length >= previous.capacity ? "Occupied" : "Available";
    }
    target.occupants.push(resident.id);
    target.status = target.occupants.length >= target.capacity ? "Occupied" : "Available";
    resident.roomId = target.id;
    resident.block = target.block;
    createNotification(db, resident.userId, "Room allocation updated", `Your assigned room is now ${target.number}.`, "allocation");
    await writeDatabase(db);
    return sendJson(res, 200, { ...resident, room: target });
  }

  if (method === "GET" && pathname === "/api/complaints") {
    return sendJson(res, 200, scopedRecords(db, "complaints", user).map(item => ({
      ...item,
      resident: db.residents.find(resident => resident.id === item.residentId) || null,
      residentName: publicUser(db.users.find(account => account.id === db.residents.find(resident => resident.id === item.residentId)?.userId) || {}).name || "Resident",
      room: db.rooms.find(room => room.id === item.roomId) || null
    })));
  }
  if (method === "POST" && pathname === "/api/complaints") {
    const body = await parseBody(req);
    let residentId = body.residentId;
    if (user.role === "student") residentId = studentRecord(db, user)?.id;
    if (!residentId || !body.title || !body.description) return sendError(res, 400, "Resident, title, and description are required");
    const resident = db.residents.find(item => item.id === residentId);
    if (!resident) return sendError(res, 404, "Resident not found");
    const complaint = {
      id: nextId("CMP"),
      residentId,
      roomId: resident.roomId,
      title: body.title,
      description: body.description,
      category: body.category || "General",
      priority: body.priority || "Medium",
      status: "Pending",
      image: body.image || null,
      createdAt: now(),
      updatedAt: now(),
      history: [{ status: "Pending", at: now(), by: user.id }]
    };
    db.complaints.unshift(complaint);
    db.users.filter(item => ["admin", "warden"].includes(item.role)).forEach(account =>
      createNotification(db, account.id, "New maintenance request", `${complaint.title} was reported.`, "maintenance")
    );
    await writeDatabase(db);
    return sendJson(res, 201, complaint);
  }

  const complaintMatch = pathname.match(/^\/api\/complaints\/([^/]+)$/);
  if (complaintMatch && method === "PATCH") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const complaint = db.complaints.find(item => item.id === complaintMatch[1]);
    if (!complaint) return sendError(res, 404, "Complaint not found");
    const body = await parseBody(req);
    if (body.status) {
      complaint.status = body.status;
      complaint.history.push({ status: body.status, note: body.note || "", at: now(), by: user.id });
    }
    if (body.priority) complaint.priority = body.priority;
    complaint.updatedAt = now();
    const resident = db.residents.find(item => item.id === complaint.residentId);
    if (resident) createNotification(db, resident.userId, "Maintenance request updated", `${complaint.title} is now ${complaint.status}.`, "maintenance");
    await writeDatabase(db);
    return sendJson(res, 200, complaint);
  }

  if (method === "GET" && pathname === "/api/visitors") {
    return sendJson(res, 200, scopedRecords(db, "visitorRequests", user).map(item => {
      const resident = db.residents.find(entry => entry.id === item.residentId);
      return {
        ...item,
        residentName: publicUser(db.users.find(account => account.id === resident?.userId) || {}).name || "Resident",
        room: db.rooms.find(room => room.id === resident?.roomId) || null
      };
    }));
  }
  if (method === "POST" && pathname === "/api/visitors") {
    const body = await parseBody(req);
    let residentId = body.residentId;
    if (user.role === "student") residentId = studentRecord(db, user)?.id;
    if (!residentId || !body.visitorName || !body.visitDate) return sendError(res, 400, "Visitor name and visit date are required");
    const request = {
      id: nextId("VIS"),
      residentId,
      visitorName: body.visitorName,
      visitorPhone: body.visitorPhone || "",
      relationship: body.relationship || "Guest",
      idNumber: body.idNumber || "",
      visitDate: body.visitDate,
      purpose: body.purpose || "",
      status: "Pending",
      checkedInAt: null,
      checkedOutAt: null,
      createdAt: now()
    };
    db.visitorRequests.unshift(request);
    db.users.filter(item => ["admin", "warden"].includes(item.role)).forEach(account =>
      createNotification(db, account.id, "Visitor approval needed", `${request.visitorName} has been requested for entry.`, "visitor")
    );
    await writeDatabase(db);
    return sendJson(res, 201, request);
  }

  const visitorMatch = pathname.match(/^\/api\/visitors\/([^/]+)$/);
  if (visitorMatch && method === "PATCH") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const request = db.visitorRequests.find(item => item.id === visitorMatch[1]);
    if (!request) return sendError(res, 404, "Visitor request not found");
    const body = await parseBody(req);
    if (body.status) request.status = body.status;
    if (body.status === "Checked in") request.checkedInAt = now();
    if (body.status === "Checked out") request.checkedOutAt = now();
    const resident = db.residents.find(item => item.id === request.residentId);
    if (resident) createNotification(db, resident.userId, "Visitor request updated", `${request.visitorName}: ${request.status}.`, "visitor");
    await writeDatabase(db);
    return sendJson(res, 200, request);
  }

  if (method === "GET" && pathname === "/api/payments") {
    return sendJson(res, 200, scopedRecords(db, "payments", user).map(item => {
      const resident = db.residents.find(entry => entry.id === item.residentId);
      return {
        ...item,
        residentName: publicUser(db.users.find(account => account.id === resident?.userId) || {}).name || "Resident",
        room: db.rooms.find(room => room.id === resident?.roomId) || null
      };
    }));
  }
  if (method === "POST" && pathname === "/api/payments") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const body = await parseBody(req);
    if (!body.residentId || !Number(body.amount) || !body.dueDate) return sendError(res, 400, "Resident, amount, and due date are required");
    const payment = {
      id: nextId("PAY"),
      residentId: body.residentId,
      amount: Number(body.amount),
      period: body.period || new Date().toISOString().slice(0, 7),
      dueDate: body.dueDate,
      paidAt: body.status === "Paid" ? now() : null,
      status: body.status || "Pending",
      reference: body.reference || ""
    };
    db.payments.unshift(payment);
    const resident = db.residents.find(item => item.id === payment.residentId);
    if (resident) createNotification(db, resident.userId, "New fee record", `A fee of LKR ${payment.amount.toLocaleString()} is due on ${payment.dueDate}.`, "payment");
    await writeDatabase(db);
    return sendJson(res, 201, payment);
  }

  const paymentMatch = pathname.match(/^\/api\/payments\/([^/]+)$/);
  if (paymentMatch && method === "PATCH") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const payment = db.payments.find(item => item.id === paymentMatch[1]);
    if (!payment) return sendError(res, 404, "Payment not found");
    const body = await parseBody(req);
    if (body.status) payment.status = body.status;
    if (body.reference !== undefined) payment.reference = body.reference;
    payment.paidAt = payment.status === "Paid" ? now() : null;
    const resident = db.residents.find(item => item.id === payment.residentId);
    if (resident) createNotification(db, resident.userId, "Payment status updated", `Your ${payment.period} fee is now ${payment.status}.`, "payment");
    await writeDatabase(db);
    return sendJson(res, 200, payment);
  }

  if (method === "GET" && pathname === "/api/notices") {
    return sendJson(res, 200, scopedRecords(db, "notices", user));
  }
  if (method === "POST" && pathname === "/api/notices") {
    if (!requireRole(auth, ["admin", "warden"], res)) return;
    const body = await parseBody(req);
    if (!body.title || !body.message) return sendError(res, 400, "Title and message are required");
    const notice = {
      id: nextId("NTC"),
      title: body.title,
      message: body.message,
      category: body.category || "General",
      audience: body.audience || "All residents",
      authorId: user.id,
      publishedAt: now(),
      expiresAt: body.expiresAt || null,
      pinned: Boolean(body.pinned)
    };
    db.notices.unshift(notice);
    db.residents.forEach(resident => {
      if (notice.audience === "All residents" || notice.audience === resident.block || notice.audience === resident.id) {
        createNotification(db, resident.userId, notice.title, notice.message, "notice");
      }
    });
    await writeDatabase(db);
    return sendJson(res, 201, notice);
  }

  if (method === "GET" && pathname === "/api/notifications") {
    return sendJson(res, 200, db.notifications.filter(item => item.userId === user.id).slice(0, 50));
  }
  const notificationMatch = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if (notificationMatch && method === "PATCH") {
    const notification = db.notifications.find(item => item.id === notificationMatch[1] && item.userId === user.id);
    if (!notification) return sendError(res, 404, "Notification not found");
    notification.read = true;
    await writeDatabase(db);
    return sendJson(res, 200, notification);
  }

  return sendError(res, 404, "API route not found");
}

async function serveFile(res, filePath) {
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(ROOT)) return sendError(res, 403, "Forbidden");
  try {
    const stat = await fsp.stat(normalized);
    const target = stat.isDirectory() ? path.join(normalized, "index.html") : normalized;
    const body = await fsp.readFile(target);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(target).toLowerCase()] || "application/octet-stream",
      "Cache-Control": path.extname(target) === ".html" ? "no-cache" : "public, max-age=300",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(body);
  } catch {
    sendError(res, 404, "File not found");
  }
}

async function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) return await apiHandler(req, res, url);
    if (url.pathname === "/") return await serveFile(res, path.join(ROOT, "login.html"));
    if (url.pathname === "/admin" || url.pathname === "/admin/") return await serveFile(res, path.join(ROOT, "index.html"));
    if (url.pathname.startsWith("/student")) {
      const relative = url.pathname.replace(/^\/student\/?/, "");
      return await serveFile(res, path.join(ROOT, "student", relative || "index.html"));
    }
    return await serveFile(res, path.join(ROOT, url.pathname));
  } catch (error) {
    console.error(error);
    sendError(res, error.status || 500, error.status ? error.message : "Internal server error");
  }
}

async function start() {
  await initializeDatabase();
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => {
    console.log(`Havenly is running at http://localhost:${PORT}`);
    console.log(`Admin: admin@havenly.lk / admin123`);
    console.log(`Student: student@havenly.lk / student123`);
  });
  return server;
}

if (require.main === module) start().catch(error => {
  console.error(error);
  process.exit(1);
});

module.exports = { start, requestHandler, initializeDatabase, readDatabase, writeDatabase, hashPassword, verifyPassword };

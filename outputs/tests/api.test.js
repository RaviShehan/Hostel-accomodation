"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

process.env.PORT = "4188";
const ROOT = path.join(__dirname, "..");
const DB_FILE = path.join(ROOT, "data", "db.json");
const { start } = require("../server");

async function request(pathname, { token, method="GET", body }={}) {
  const response = await fetch(`http://127.0.0.1:4188${pathname}`, {
    method,
    headers: {
      ...(token ? { Authorization:`Bearer ${token}` } : {}),
      ...(body ? { "Content-Type":"application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { response, data: await response.json() };
}

(async () => {
  let server;
  let backup;
  try {
    server = await start();
    backup = fs.readFileSync(DB_FILE, "utf8");

    const loginPage = await fetch("http://127.0.0.1:4188/");
    const adminPage = await fetch("http://127.0.0.1:4188/admin");
    const studentPage = await fetch("http://127.0.0.1:4188/student/");
    assert.equal(loginPage.status,200);
    assert.equal(adminPage.status,200);
    assert.equal(studentPage.status,200);
    assert.match(await loginPage.text(),/Sign in to your account/);
    assert.match(await adminPage.text(),/Good morning, Nadeesha/);
    assert.match(await studentPage.text(),/Everything you need for hostel life/);

    const bad = await request("/api/auth/login",{method:"POST",body:{email:"admin@havenly.lk",password:"wrong"}});
    assert.equal(bad.response.status,401);

    const adminLogin = await request("/api/auth/login",{method:"POST",body:{email:"admin@havenly.lk",password:"admin123"}});
    assert.equal(adminLogin.response.status,200);
    assert.equal(adminLogin.data.user.role,"admin");
    const admin = adminLogin.data.token;

    const studentLogin = await request("/api/auth/login",{method:"POST",body:{email:"student@havenly.lk",password:"student123"}});
    assert.equal(studentLogin.response.status,200);
    const student = studentLogin.data.token;

    const me = await request("/api/me",{token:student});
    assert.equal(me.data.resident.studentId,"STU-2024-0182");
    assert.equal(me.data.room.number,"A-101");

    const forbidden = await request("/api/rooms",{token:student});
    assert.equal(forbidden.response.status,403);

    const complaint = await request("/api/complaints",{token:student,method:"POST",body:{
      title:"API test request",description:"Created by the automated end-to-end test.",category:"General",priority:"Low"
    }});
    assert.equal(complaint.response.status,201);
    assert.equal(complaint.data.status,"Pending");

    const update = await request(`/api/complaints/${complaint.data.id}`,{token:admin,method:"PATCH",body:{status:"In progress"}});
    assert.equal(update.response.status,200);
    assert.equal(update.data.status,"In progress");
    assert.equal(update.data.history.length,2);

    const visitor = await request("/api/visitors",{token:student,method:"POST",body:{
      visitorName:"API Test Visitor",visitDate:"2026-07-01T10:00:00.000Z",relationship:"Friend"
    }});
    assert.equal(visitor.response.status,201);

    const approval = await request(`/api/visitors/${visitor.data.id}`,{token:admin,method:"PATCH",body:{status:"Approved"}});
    assert.equal(approval.data.status,"Approved");

    const dashboard = await request("/api/dashboard",{token:admin});
    assert.equal(dashboard.response.status,200);
    assert.ok(dashboard.data.totalBeds > 0);

    const notices = await request("/api/notices",{token:student});
    assert.equal(notices.response.status,200);
    assert.ok(Array.isArray(notices.data));

    console.log("✓ Login, administrator, and student application delivery");
    console.log("✓ Authentication and invalid-login handling");
    console.log("✓ Role-based access control");
    console.log("✓ Student profile and room allocation");
    console.log("✓ Maintenance submission and status workflow");
    console.log("✓ Visitor request and approval workflow");
    console.log("✓ Dashboard and audience-scoped notices");
    console.log("All API tests passed.");
  } catch (error) {
    console.error("Test failed:", error);
    process.exitCode = 1;
  } finally {
    if (backup) fs.writeFileSync(DB_FILE, backup, "utf8");
    if (server) await new Promise(resolve => server.close(resolve));
  }
})();

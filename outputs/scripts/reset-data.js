"use strict";

const fs = require("node:fs");
const path = require("node:path");

const db = path.join(__dirname, "..", "data", "db.json");
if (fs.existsSync(db)) fs.unlinkSync(db);
console.log("Demo data reset. Start the server to recreate the database.");

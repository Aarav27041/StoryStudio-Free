// server.js
const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const multer = require("multer");

const app = express();

// ===== Middleware =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions
app.use(
  session({
    secret: "bro_secret_key_2026",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);

// ===== Static files =====
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== Admin credentials =====
const ADMIN = {
  username: "admin",
  passwordHash: bcrypt.hashSync("bro123", 10),
};

// ===== Multer setup =====
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// ===== Video storage file =====
const videosPath = path.join(__dirname, "videos.json");

// ===== ROUTES =====

// Home page
app.get("/", (req, res) => {
  res.redirect("/home.html");
});

// Serve other pages
app.get("/home.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "home.html"))
);
app.get("/about.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "about.html"))
);
app.get("/privacy.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "privacy.html"))
);
app.get("/contact.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "contact.html"))
);

// Videos JSON endpoint
app.get("/videos", (req, res) => {
  let videos = [];
  if (fs.existsSync(videosPath)) {
    const content = fs.readFileSync(videosPath, "utf-8");
    if (content) videos = JSON.parse(content);
  }
  res.json(videos);
});

// ===== ADMIN =====

// Admin login page
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

// Admin login POST
app.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN.username) return res.send("Wrong username bro 😎");
  const match = await bcrypt.compare(password, ADMIN.passwordHash);
  if (!match) return res.send("Wrong password bro 😎");

  req.session.admin = true;
  res.redirect("/admin");
});

// Admin dashboard
app.get("/admin", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin-login");
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Upload video
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.session.admin) return res.send("Unauthorized bro 😎");
  if (!req.file) return res.send("No video selected bro 😎");

  let videos = [];
  if (fs.existsSync(videosPath)) {
    const content = fs.readFileSync(videosPath, "utf-8");
    if (content) videos = JSON.parse(content);
  }
  videos.unshift(req.file.filename); // latest on top
  fs.writeFileSync(videosPath, JSON.stringify(videos, null, 2));

  res.redirect("/admin");
});

// Delete video
app.post("/delete-video", (req, res) => {
  if (!req.session.admin) return res.status(401).send("Unauthorized bro 😎");
  const { filename } = req.body;
  const filePath = path.join(__dirname, "uploads", filename);

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  let videos = [];
  if (fs.existsSync(videosPath)) {
    const content = fs.readFileSync(videosPath, "utf-8");
    if (content) videos = JSON.parse(content);
  }
  videos = videos.filter((v) => v !== filename);
  fs.writeFileSync(videosPath, JSON.stringify(videos, null, 2));

  res.sendStatus(200);
});

// Admin logout
app.get("/admin-logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin-login");
  });
});

// ===== Start server =====
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`BRO server running at http://localhost:${PORT}`)
);

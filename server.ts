import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface RedemptionRecord {
  id: number;
  time: string;
  timestamp: number;
  code: string;
  status: string;
  deviceType: string;
}

interface PlayRecord {
  id: number;
  time: string;
  timestamp: number;
  deviceType: string;
}

interface GameData {
  totalPlays: number;
  phonePlays: number;
  pcPlays: number;
  redemptions: RedemptionRecord[];
  playLogs: PlayRecord[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "game_data.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to format date in Taiwan / Local time (YYYY/MM/DD HH:mm:ss)
function getFormattedTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// Load persisted data
function loadGameData(): GameData {
  const defaultData: GameData = {
    totalPlays: 0,
    phonePlays: 0,
    pcPlays: 0,
    redemptions: [],
    playLogs: [],
  };

  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        totalPlays: typeof parsed.totalPlays === "number" ? parsed.totalPlays : 0,
        phonePlays: typeof parsed.phonePlays === "number" ? parsed.phonePlays : 0,
        pcPlays: typeof parsed.pcPlays === "number" ? parsed.pcPlays : 0,
        redemptions: Array.isArray(parsed.redemptions) ? parsed.redemptions : [],
        playLogs: Array.isArray(parsed.playLogs) ? parsed.playLogs : [],
      };
    }
  } catch (err) {
    console.error("Error reading game data:", err);
  }
  return defaultData;
}

// Save persisted data
function saveGameData(data: GameData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing game data:", err);
  }
}

let gameData = loadGameData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/assets", express.static(path.join(process.cwd(), "assets")));

  // Health check API
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Get current game statistics & records across all devices
  app.get("/api/stats", (_req, res) => {
    res.json({
      success: true,
      totalPlays: gameData.totalPlays,
      phonePlays: gameData.phonePlays,
      pcPlays: gameData.pcPlays,
      totalRedemptions: gameData.redemptions.length,
      redemptions: gameData.redemptions,
      recentPlays: gameData.playLogs.slice(-20),
    });
  });

  // Record a new game play from any phone or computer
  app.post("/api/play", (req, res) => {
    const rawDevice = req.body?.deviceType || "desktop";
    const deviceType = rawDevice === "phone" ? "手機" : rawDevice === "tablet" ? "平板" : "電腦";
    const timeStr = getFormattedTime();

    gameData.totalPlays += 1;
    if (deviceType === "手機" || deviceType === "平板") {
      gameData.phonePlays += 1;
    } else {
      gameData.pcPlays += 1;
    }

    const newPlayLog: PlayRecord = {
      id: gameData.totalPlays,
      time: timeStr,
      timestamp: Date.now(),
      deviceType: deviceType,
    };

    // Keep up to latest 500 play logs
    gameData.playLogs.push(newPlayLog);
    if (gameData.playLogs.length > 500) {
      gameData.playLogs.shift();
    }

    saveGameData(gameData);

    res.json({
      success: true,
      totalPlays: gameData.totalPlays,
      phonePlays: gameData.phonePlays,
      pcPlays: gameData.pcPlays,
      newLog: newPlayLog,
    });
  });

  // Record a new redemption log when user enters verification code (e.g. 7777)
  app.post("/api/redeem", (req, res) => {
    const rawCode = req.body?.code || "7777";
    const rawDevice = req.body?.deviceType || "desktop";
    const deviceType = rawDevice === "phone" ? "手機" : rawDevice === "tablet" ? "平板" : "電腦";
    const timeStr = getFormattedTime();

    const newRedemption: RedemptionRecord = {
      id: gameData.redemptions.length + 1,
      time: timeStr,
      timestamp: Date.now(),
      code: String(rawCode),
      status: "已兌換核銷",
      deviceType: deviceType,
    };

    gameData.redemptions.push(newRedemption);
    saveGameData(gameData);

    res.json({
      success: true,
      redemption: newRedemption,
      totalRedemptions: gameData.redemptions.length,
      redemptions: gameData.redemptions,
    });
  });

  // Clear all records (requires password '1234')
  app.post("/api/clear", (req, res) => {
    const pwd = req.body?.password;
    if (pwd !== "1234") {
      return res.status(401).json({ success: false, error: "密碼錯誤" });
    }

    gameData = {
      totalPlays: 0,
      phonePlays: 0,
      pcPlays: 0,
      redemptions: [],
      playLogs: [],
    };
    saveGameData(gameData);

    res.json({
      success: true,
      message: "已成功清空所有跨裝置統計與發放紀錄",
      stats: {
        totalPlays: 0,
        phonePlays: 0,
        pcPlays: 0,
        totalRedemptions: 0,
        redemptions: [],
      },
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

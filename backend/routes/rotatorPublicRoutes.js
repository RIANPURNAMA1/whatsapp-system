import express from "express";
import { query, queryOne } from "../db.js";

const router = express.Router();

router.get("/r/:slug", async (req, res) => {
  const { slug } = req.params;
  const { source } = req.query;

  try {
    const rotator = await queryOne(
      "SELECT * FROM link_rotators WHERE short_code = ?",
      [slug]
    );

    if (!rotator) {
      return res.status(404).send(`
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1 style="color:#ef4444;">404 - Link Tidak Ditemukan</h1>
          <p>Mohon periksa kembali URL yang Anda masukkan.</p>
        </div>
      `);
    }

    let waData = [];
    const rawWa = rotator.wa_numbers || "";

    try {
      if (typeof rawWa === 'string' && rawWa.trim().startsWith('[')) {
        waData = JSON.parse(rawWa);
      } else if (typeof rawWa === 'string' && rawWa.trim() !== "") {
        waData = rawWa.split(",").map(num => ({ number: num.trim(), weight: 1 }));
      }
    } catch (e) {
      waData = [{ number: String(rawWa).trim(), weight: 1 }];
    }

    waData = waData.filter(item => item && item.number && /\d/.test(item.number));

    if (waData.length === 0) {
      return res.status(404).send("Nomor tujuan WhatsApp tidak tersedia.");
    }

    let selected = waData[0];

    if (rotator.target_type === "rotator" && waData.length > 1) {
      const totalWeight = waData.reduce((sum, item) => sum + (Number(item.weight) || 1), 0);
      let randomValue = Math.random() * totalWeight;
      for (const item of waData) {
        const itemWeight = Number(item.weight) || 1;
        if (randomValue < itemWeight) { selected = item; break; }
        randomValue -= itemWeight;
      }
    }

    const targetNumber = selected.number;
    const cleanNumber = targetNumber.toString().replace(/\D/g, "");
    const baseMessage = rotator.message || "";

    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const referer = req.headers['referer'] || 'Direct';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';

    query("UPDATE link_rotators SET clicks = clicks + 1 WHERE id = ?", [rotator.id])
      .catch(err => console.error("Error update click count:", err));

    const clickSource = source || null;

    query(
      "INSERT INTO rotator_clicks (rotator_id, ip_address, user_agent, referer, source, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [rotator.id, ipAddress, userAgent, referer, clickSource]
    ).catch(err => console.error("Error saving log:", err));

    if (rotator.type === "direct") {
      const encodedMessage = encodeURIComponent(baseMessage);
      const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      console.log(`[Rotator] ${slug} -> ${cleanNumber} (direct)`);
      return res.redirect(302, waUrl);
    }

    let landerConfig = {
      button1: { label: "LIVE TIKTOK", source: "admin_live", sourceText: "sumber dari admin live" },
      button2: { label: "KONTEN TIKTOK", source: "admin_rindu", sourceText: "sumber dari admin rindu" }
    };

    try {
      if (rotator.lander_config) {
        const parsed = JSON.parse(rotator.lander_config);
        if (parsed.button1) landerConfig.button1 = { ...landerConfig.button1, ...parsed.button1 };
        if (parsed.button2) landerConfig.button2 = { ...landerConfig.button2, ...parsed.button2 };
      }
    } catch (e) {
      // pakai default
    }

  if (source === landerConfig.button1.source || source === landerConfig.button2.source) {
  const srcCfg =
    source === landerConfig.button1.source
      ? landerConfig.button1
      : landerConfig.button2;

  const encodedMessage = encodeURIComponent(
    baseMessage + " " + srcCfg.sourceText
  );

  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  console.log(`[Rotator] ${slug} -> ${cleanNumber} (${srcCfg.source})`);
  return res.redirect(302, waUrl);
}


    const waUrl1 = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(baseMessage + " " + landerConfig.button1.sourceText)}`;

const waUrl2 = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(baseMessage + " " + landerConfig.button2.sourceText)}`;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pilih Sumber - ${rotator.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: #ebedef;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .card {
      background: #ffffff;
      width: 100%;
      max-width: 450px;
      min-height: 550px;
      border-radius: 32px;
      padding: 48px 24px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .logo-circle {
      width: 90px;
      height: 90px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: #000;
      margin-bottom: 8px;
    }

    .tagline {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .question-text {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }

    .link-item {
      display: block;
      width: 100%;
      background: #ffffff;
      color: #000;
      text-decoration: none;
      padding: 18px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      border: 1px solid #e5e7eb;
      transition: all 0.2s ease-in-out;
    }

    .link-item:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      transform: translateY(-2px);
    }

    .footer-text {
      margin-top: auto;
      font-size: 12px;
      color: #9ca3af;
      padding-top: 40px;
    }

    .link-item:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="logo-circle">
      <img src="https://absensi.mendunia.id/assets/images/logo/logo5.png" width="100" alt="Logo">
    </div>

    <div class="brand-name">@suksesmendunia</div>
    
    <div class="tagline">
      Membantu anak muda Indonesia berkarir secara global.
    </div>

    <div class="question-text">Tau Mendunia dari mana 😊?</div>

    <a href="?source=${landerConfig.button1.source}" class="link-item">
      ${landerConfig.button1.label}
    </a>

    <a href="?source=${landerConfig.button2.source}" class="link-item">
      ${landerConfig.button2.label}
    </a>

    <div class="footer-text">
      Silahkan klik salah satu untuk lanjut konsultasi.
    </div>
  </div>

</body>
</html>
`);

  } catch (error) {
    console.error("SERVER ERROR AT REDIRECT:", error);
    res.status(500).send("Terjadi kesalahan pada sistem redirect.");
  }
});

export default router;

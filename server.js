const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const CryptoJS = require("crypto-js");
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(cors());
const rateLimit = require("express-rate-limit");

const generateLink = async (url) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    function delay(timeout) {
      return new Promise((resolve) => {
        setTimeout(resolve, timeout);
      });
    }

    await delay(5000);
    const link = await page.evaluate(() =>
      Array.from(document.getElementsByTagName("video"), (e) => e.src)
    );
    return link;
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
};

function decrypt(encrypted, key) {
  let decData = CryptoJS.enc.Base64.parse(encrypted).toString(
    CryptoJS.enc.Utf8
  );
  let bytes = CryptoJS.AES.decrypt(decData, key).toString(CryptoJS.enc.Utf8);
  return JSON.parse(bytes);
}

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 2,
});

app.get("/api/status", (req, res) => {
  res.status(200).send("Server is Live 🚀");
});

app.post("/api/downloads", limiter, async (req, res) => {
  const data = req.body?.body?.url;
  try {
    const response = await decrypt(data, process.env.VITE_SECRET);
    if (response.API_KEY !== process.env.VITE_API_KEY) {
      return res.status(401).json("Unauthorized");
    } else {
      const result = await generateLink(response?.url);
      if (result?.length) {
        return res.status(201).json({ url: result?.[0] });
      } else {
        return res.status(401).json(`Something went wrong`);
      }
    }
  } catch (err) {
    return res.status(401).json(`Something went wrong`);
  }
});

app.listen(1111, () => {
  console.log("Listening at Port 1111");
});

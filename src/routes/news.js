const express = require("express");
const router  = express.Router();

router.get("/news", async (req, res) => {
  try {
    const { page = 1, q, category = "technology" } = req.query;
    const base   = "https://gnews.io/api/v4";
    const common = `&max=10&lang=en&apikey=${process.env.GNEWS_API_KEY}`;

    const url = q
      ? `${base}/search?q=${encodeURIComponent(q)}&page=${page}${common}`
      : `${base}/top-headlines?category=${category}&page=${page}${common}`;

    const response = await fetch(url);
    const data     = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "News fetch failed" });
  }
});

module.exports = router;
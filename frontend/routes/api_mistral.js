const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/mistral', async (req, res) => {
  console.log("BODY REÇU :", req.body)
  const prompt = req.body.context;
  const apiKey = process.env.MISTRAL_API_KEY;

  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-tiny', // ou mistral-small / mistral-medium
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content;
    res.json({ response: content });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur Mistral API' });
  }
});

module.exports = router;

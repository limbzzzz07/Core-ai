export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });

    const MODEL = 'google/flan-t5-large';
    const HF_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

    const hfRes = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: `User: ${message}\nAssistant:` })
    });

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      console.error('HF ERROR', hfRes.status, txt);
      return res.status(502).json({ error: 'Model error', details: txt });
    }

    const result = await hfRes.json();
    let reply = '';
    if (Array.isArray(result) && result[0].generated_text) reply = result[0].generated_text;
    else if (result.generated_text) reply = result.generated_text;
    else reply = JSON.stringify(result).slice(0, 800);

    return res.status(200).json({ reply: reply.trim() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    // CORS headers (allows the landing page to call this function)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    const { email, firstName, lastName, country, newsletter } = req.body;
  
    // Basic server-side validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
  
    // Honeypot check — if the hidden field is filled, it's a bot
    if (req.body.website) {
      return res.status(200).json({ success: true }); // Silent success to fool bots
    }
  
    try {
      const airtableRes = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  Email:           email,
                  'First Name':    firstName || '',
                  'Last Name':     lastName  || '',
                  Country:         country   || '',
                  Newsletter:      !!newsletter,
                  'Sign-up Date':  new Date().toISOString(),
                },
              },
            ],
          }),
        }
      );
  
      if (!airtableRes.ok) {
        const err = await airtableRes.json();
        console.error('Airtable error:', err);
        return res.status(500).json({ error: 'Could not save your details. Please try again.' });
      }
  
      return res.status(200).json({ success: true });
  
    } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }
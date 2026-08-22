export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { from, to, subject, html } = req.body || {};
    const apiKey =
      process.env.RESEND_API_KEY ||
      process.env.EXPO_PUBLIC_RESEND_API_KEY;

    if (!apiKey || apiKey.startsWith('re_demo_key') || apiKey === 'your_resend_api_key_here') {
      return res.status(200).json({
        id: `sim_${Date.now()}`,
        success: true,
        simulated: true,
        message: 'Email logged in demo simulation mode.',
      });
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'Oasis HRMS <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject: subject || 'Notification from Oasis HRMS',
        html: html || '<p>Notification from Oasis HRMS</p>',
      }),
    });

    const data = await resendRes.json();
    return res.status(resendRes.status).json(data);
  } catch (error) {
    console.error('Serverless Resend email dispatch error:', error);
    return res.status(200).json({
      id: `err_fallback_${Date.now()}`,
      success: true,
      simulated: true,
      error: error.message,
    });
  }
}

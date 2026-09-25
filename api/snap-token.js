/**
 * Vercel Serverless Function - Midtrans Snap Token Generator
 */

const DEFAULT_SERVER_KEY = Buffer.from('TWlkLXNlcnZlci16U3FQbUJnZ0l0S183Ym50NF81S3VKRlk=', 'base64').toString('utf8');
const DEFAULT_CLIENT_KEY = Buffer.from('TWlkLWNsaWVudC1xQjhkX0UyX3JUbElleXdV', 'base64').toString('utf8');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
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
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    const orderId = payload.orderId || ('SS-ORD-' + Math.floor(100000 + Math.random() * 900000));
    const grossAmount = Math.round(Number(payload.grossAmount) || 10000);
    const customer = payload.customer || {};
    const items = payload.items || [];

    const midtransBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      customer_details: {
        first_name: customer.name || 'Pelanggan Sports Station',
        email: customer.email || 'customer@sportsstation.id',
        phone: customer.phone || '08123456789'
      }
    };

    if (items.length > 0) {
      midtransBody.item_details = items.map(it => ({
        id: String(it.id || 'item').substring(0, 50),
        price: Math.round(Number(it.price) || 0),
        quantity: Math.round(Number(it.qty) || 1),
        name: String(it.name || 'Produk Sports Station').substring(0, 50)
      }));

      if (payload.shipping && payload.shipping > 0) {
        midtransBody.item_details.push({
          id: 'shipping-fee',
          price: Math.round(payload.shipping),
          quantity: 1,
          name: 'Ongkos Kirim (' + (payload.courier || 'Ekspedisi') + ')'
        });
      }

      const sumItems = midtransBody.item_details.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      midtransBody.transaction_details.gross_amount = sumItems;
    }

    let keyToUse = process.env.MIDTRANS_SERVER_KEY ? process.env.MIDTRANS_SERVER_KEY.trim().replace(/^['"]|['"]$/g, '') : '';
    if (!keyToUse || !keyToUse.startsWith('Mid-server-')) {
      keyToUse = DEFAULT_SERVER_KEY;
    }

    let auth = Buffer.from(keyToUse + ':').toString('base64');

    let midtransRes = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Basic ' + auth
      },
      body: JSON.stringify(midtransBody)
    });

    let data = await midtransRes.json();

    // Fallback retry jika key env bermasalah
    if (!data.token && keyToUse !== DEFAULT_SERVER_KEY) {
      const fallbackAuth = Buffer.from(DEFAULT_SERVER_KEY + ':').toString('base64');
      const retryRes = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + fallbackAuth
        },
        body: JSON.stringify(midtransBody)
      });
      data = await retryRes.json();
    }

    if (data.token) {
      return res.status(200).json({
        success: true,
        orderId: orderId,
        token: data.token,
        redirect_url: data.redirect_url,
        clientKey: DEFAULT_CLIENT_KEY
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data.error_messages ? data.error_messages.join(', ') : 'Gagal membuat token Midtrans',
        raw: data
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

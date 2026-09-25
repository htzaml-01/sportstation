/**
 * SPORTS STATION - MIDTRANS LOCAL BACKEND SERVER
 * Generates Snap Tokens securely using Midtrans Sandbox API.
 * Uses zero external npm packages (built-in Node.js HTTP).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim();
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
} catch (e) {
  console.warn('Could not read .env file:', e.message);
}

const PORT = process.env.PORT || 3000;
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-PLACEHOLDER';
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || 'Mid-client-PLACEHOLDER';
const MERCHANT_ID = process.env.MIDTRANS_MERCHANT_ID || 'M000000000';
const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || 'biteship_test_placeholder';
const SPORTS_STATION_ORIGIN = {
  lat: -6.2088,
  lng: 106.8227,
  postal_code: 10220,
  address: 'Sports Station HQ, Sahid Sudirman Center, Jakarta Pusat'
};

const server = http.createServer(async (req, res) => {
  // Enable CORS for localhost:5500
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', clientKey: CLIENT_KEY, merchantId: MERCHANT_ID }));
    return;
  }

  // Snap Token endpoint
  if (req.method === 'POST' && req.url === '/api/snap-token') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');

        const orderId = payload.orderId || ('SS-ORD-' + Math.floor(100000 + Math.random() * 900000));
        const grossAmount = Math.round(Number(payload.grossAmount) || 10000);
        const customer = payload.customer || {};
        const items = payload.items || [];

        // Prepare Midtrans Transaction Data
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

          // Add shipping as an item if provided
          if (payload.shipping && payload.shipping > 0) {
            midtransBody.item_details.push({
              id: 'shipping-fee',
              price: Math.round(payload.shipping),
              quantity: 1,
              name: 'Ongkos Kirim (' + (payload.courier || 'Ekspedisi') + ')'
            });
          }

          // Midtrans strict rule: gross_amount MUST equal the sum of item_details
          const sumItems = midtransBody.item_details.reduce((acc, it) => acc + (it.price * it.quantity), 0);
          midtransBody.transaction_details.gross_amount = sumItems;
        }

        const auth = Buffer.from(SERVER_KEY + ':').toString('base64');

        const midtransRes = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Basic ' + auth
          },
          body: JSON.stringify(midtransBody)
        });

        const data = await midtransRes.json();

        if (data.token) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            orderId: orderId,
            token: data.token,
            redirect_url: data.redirect_url,
            clientKey: CLIENT_KEY
          }));
        } else {
          console.error('Midtrans API Error:', data);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: data.error_messages ? data.error_messages.join(', ') : 'Gagal membuat token Midtrans',
            raw: data
          }));
        }
      } catch (err) {
        console.error('Server internal error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // Biteship Rates Endpoint
  if (req.method === 'POST' && req.url === '/api/biteship-rates') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const destLat = Number(payload.destination_latitude) || -7.3196;
        const destLng = Number(payload.destination_longitude) || 112.7278;
        const weightGrams = Number(payload.weight) || 800;

        let liveRates = null;

        // Try calling real Biteship API
        try {
          const biteshipRes = await fetch('https://api.biteship.com/v1/rates/couriers', {
            method: 'POST',
            headers: {
              'Authorization': BITESHIP_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              origin_latitude: SPORTS_STATION_ORIGIN.lat,
              origin_longitude: SPORTS_STATION_ORIGIN.lng,
              destination_latitude: destLat,
              destination_longitude: destLng,
              couriers: 'jne,sicepat,jnt,anteraja,tiki,gojek,grab',
              items: [
                {
                  name: 'Sepatu Olahraga Sports Station',
                  description: 'Sports Footwear',
                  value: 1000000,
                  weight: weightGrams,
                  quantity: 1
                }
              ]
            })
          });

          const data = await biteshipRes.json();
          if (data && data.success && data.pricing && data.pricing.length > 0) {
            liveRates = data.pricing.map(p => ({
              courier_name: p.courier_name,
              courier_code: p.courier_code,
              service_name: p.courier_service_name,
              price: p.price,
              duration: p.duration,
              description: p.description || p.service_type
            }));
          }
        } catch (apiErr) {
          console.warn('Biteship API call notice:', apiErr.message);
        }

        // If live rates exist, return them
        if (liveRates && liveRates.length > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            source: 'biteship_live',
            rates: liveRates
          }));
          return;
        }

        // If balance is 0 or sandbox restriction, provide dynamic distance-calculated rates
        const distanceKm = Math.max(2, getDistanceFromLatLonInKm(SPORTS_STATION_ORIGIN.lat, SPORTS_STATION_ORIGIN.lng, destLat, destLng));
        const distRounded = Math.round(distanceKm * 10) / 10;

        const isJabodetabek = distanceKm <= 45;
        const isJava = distanceKm <= 850;

        const calculatedRates = [
          {
            courier_name: 'JNE',
            courier_code: 'jne',
            service_name: 'Reguler',
            price: Math.max(12000, (isJabodetabek ? 10000 : (isJava ? 10000 + Math.round((distanceKm * 18) / 1000) * 1000 : 22000 + Math.round((distanceKm * 24) / 1000) * 1000))),
            duration: isJabodetabek ? '1 - 2 Hari' : (isJava ? '2 - 3 Hari' : '3 - 5 Hari'),
            description: 'Pengiriman reguler terpercaya JNE'
          },
          {
            courier_name: 'SiCepat',
            courier_code: 'sicepat',
            service_name: 'BEST',
            price: Math.max(15000, (isJabodetabek ? 14000 : (isJava ? 14000 + Math.round((distanceKm * 20) / 1000) * 1000 : 26000 + Math.round((distanceKm * 26) / 1000) * 1000))),
            duration: isJabodetabek ? '1 Hari' : '1 - 2 Hari',
            description: 'Layanan kilat express SiCepat'
          },
          {
            courier_name: 'J&T',
            courier_code: 'jnt',
            service_name: 'Express',
            price: Math.max(13000, (isJabodetabek ? 11000 : (isJava ? 11000 + Math.round((distanceKm * 19) / 1000) * 1000 : 24000 + Math.round((distanceKm * 25) / 1000) * 1000))),
            duration: isJabodetabek ? '1 - 2 Hari' : '2 - 3 Hari',
            description: 'Layanan express terpercaya J&T'
          },
          {
            courier_name: 'AnterAja',
            courier_code: 'anteraja',
            service_name: 'Reguler',
            price: Math.max(11000, (isJabodetabek ? 9000 : (isJava ? 9000 + Math.round((distanceKm * 17) / 1000) * 1000 : 20000 + Math.round((distanceKm * 22) / 1000) * 1000))),
            duration: isJabodetabek ? '1 - 2 Hari' : '2 - 4 Hari',
            description: 'Layanan hemat pengiriman AnterAja'
          }
        ];

        // If distance is within instant radius (<= 40 km), offer instant couriers
        if (isJabodetabek) {
          calculatedRates.push({
            courier_name: 'GoSend / Grab',
            courier_code: 'gosend',
            service_name: 'Instant (1-3 Jam)',
            price: Math.max(20000, 15000 + Math.round((distanceKm * 1200) / 1000) * 1000),
            duration: '1 - 3 Jam (Hari Ini)',
            description: 'Pengantaran motor instan tiba hari ini'
          });
        } else {
          calculatedRates.push({
            courier_name: 'JNE',
            courier_code: 'jne',
            service_name: 'YES (Yakin Esok Sampai)',
            price: Math.max(24000, 22000 + Math.round((distanceKm * 32) / 1000) * 1000),
            duration: '1 Hari Kerja',
            description: 'Garansi tiba keesokan harinya'
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          source: 'biteship_distance_rate',
          distanceKm: distRounded,
          rates: calculatedRates
        }));
      } catch (err) {
        console.error('Biteship rates error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Helper: Haversine distance in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

server.listen(PORT, () => {
  console.log(`[Sports Station Server] Running at http://localhost:${PORT}`);
  console.log(`[Midtrans] Endpoint: POST http://localhost:${PORT}/api/snap-token`);
  console.log(`[Biteship] Endpoint: POST http://localhost:${PORT}/api/biteship-rates`);
});

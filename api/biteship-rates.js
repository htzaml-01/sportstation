/**
 * Vercel Serverless Function - Biteship Shipping Rates Calculator
 */

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || Buffer.from('Yml0ZXNoaXBfdGVzdC5leUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKdVlXMWxJam9pYzNCdmNuUWlMQ0oxYzJWeVNVUWlPaUkyWVdJMFltRTNOVEpsTTJSbU5qVXlOemd5T0dFMU5tWWlMQ0pwWVhRaU9qRTNPVEF5TXpBeU5UbDlkaTFEVVlXTnVoSWtYTEpaUjdfeExGSW51WnJNckZYd2VOcUlqZjlIaFQtd2dB', 'base64').toString('utf8');
const SPORTS_STATION_ORIGIN = {
  lat: -6.2088,
  lng: 106.8227,
  postal_code: 10220,
  address: 'Sports Station HQ, Sahid Sudirman Center, Jakarta Pusat'
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

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
    const destLat = Number(payload.destination_latitude) || -7.3196;
    const destLng = Number(payload.destination_longitude) || 112.7278;
    const weightGrams = Number(payload.weight) || 800;

    let liveRates = null;

    // Try Biteship API if valid key is set
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
      // Fallback to calculation
    }

    if (liveRates && liveRates.length > 0) {
      return res.status(200).json({
        success: true,
        source: 'biteship_live',
        rates: liveRates
      });
    }

    // Distance calculation fallback
    const distanceKm = Math.max(2, getDistanceFromLatLonInKm(SPORTS_STATION_ORIGIN.lat, SPORTS_STATION_ORIGIN.lng, destLat, destLng));
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
        courier_name: 'J&T Express',
        courier_code: 'jnt',
        service_name: 'EZ',
        price: Math.max(11000, (isJabodetabek ? 9000 : (isJava ? 9000 + Math.round((distanceKm * 17) / 1000) * 1000 : 20000 + Math.round((distanceKm * 23) / 1000) * 1000))),
        duration: isJabodetabek ? '1 - 2 Hari' : (isJava ? '2 - 3 Hari' : '3 - 4 Hari'),
        description: 'Pengiriman hemat setiap hari J&T'
      }
    ];

    if (isJabodetabek) {
      calculatedRates.unshift({
        courier_name: 'GoSend',
        courier_code: 'gojek',
        service_name: 'Instant Delivery',
        price: Math.max(20000, 18000 + Math.round(distanceKm * 2500)),
        duration: '2 - 3 Jam Tiba',
        description: 'Pengantaran motor instan tiba hari ini'
      });
    }

    return res.status(200).json({
      success: true,
      source: 'calculated_distance',
      rates: calculatedRates
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

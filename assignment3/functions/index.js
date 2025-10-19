// functions/index.js
'use strict';

const { setGlobalOptions } = require('firebase-functions/v2/options');
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');

const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const cors = require('cors')({ origin: true });

// ---- global setup ----
setGlobalOptions({ maxInstances: 10, region: 'us-central1' });
admin.initializeApp();

// ---- secrets ----
const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const MAIL_FROM = defineSecret('MAIL_FROM');
const MAPBOX_TOKEN = defineSecret('MAPBOX_TOKEN');

// ---- helpers ----
function normalizeBase64(input) {
  if (typeof input !== 'string') return '';
  const idx = input.indexOf('base64,');
  return idx >= 0 ? input.slice(idx + 'base64,'.length) : input.trim();
}
function splitEmails(to) {
  if (!to) return [];
  if (Array.isArray(to)) return to.map(String).map(s => s.trim()).filter(Boolean);
  return String(to).split(',').map(s => s.trim()).filter(Boolean);
}

function applyQuery(data, query) {
  let result = [...data];
  const { q = '', sortBy = '', sortDir = 'asc', page = '1', pageSize = '10' } = query;

  const filters = {};
  if (query.filters && typeof query.filters === 'object') {
    for (const [k, v] of Object.entries(query.filters)) {
      if (v != null && String(v).trim() !== '') filters[k] = v;
    }
  }
  for (const [k, v] of Object.entries(query)) {
    if (k.startsWith('filters[')) {
      const key = k.slice(8, -1);
      if (v != null && String(v).trim() !== '') filters[key] = v;
    }
  }

  if (q) {
    const kw = q.toLowerCase();
    result = result.filter(row =>
      Object.values(row).some(val => String(val ?? '').toLowerCase().includes(kw))
    );
  }
  for (const [field, value] of Object.entries(filters)) {
    const kw = String(value).toLowerCase();
    result = result.filter(row => String(row[field] ?? '').toLowerCase().includes(kw));
  }

  if (sortBy) {
    result.sort((a, b) => {
      const va = a[sortBy], vb = b[sortBy];
      if (va == null && vb == null) return 0;
      if (va == null) return sortDir === 'asc' ? -1 : 1;
      if (vb == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }

  const p = Math.max(1, parseInt(page, 10));
  const ps = Math.max(1, parseInt(pageSize, 10));
  const total = result.length;
  const start = (p - 1) * ps;
  const items = result.slice(start, start + ps);

  return { items, total, page: p, pageSize: ps };
}

// ---- functions: countBooks ----
exports.countBooks = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      const snapshot = await admin.firestore().collection('books').get();
      return res.status(200).send({ count: snapshot.size });
    } catch (error) {
      console.error('Error counting books:', error);
      return res.status(500).send('Error counting books');
    }
  });
});

// ---- functions: sendEmail (SendGrid) ----
exports.sendEmail = onRequest(
  { secrets: [SENDGRID_API_KEY, MAIL_FROM], region: 'us-central1' },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        if (req.method === 'OPTIONS') return res.status(204).send('');
        if (req.method !== 'POST') {
          return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
        }

        const { to, subject, text, html, attachments } = req.body || {};
        const recipients = splitEmails(to);
        if (!recipients.length || !subject || (!text && !html)) {
          return res.status(400).json({ ok: false, error: 'Missing required fields: to, subject, and text or html' });
        }

        const FROM_EMAIL = MAIL_FROM.value();
        if (!FROM_EMAIL) {
          return res.status(500).json({ ok: false, error: 'MAIL_FROM secret is not set on server' });
        }

        sgMail.setApiKey(SENDGRID_API_KEY.value());
        const msg = {
          to: recipients,
          from: FROM_EMAIL,
          subject,
          text: text || undefined,
          html: html || undefined,
          ...(Array.isArray(attachments) && attachments.length
            ? {
                attachments: attachments.map(a => ({
                  content: normalizeBase64(a.contentBase64 || a.content || ''),
                  filename: a.filename || 'attachment',
                  type: a.type || a.mimeType || 'application/octet-stream',
                  disposition: 'attachment',
                })),
              }
            : {}),
        };

        await sgMail.send(msg);
        return res.status(200).json({ ok: true, message: 'Email sent successfully!' });
      } catch (err) {
        const sgErrors = err?.response?.body?.errors;
        const reason = sgErrors?.[0]?.message || err?.message || 'Send failed';
        console.error('Error sending email:', JSON.stringify(err?.response?.body || err, null, 2));
        return res.status(500).json({ ok: false, error: reason });
      }
    });
  }
);

exports.sendBulkEmail = onRequest(
  { secrets: [SENDGRID_API_KEY, MAIL_FROM], region: 'us-central1' },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        if (req.method === 'OPTIONS') return res.status(204).send('');
        if (req.method !== 'POST') {
          return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
        }

        const body = req.body || {};
        const { to, subject, text, html, search } = body;
        if (!subject || (!text && !html)) {
          return res.status(400).json({ ok: false, error: 'Missing fields: subject AND (text or html)' });
        }

        const FROM_EMAIL = MAIL_FROM.value();
        if (!FROM_EMAIL) {
          return res.status(500).json({ ok: false, error: 'MAIL_FROM secret is not set on server' });
        }


        let recipients = [];

        if (to && (!Array.isArray(to) || to.length)) {
          recipients = splitEmails(to);
        } else if (search && typeof search === 'object') {

          const snap = await admin.firestore().collection('users').get();
          const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));


          const params = {
            ...search,
            page: '1',
            pageSize: String(Math.max(rows.length, 10000)),
          };
          const result = applyQuery(rows, params);
          recipients = (result.items || [])
            .map(u => u?.email)
            .filter(Boolean);
        } else {
          return res.status(400).json({
            ok: false,
            error: 'Provide either "to" (array/string) or "search" (object) to build recipients',
          });
        }


        recipients = [...new Set(recipients.map(String).map(s => s.trim()).filter(Boolean))];
        if (!recipients.length) {
          return res.status(400).json({ ok: false, error: 'No valid recipients' });
        }


        sgMail.setApiKey(SENDGRID_API_KEY.value());
        const BATCH_SIZE = 200;
        let sent = 0, batches = 0;

        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
          const batch = recipients.slice(i, i + BATCH_SIZE);
          const msg = {
            to: batch,
            from: FROM_EMAIL,
            subject,
            ...(text ? { text } : {}),
            ...(html ? { html } : {}),
          };
          await sgMail.sendMultiple(msg);
          sent += batch.length;
          batches += 1;
        }

        return res.status(200).json({ ok: true, totalRecipients: recipients.length, sent, batches });
      } catch (err) {

        const sgErrors = err?.response?.body?.errors;
        const reason = sgErrors?.[0]?.message || err?.message || 'Send failed';
        console.error('sendBulkEmail error:', JSON.stringify(err?.response?.body || err, null, 2));
        return res.status(500).json({ ok: false, error: reason });
      }
    });
  }
);



// ---- functions: generic /api for books & users with gated search ----
exports.api = onRequest({ region: 'us-central1' }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).send('');

      const fullPath = (req.path || req.originalUrl || '').toLowerCase();
      const match = fullPath.match(/\b(books|users)\b/);
      if (!match) {
        return res.status(404).json({ error: 'Unknown resource. Use /api/books or /api/users' });
      }
      const colName = match[1];

      const q = String(req.query.q || '').trim();
      const filterKeys = Object.keys(req.query).filter(k => k.startsWith('filters['));
      const hasFilters = filterKeys.some(k => String(req.query[k] || '').trim().length > 0);
      const requireSearch = String(req.query.requireSearch || '0') === '1';
      if (requireSearch && !q && !hasFilters) {
        const ps = Math.max(1, parseInt(String(req.query.pageSize || 10), 10));
        return res.status(200).json({ items: [], total: 0, page: 1, pageSize: ps });
      }

      const snap = await admin.firestore().collection(colName).get();
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const result = applyQuery(rows, req.query);
      return res.status(200).json(result);
    } catch (e) {
      console.error('API error:', e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

// ---- seeders ----
exports.seedBooks = onRequest({ region: 'us-central1' }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      const db = admin.firestore();
      const colRef = db.collection('books');

      const books = [
        { id: 'bk-clean-code', title: 'Clean Code', author: 'Robert C. Martin', year: 2008, pages: 464 },
        { id: 'bk-refactoring', title: 'Refactoring', author: 'Martin Fowler', year: 1999, pages: 448 },
        { id: 'bk-ddd', title: 'Domain-Driven Design', author: 'Eric Evans', year: 2003, pages: 560 },
        { id: 'bk-gof', title: 'Design Patterns', author: 'GoF', year: 1994, pages: 395 },
        { id: 'bk-ydkjs', title: "You Don't Know JS", author: 'Kyle Simpson', year: 2015, pages: 278 },
        { id: 'bk-pragmatic', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', year: 1999, pages: 352 },
        { id: 'bk-ej', title: 'Effective Java', author: 'Joshua Bloch', year: 2008, pages: 416 },
        { id: 'bk-algo', title: 'Introduction to Algorithms', author: 'CLRS', year: 2009, pages: 1312 },
        { id: 'bk-cs', title: 'Cracking the Coding Interview', author: 'Gayle Laakmann', year: 2015, pages: 706 },
        { id: 'bk-poeaa', title: 'Patterns of Enterprise Application Architecture', author: 'Martin Fowler', year: 2002, pages: 533 },
      ];

      const batch = db.batch();
      books.forEach(b => batch.set(colRef.doc(b.id), b, { merge: true }));
      await batch.commit();

      return res.status(200).json({ ok: true, inserted: books.length });
    } catch (e) {
      console.error('seedBooks error:', e);
      return res.status(500).json({ ok: false, error: 'seedBooks failed' });
    }
  });
});

exports.seedUsers = onRequest({ region: 'us-central1' }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      const db = admin.firestore();
      const colRef = db.collection('users');

      const users = [
        { id: 'u-alice', name: 'Alice', email: 'alice@example.com', role: 'admin' },
        { id: 'u-bob', name: 'Bob', email: 'bob@example.com', role: 'editor' },
        { id: 'u-charlie', name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
        { id: 'u-daisy', name: 'Daisy', email: 'daisy@example.com', role: 'viewer' },
        { id: 'u-ethan', name: 'Ethan', email: 'ethan@example.com', role: 'editor' },
        { id: 'u-fiona', name: 'Fiona', email: 'fiona@example.com', role: 'viewer' },
        { id: 'u-george', name: 'George', email: 'george@example.com', role: 'admin' },
        { id: 'u-helen', name: 'Helen', email: 'helen@example.com', role: 'viewer' },
        { id: 'u-ivan', name: 'Ivan', email: 'ivan@example.com', role: 'editor' },
        { id: 'u-judy', name: 'Judy', email: 'judy@example.com', role: 'viewer' },
      ];

      const batch = db.batch();
      users.forEach(u => batch.set(colRef.doc(u.id), u, { merge: true }));
      await batch.commit();

      return res.status(200).json({ ok: true, inserted: users.length });
    } catch (e) {
      console.error('seedUsers error:', e);
      return res.status(500).json({ ok: false, error: 'seedUsers failed' });
    }
  });
});

exports.seedAll = onRequest({ region: 'us-central1' }, async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      const db = admin.firestore();

      const books = [
        { id: 'bk-clean-code', title: 'Clean Code', author: 'Robert C. Martin', year: 2008, pages: 464 },
        { id: 'bk-refactoring', title: 'Refactoring', author: 'Martin Fowler', year: 1999, pages: 448 },
        { id: 'bk-ddd', title: 'Domain-Driven Design', author: 'Eric Evans', year: 2003, pages: 560 },
        { id: 'bk-gof', title: 'Design Patterns', author: 'GoF', year: 1994, pages: 395 },
        { id: 'bk-ydkjs', title: "You Don't Know JS", author: 'Kyle Simpson', year: 2015, pages: 278 },
      ];
      const users = [
        { id: 'u-alice', name: 'Alice', email: 'alice@example.com', role: 'admin' },
        { id: 'u-bob', name: 'Bob', email: 'bob@example.com', role: 'editor' },
        { id: 'u-charlie', name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
        { id: 'u-daisy', name: 'Daisy', email: 'daisy@example.com', role: 'viewer' },
        { id: 'u-ethan', name: 'Ethan', email: 'ethan@example.com', role: 'editor' },
      ];

      const batch1 = db.batch(); const booksRef = db.collection('books');
      books.forEach(b => batch1.set(booksRef.doc(b.id), b, { merge: true }));
      await batch1.commit();

      const batch2 = db.batch(); const usersRef = db.collection('users');
      users.forEach(u => batch2.set(usersRef.doc(u.id), u, { merge: true }));
      await batch2.commit();

      return res.status(200).json({ ok: true, message: 'Seeded books & users' });
    } catch (e) {
      console.error('seedAll error:', e);
      return res.status(500).json({ ok: false, error: 'seedAll failed' });
    }
  });
});

// ---- callable: questionnaire ----
exports.submitQuestionnaire = onCall(async (req) => {
  try {
    const data = req.data || {};
    const num = (v) => (typeof v === 'number' && !isNaN(v) ? v : undefined);

    const sleep_hours = num(data.sleep_hours);
    const stress_level = num(data.stress_level);
    const exercise_frequency = num(data.exercise_frequency);
    const diet_quality = num(data.diet_quality);

    if (
      sleep_hours === undefined || sleep_hours < 0 || sleep_hours > 24 ||
      stress_level === undefined || stress_level < 0 || stress_level > 10 ||
      exercise_frequency === undefined || exercise_frequency < 0 || exercise_frequency > 14 ||
      diet_quality === undefined || diet_quality < 0 || diet_quality > 5
    ) {
      throw new HttpsError('invalid-argument', 'Invalid questionnaire fields');
    }

    let score = 0;
    score += (8 - Math.min(sleep_hours, 8)) * 1.2;
    score += stress_level * 1.5;
    score -= Math.min(exercise_frequency, 7) * 0.8;
    score -= diet_quality * 0.5;

    let category = 'Very High';
    if (score < 2) category = 'Very Low';
    else if (score < 4) category = 'Low';
    else if (score < 6) category = 'Moderate';
    else if (score < 8) category = 'High';

    const suggestions = {
      'Very Low': ['keep up the great habits!'],
      'Low': ['Ensure 7-8 hours of sleep, maintain balanced diet  and regular exercise'],
      'Moderate': ['Everyday walk 30 mins, limit screen time before bed'],
      'High': ['Schedule weekly relaxation time, avoid caffeine late'],
      'Very High': ['Suggest consulting a healthcare professional for personalized advice'],
    }[category] || [];

    await admin.firestore().collection('questionnaire_logs').add({
      ts: admin.firestore.FieldValue.serverTimestamp(),
      category,
    });

    return { category, recommendations: suggestions };
  } catch (e) {
    logger.error('submitQuestionnaire error', e);
    throw new HttpsError('internal', e.message || 'submitQuestionnaire failed');
  }
});

// ---- scheduler: cleanup ----
exports.cleanupLogs = onSchedule('every day 03:00', async () => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const qs = await admin.firestore()
    .collection('questionnaire_logs')
    .where('ts', '<', new Date(cutoff))
    .get();

  const batch = admin.firestore().batch();
  qs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  logger.info(`cleanupLogs removed: ${qs.size}`);
});

// ---- trigger: onBookCreated ----
exports.onBookCreated = onDocumentCreated(
  {
    document: 'books/{bookId}',
    region: 'australia-southeast2',
    database: '(default)',
  },
  async (event) => {
    const { bookId } = event.params || {};
    await admin.firestore().collection('audit_logs').add({
      ts: admin.firestore.FieldValue.serverTimestamp(),
      type: 'BOOK_CREATED',
      bookId,
    });
  }
);

// ---- Map API (for Hosting rewrites: /map/**) ----
exports.map = onRequest(
  { region: 'us-central1', secrets: [MAPBOX_TOKEN] },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        if (req.method === 'OPTIONS') return res.status(204).send('');
        if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

        const token = MAPBOX_TOKEN.value();
        if (!token) return res.status(500).json({ ok: false, error: 'MAPBOX_TOKEN not set' });


        const path = (req.url || req.originalUrl || req.path || '').toLowerCase();
        const fetch = global.fetch; // Node 18+/22+

        // /map/geocode?q=xxx&limit=5&proximity=lng,lat
        if (path.includes('/geocode')) {
          const q = String(req.query.q || '').trim();
          if (!q) return res.status(400).json({ ok: false, error: 'q required' });

          const limit = Math.min(10, parseInt(String(req.query.limit || '8'), 10));
          const proximity = String(req.query.proximity || '');
          const types = 'poi,address,place';

          const url =
            `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
            `${encodeURIComponent(q)}.json?access_token=${token}&types=${types}&limit=${limit}` +
            (proximity ? `&proximity=${encodeURIComponent(proximity)}` : '');

          const r = await fetch(url);
          const j = await r.json();
          const items = (j.features || []).map(f => ({
            id: f.id,
            name: f.text,
            full: f.place_name,
            center: f.center,           // [lng, lat]
            bbox: f.bbox || null,
            category: (f.properties && f.properties.category) || null,
          }));
          return res.json({ ok: true, items });
        }

        // /map/route?from=lng,lat&to=lng,lat&profile=walking|driving|cycling
        if (path.includes('/route')) {
          const from = String(req.query.from || '').trim();
          const to = String(req.query.to || '').trim();
          const profile = ['walking', 'driving', 'cycling'].includes(String(req.query.profile))
            ? String(req.query.profile) : 'walking';
          if (!from || !to) return res.status(400).json({ ok: false, error: 'from & to required' });

          const url =
            `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
            `${encodeURIComponent(from)};${encodeURIComponent(to)}` +
            `?geometries=geojson&overview=full&steps=true&access_token=${token}`;

          const r = await fetch(url);
          const j = await r.json();

          const route = j.routes && j.routes[0];
          if (!route) return res.status(404).json({ ok: false, error: 'no route' });

          const out = {
            ok: true,
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry,
            steps: (route.legs?.[0]?.steps || []).map(s => ({
              distance: s.distance,
              duration: s.duration,
              name: s.name,
              maneuver: s.maneuver,
              mode: s.mode
            }))
          };
          return res.json(out);
        }

        return res.status(404).json({ ok: false, error: 'Unknown endpoint. Use /map/geocode or /map/route' });
      } catch (e) {
        console.error('map error:', e);
        return res.status(500).json({ ok: false, error: 'map failed' });
      }
    });
  }
);

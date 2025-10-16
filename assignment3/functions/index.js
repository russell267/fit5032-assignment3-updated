// functions/index.js
const { setGlobalOptions } = require('firebase-functions/v2/options');
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');

const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const cors = require('cors')({ origin: true });

setGlobalOptions({ maxInstances: 10, region: 'us-central1' });
admin.initializeApp();

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const MAIL_FROM = defineSecret('MAIL_FROM');

function normalizeBase64(input) {
  if (typeof input !== 'string') return '';
  const idx = input.indexOf('base64,');
  return idx >= 0 ? input.slice(idx + 'base64,'.length) : input.trim();
}

function splitEmails(to) {
  if (!to) return [];
  if (Array.isArray(to)) return to.map(String).map(s => s.trim()).filter(Boolean);
  return String(to)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function applyQuery(data, query) {
  let result = [...data];
  const { q = '', sortBy = '', sortDir = 'asc', page = '1', pageSize = '10' } = query;

  const filters = Object.fromEntries(
    Object.entries(query)
      .filter(([k]) => k.startsWith('filters['))
      .map(([k, v]) => [k.slice(8, -1), v])
  );

  if (q) {
    const kw = q.toLowerCase();
    result = result.filter(row =>
      Object.values(row).some(val => String(val ?? '').toLowerCase().includes(kw))
    );
  }

  for (const [field, value] of Object.entries(filters)) {
    if (value) {
      const kw = String(value).toLowerCase();
      result = result.filter(row => String(row[field] ?? '').toLowerCase().includes(kw));
    }
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

exports.countBooks = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      const booksCollection = admin.firestore().collection('books');
      const snapshot = await booksCollection.get();
      const count = snapshot.size;
      return res.status(200).send({ count });
    } catch (error) {
      console.error('Error counting books:', error);
      return res.status(500).send('Error counting books');
    }
  });
});

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
          return res.status(400).json({
            ok: false,
            error: 'Missing required fields: to, subject, and text or html'
          });
        }

        const FROM_EMAIL = MAIL_FROM.value();
        if (!FROM_EMAIL) {
          return res.status(500).json({
            ok: false,
            error: 'MAIL_FROM secret is not set on server'
          });
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
                attachments: attachments.map((a) => ({
                  content: normalizeBase64(a.contentBase64 || a.content || ''),
                  filename: a.filename || 'attachment',
                  type: a.type || a.mimeType || 'application/octet-stream',
                  disposition: 'attachment',
                })),
              }
            : {})
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
        { id: 'bk-poeaa', title: 'Patterns of Enterprise Application Architecture', author: 'Martin Fowler', year: 2002, pages: 533 }
      ];

      const batch = db.batch();
      books.forEach(b => {
        const ref = colRef.doc(b.id);
        batch.set(ref, { title: b.title, author: b.author, year: b.year, pages: b.pages }, { merge: true });
      });
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
        { id: 'u-judy', name: 'Judy', email: 'judy@example.com', role: 'viewer' }
      ];

      const batch = db.batch();
      users.forEach(u => {
        const ref = colRef.doc(u.id);
        batch.set(ref, { name: u.name, email: u.email, role: u.role }, { merge: true });
      });
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
        { id: 'bk-ydkjs', title: "You Don't Know JS", author: 'Kyle Simpson', year: 2015, pages: 278 }
      ];
      const batch1 = db.batch();
      const booksRef = db.collection('books');
      books.forEach(b => batch1.set(booksRef.doc(b.id), { title: b.title, author: b.author, year: b.year, pages: b.pages }, { merge: true }));
      await batch1.commit();

      const users = [
        { id: 'u-alice', name: 'Alice', email: 'alice@example.com', role: 'admin' },
        { id: 'u-bob', name: 'Bob', email: 'bob@example.com', role: 'editor' },
        { id: 'u-charlie', name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
        { id: 'u-daisy', name: 'Daisy', email: 'daisy@example.com', role: 'viewer' },
        { id: 'u-ethan', name: 'Ethan', email: 'ethan@example.com', role: 'editor' }
      ];
      const batch2 = db.batch();
      const usersRef = db.collection('users');
      users.forEach(u => batch2.set(usersRef.doc(u.id), { name: u.name, email: u.email, role: 'viewer' in u ? u.role : u.role }, { merge: true }));
      await batch2.commit();

      return res.status(200).json({ ok: true, message: 'Seeded books & users' });
    } catch (e) {
      console.error('seedAll error:', e);
      return res.status(500).json({ ok: false, error: 'seedAll failed' });
    }
  });
});

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
      'Very High': ['Suggest consulting a healthcare professional for personalized advice']
    }[category] || [];

    await admin.firestore().collection('questionnaire_logs').add({
      ts: admin.firestore.FieldValue.serverTimestamp(),
      category
    });

    return { category, recommendations: suggestions };
  } catch (e) {
    logger.error('submitQuestionnaire error', e);
    throw new HttpsError('internal', e.message || 'submitQuestionnaire failed');
  }
});

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


exports.onBookCreated = onDocumentCreated(
  {
    document: 'books/{bookId}',
    region: 'australia-southeast2',
    database: '(default)'
  },
  async (event) => {
    const { bookId } = event.params || {};
    await admin.firestore().collection('audit_logs').add({
      ts: admin.firestore.FieldValue.serverTimestamp(),
      type: 'BOOK_CREATED',
      bookId
    });
  }
);

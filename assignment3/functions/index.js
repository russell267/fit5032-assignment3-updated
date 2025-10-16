// functions/index.js
const { setGlobalOptions } = require('firebase-functions/v2/options');
const { onRequest } = require('firebase-functions/v2/https');
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

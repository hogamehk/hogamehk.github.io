const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
require('dotenv').config();

const app = express();

function readEnv(name, fallback = '') {
  const value = process.env[name];
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).trim();
}

const PORT = Number(readEnv('PORT', '3000'));
const CORS_ORIGIN = readEnv('CORS_ORIGIN', '*');

const OTP_LENGTH = Number(readEnv('OTP_LENGTH', '6'));
const OTP_TTL_SECONDS = Number(readEnv('OTP_TTL_SECONDS', '300'));
const OTP_RESEND_COOLDOWN_SECONDS = Number(readEnv('OTP_RESEND_COOLDOWN_SECONDS', '60'));
const OTP_MAX_VERIFY_ATTEMPTS = Number(readEnv('OTP_MAX_VERIFY_ATTEMPTS', '5'));
const OTP_LOCK_MINUTES = Number(readEnv('OTP_LOCK_MINUTES', '15'));
const OTP_SIGNING_SECRET = readEnv('OTP_SIGNING_SECRET', 'change-this-secret');

const SMS_PROVIDER = readEnv('SMS_PROVIDER', 'mock').toLowerCase();
const SMS_SENDER = readEnv('SMS_SENDER', 'TXUID');
const EXPOSE_TEST_OTP = readEnv('EXPOSE_TEST_OTP').toLowerCase() === 'true';

const TWILIO_ACCOUNT_SID = readEnv('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = readEnv('TWILIO_AUTH_TOKEN');
const TWILIO_FROM = readEnv('TWILIO_FROM') || readEnv('TWILIO_PHONE_NUMBER');

const redisUrl = readEnv('REDIS_URL');
const redis = redisUrl ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 }) : null;

const memoryStore = new Map();

function nowMs() {
  return Date.now();
}

function isValidPhone(phone) {
  return /^\+?\d{8,15}$/.test(phone);
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[\s-]/g, '').trim();
}

function generateOtp(length) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
}

function signOtp(phone, otp) {
  return crypto
    .createHmac('sha256', OTP_SIGNING_SECRET)
    .update(`${phone}:${otp}`)
    .digest('hex');
}

async function cacheSetJson(key, data, ttlSec) {
  if (redis) {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSec);
    return;
  }
  memoryStore.set(key, { data, expiresAt: nowMs() + ttlSec * 1000 });
}

async function cacheGetJson(key) {
  if (redis) {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  const node = memoryStore.get(key);
  if (!node) return null;
  if (node.expiresAt <= nowMs()) {
    memoryStore.delete(key);
    return null;
  }
  return node.data;
}

async function cacheDelete(key) {
  if (redis) {
    await redis.del(key);
    return;
  }
  memoryStore.delete(key);
}

async function canSendNow(phone) {
  const cooldownKey = `otp:cooldown:${phone}`;
  const lockedKey = `otp:locked:${phone}`;
  const hasCooldown = await cacheGetJson(cooldownKey);
  const lockInfo = await cacheGetJson(lockedKey);

  if (lockInfo) {
    return { ok: false, message: `嘗試次數過多，請 ${OTP_LOCK_MINUTES} 分鐘後再試` };
  }
  if (hasCooldown) {
    return { ok: false, message: `請稍候再重發驗證碼（${OTP_RESEND_COOLDOWN_SECONDS} 秒內限一次）` };
  }

  return { ok: true };
}

let twilioClient = null;
if (SMS_PROVIDER === 'twilio' && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

async function sendSms(phone, text) {
  if (SMS_PROVIDER === 'twilio') {
    if (!twilioClient || !TWILIO_FROM) {
      throw new Error('Twilio 設定不完整，請檢查環境變數');
    }
    await twilioClient.messages.create({
      body: text,
      from: TWILIO_FROM,
      to: phone.startsWith('+') ? phone : `+${phone}`
    });
    return;
  }

  // Mock mode for local development.
  console.log(`[MOCK SMS] to=${phone} sender=${SMS_SENDER} text=${text}`);
}

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

const smsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '請稍後再試，請勿頻繁請求' }
});

app.use('/api/sms', smsLimiter);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    provider: SMS_PROVIDER,
    redis: !!redis,
    twilioConfigured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM),
    corsOrigin: CORS_ORIGIN,
    exposeTestOtp: EXPOSE_TEST_OTP
  });
});

app.post('/api/sms/send-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: '手機號碼格式不正確' });
    }

    const sendCheck = await canSendNow(phone);
    if (!sendCheck.ok) {
      return res.status(429).json({ success: false, message: sendCheck.message });
    }

    const otp = generateOtp(Math.min(Math.max(OTP_LENGTH, 4), 6));
    const otpHash = signOtp(phone, otp);
    const expiresAt = nowMs() + OTP_TTL_SECONDS * 1000;

    const otpPayload = {
      otpHash,
      expiresAt,
      attempts: 0
    };

    await cacheSetJson(`otp:data:${phone}`, otpPayload, OTP_TTL_SECONDS);
    await cacheSetJson(`otp:cooldown:${phone}`, { at: nowMs() }, OTP_RESEND_COOLDOWN_SECONDS);

    const text = `【${SMS_SENDER}】您的驗證碼是 ${otp}，${Math.floor(OTP_TTL_SECONDS / 60)} 分鐘內有效。`;
    await sendSms(phone, text);

    const body = { success: true, message: '驗證碼已發送' };
    if (SMS_PROVIDER === 'mock' && EXPOSE_TEST_OTP) {
      body.testOtp = otp;
    }

    return res.json(body);
  } catch (error) {
    console.error('send-otp error:', error.message);
    return res.status(500).json({ success: false, message: '發送失敗，請稍後再試' });
  }
});

app.post('/api/sms/verify-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const otp = String(req.body?.otp || '').trim();

    if (!isValidPhone(phone)) {
      return res.status(400).json({ success: false, message: '手機號碼格式不正確' });
    }

    if (!/^\d{4,6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: '驗證碼格式不正確' });
    }

    const lockInfo = await cacheGetJson(`otp:locked:${phone}`);
    if (lockInfo) {
      return res.status(429).json({ success: false, message: `嘗試次數過多，請 ${OTP_LOCK_MINUTES} 分鐘後再試` });
    }

    const otpData = await cacheGetJson(`otp:data:${phone}`);
    if (!otpData) {
      return res.status(400).json({ success: false, message: '驗證碼不存在或已過期' });
    }

    if (otpData.expiresAt <= nowMs()) {
      await cacheDelete(`otp:data:${phone}`);
      return res.status(400).json({ success: false, message: '驗證碼已過期，請重新獲取' });
    }

    const isMatch = signOtp(phone, otp) === otpData.otpHash;
    if (!isMatch) {
      const attempts = Number(otpData.attempts || 0) + 1;

      if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
        await cacheDelete(`otp:data:${phone}`);
        await cacheSetJson(`otp:locked:${phone}`, { at: nowMs() }, OTP_LOCK_MINUTES * 60);
        return res.status(429).json({ success: false, message: `錯誤次數過多，已鎖定 ${OTP_LOCK_MINUTES} 分鐘` });
      }

      otpData.attempts = attempts;
      await cacheSetJson(`otp:data:${phone}`, otpData, Math.max(1, Math.floor((otpData.expiresAt - nowMs()) / 1000)));
      return res.status(400).json({ success: false, message: `驗證碼錯誤，尚可嘗試 ${OTP_MAX_VERIFY_ATTEMPTS - attempts} 次` });
    }

    await cacheDelete(`otp:data:${phone}`);
    await cacheDelete(`otp:cooldown:${phone}`);

    return res.json({ success: true, message: '驗證成功' });
  } catch (error) {
    console.error('verify-otp error:', error.message);
    return res.status(500).json({ success: false, message: '驗證失敗，請稍後再試' });
  }
});

async function bootstrap() {
  try {
    if (redis) {
      await redis.connect();
      console.log('Redis connected');
    } else {
      console.log('Redis not configured, using in-memory store');
    }

    app.listen(PORT, () => {
      console.log(`OTP backend listening on http://localhost:${PORT}`);
      console.log(`SMS provider: ${SMS_PROVIDER}`);
    });
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

bootstrap();

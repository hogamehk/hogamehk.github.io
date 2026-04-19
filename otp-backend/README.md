# OTP Backend Template

This backend provides the two endpoints already used by your frontend page:

- `POST /api/sms/send-otp`
- `POST /api/sms/verify-otp`

It supports:

- 4-6 digit OTP
- OTP expiration
- resend cooldown
- max verify attempts + lock period
- Redis storage (recommended)
- fallback in-memory storage (for local testing)
- Twilio or Mock SMS provider

## 1) Install

```bash
cd otp-backend
npm install
```

## 2) Configure env

```bash
copy .env.example .env
```

Edit `.env` values:

- `SMS_PROVIDER=mock` for local testing
- `SMS_PROVIDER=twilio` for production SMS sending
- fill Twilio keys when using Twilio
- set `TWILIO_FROM` (or `TWILIO_PHONE_NUMBER`) to your Twilio sender number
- set strong `OTP_SIGNING_SECRET`
- set `CORS_ORIGIN` to your frontend domain

## 3) Run

```bash
npm run dev
```

Health check:

```bash
GET http://localhost:3000/health
```

## 4) API contracts

### Send OTP

`POST /api/sms/send-otp`

Request:

```json
{
  "phone": "85291234567"
}
```

Success response:

```json
{
  "success": true,
  "message": "驗證碼已發送"
}
```

When `SMS_PROVIDER=mock` and `EXPOSE_TEST_OTP=true`, response includes:

```json
{
  "success": true,
  "message": "驗證碼已發送",
  "testOtp": "123456"
}
```

### Verify OTP

`POST /api/sms/verify-otp`

Request:

```json
{
  "phone": "85291234567",
  "otp": "123456"
}
```

Success response:

```json
{
  "success": true,
  "message": "驗證成功"
}
```

## 5) Connect with frontend

Your frontend currently calls relative paths:

- `/api/sms/send-otp`
- `/api/sms/verify-otp`

For production, place this backend behind the same domain (reverse proxy) or update frontend API URLs to your backend host.

## Security checklist

- Use HTTPS only
- Disable `EXPOSE_TEST_OTP` in production
- Use Redis in production
- Add WAF / additional anti-abuse controls as needed
- Log requests without storing full OTP values

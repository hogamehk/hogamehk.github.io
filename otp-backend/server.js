const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();

// 1. 修正 Render 代理錯誤 (解決 X-Forwarded-For 報錯)
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// 模擬數據庫 (實際應使用 Redis)
let otpStore = {};

// 初始化 Twilio
const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// 2. 修正路徑：完全匹配前端要求的 /api/sms/send-otp
app.post('/api/sms/send-otp', async (req, res) => {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // 發送真實簡訊
        await client.messages.create({
            body: `【HOGAME】您的驗證碼為 ${otp}，請於 5 分鐘內輸入。`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+852${phone}`
        });

        otpStore[phone] = otp;
        console.log(`[Twilio] 已發送至 ${phone}: ${otp}`);
        res.json({ success: true, message: '簡訊已發送' });
    } catch (error) {
        console.error('Twilio Error:', error);
        res.status(500).json({ success: false, message: '發送失敗' });
    }
});

// 3. 修正路徑：匹配前端要求的驗證路徑
app.post('/api/sms/verify-otp', (req, res) => {
    const { phone, code } = req.body;
    if (otpStore[phone] && otpStore[phone] === code) {
        delete otpStore[phone];
        res.json({ success: true, message: '驗證成功' });
    } else {
        res.status(400).json({ success: false, message: '驗證碼錯誤' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`SMS Provider: Twilio (Forced)`);
});

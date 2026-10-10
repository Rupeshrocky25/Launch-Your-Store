/**
 * SMS Gateway Service
 * Supports Twilio, Fast2SMS (India), custom Webhook, and fallback console logging.
 */

export interface SmsResult {
  success: boolean;
  provider: 'TWILIO' | 'FAST2SMS' | 'WEBHOOK' | 'DEV_CONSOLE';
  message: string;
}

export async function sendSmsOtp(phone: string, code: string): Promise<SmsResult> {
  const messageText = `Your Launch-Your-Store verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;
  const cleanPhone = phone.trim().replace(/\s+/g, '');

  console.log(`\n==================================================`);
  console.log(`📱 [SMS SERVICE] DISPATCHING OTP`);
  console.log(`   To Phone: ${cleanPhone}`);
  console.log(`   OTP Code: ${code}`);
  console.log(`   Message: "${messageText}"`);
  console.log(`==================================================\n`);

  // 1. Check Twilio Configuration
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioPhone) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', cleanPhone);
      params.append('From', twilioPhone);
      params.append('Body', messageText);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (response.ok) {
        console.log(`[SMS SERVICE] Twilio SMS successfully sent to ${cleanPhone}`);
        return { success: true, provider: 'TWILIO', message: `SMS sent via Twilio to ${cleanPhone}` };
      } else {
        const errorText = await response.text();
        console.error(`[SMS SERVICE] Twilio error:`, errorText);
      }
    } catch (err: any) {
      console.error(`[SMS SERVICE] Twilio fetch failed:`, err.message);
    }
  }

  // 2. Check Fast2SMS (India) Configuration
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      // Remove + prefix for Indian phone numbers if present
      const rawNumber = cleanPhone.replace(/^\+91/, '').replace(/\D/g, '');
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: code,
          numbers: rawNumber,
        }),
      });

      const data: any = await response.json();
      if (data && data.return === true) {
        console.log(`[SMS SERVICE] Fast2SMS OTP successfully sent to ${rawNumber}`);
        return { success: true, provider: 'FAST2SMS', message: `SMS sent via Fast2SMS to ${cleanPhone}` };
      } else {
        console.error(`[SMS SERVICE] Fast2SMS error:`, data);
      }
    } catch (err: any) {
      console.error(`[SMS SERVICE] Fast2SMS fetch failed:`, err.message);
    }
  }

  // 3. Custom Webhook SMS provider
  const webhookUrl = process.env.SMS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, code, message: messageText }),
      });
      if (response.ok) {
        console.log(`[SMS SERVICE] Webhook SMS successfully dispatched to ${cleanPhone}`);
        return { success: true, provider: 'WEBHOOK', message: `SMS sent via Webhook to ${cleanPhone}` };
      }
    } catch (err: any) {
      console.error(`[SMS SERVICE] Webhook SMS failed:`, err.message);
    }
  }

  // Fallback (Console mode for testing/dev)
  return {
    success: true,
    provider: 'DEV_CONSOLE',
    message: `OTP generated and dispatched (${code}). Check server console or configure SMS API keys in .env for carrier delivery.`,
  };
}

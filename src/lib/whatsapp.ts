/**
 * whatsapp.ts
 *
 * Helper utilities for WhatsApp Cloud API integration.
 * Sends OTP messages to user phone numbers using approved Meta templates.
 */

export function formatPhoneForWhatsApp(phone: string): string {
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Strip international dial prefix '00'
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Handle local Saudi format (05XXXXXXXX -> 9665XXXXXXXX)
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.substring(1);
  }

  return cleaned;
}

export interface SendWhatsAppOtpOptions {
  phone: string;
  code: string;
}

export interface SendWhatsAppOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppOtp({
  phone,
  code,
}: SendWhatsAppOtpOptions): Promise<SendWhatsAppOtpResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'phone_verification';
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US';

  const cleanPhone = formatPhoneForWhatsApp(phone);

  if (!cleanPhone || cleanPhone.length < 8) {
    return {
      success: false,
      error: 'Invalid recipient phone number format. Please provide a valid phone number with country code.',
    };
  }

  if (!token || !phoneNumberId) {
    console.error(
      '[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in environment variables.'
    );
    // In development, log the OTP to help testing
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[whatsapp] [DEV PREVIEW] Verification code for ${cleanPhone} is: ${code}`);
    }
    return {
      success: false,
      error:
        'WhatsApp Cloud API is not configured on the server. Please ensure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set in .env.local.',
    };
  }

  const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  // Standard template payload with body parameter
  const basePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: templateLang,
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: code,
            },
          ],
        },
      ],
    },
  };

  try {
    let response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(basePayload),
    });

    let data = await response.json().catch(() => null);

    // If Meta returns an error indicating that button parameters are expected (Authentication template)
    if (!response.ok && data?.error) {
      const errorMsg = String(data.error.message || '');
      const errorDetails = String(data.error.error_data?.details || '');

      const isButtonRelated =
        errorMsg.toLowerCase().includes('button') ||
        errorDetails.toLowerCase().includes('button') ||
        errorDetails.toLowerCase().includes('component');

      if (isButtonRelated) {
        // Try fallback with button parameter (common in auth templates with URL or COPY_CODE button)
        const buttonPayload = {
          ...basePayload,
          template: {
            ...basePayload.template,
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: code }],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: code }],
              },
            ],
          },
        };

        const retryResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buttonPayload),
        });

        const retryData = await retryResponse.json().catch(() => null);
        if (retryResponse.ok && retryData?.messages?.[0]?.id) {
          return {
            success: true,
            messageId: retryData.messages[0].id,
          };
        }
      }

      console.error('[whatsapp] WhatsApp Cloud API error response:', data.error);
      return {
        success: false,
        error: data.error.message || 'WhatsApp Cloud API returned an error.',
      };
    }

    if (response.ok && data?.messages?.[0]?.id) {
      return {
        success: true,
        messageId: data.messages[0].id,
      };
    }

    return {
      success: false,
      error: 'WhatsApp message dispatch did not return a confirmation ID.',
    };
  } catch (err) {
    console.error('[whatsapp] Network error calling WhatsApp Cloud API:', err);
    return {
      success: false,
      error: 'Network error communicating with WhatsApp Cloud API.',
    };
  }
}

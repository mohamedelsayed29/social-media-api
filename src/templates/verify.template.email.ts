export const verifyEmailTemplate = ({
  otp,
  title,
  userName = "there",
  appName = "Vybe",
  otpExpiry = "10 minutes",
  securityUrl = "#",
  helpUrl = "#",
  twitterUrl = "#",
  instagramUrl = "#",
  tiktokUrl = "#",
  unsubscribeUrl = "#",
  privacyUrl = "#",
  termsUrl = "#",
  companyAddress = "",
}: {
  otp: string | number;
  title: string;
  userName?: string;
  appName?: string;
  otpExpiry?: string;
  securityUrl?: string;
  helpUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  unsubscribeUrl?: string;
  privacyUrl?: string;
  termsUrl?: string;
  companyAddress?: string;
}): string => {
  const otpStr = String(otp ?? "");
  const digits = otpStr.padStart(6, "0").slice(0, 6).split("");
  const [d1, d2, d3, d4, d5, d6] = digits;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${title}</title>
  <style>
    /* Light, simplified theme for broad email compatibility */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background-color: #f5f7fa;
      font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #1f2937;
    }

    .wrapper {
      width: 100%;
      background-color: #f5f7fa;
      padding: 40px 16px;
    }

    .container {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e6eef6;
      box-shadow: 0 6px 18px rgba(31,45,62,0.06);
    }

    .header {
      background: linear-gradient(180deg, #eef2ff 0%, #f9fafb 100%);
      padding: 28px 28px 20px;
      text-align: center;
      border-bottom: 1px solid #eef3fb;
      position: relative;
    }

    .logo-ring {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #c7b3ff, #e6e6ff);
      margin-bottom: 12px;
    }

    .app-name {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #6b46ff;
      margin-bottom: 8px;
    }

    .header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f1724;
      line-height: 1.25;
    }

    .body {
      padding: 28px 32px;
    }

    .greeting {
      font-size: 15px;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .greeting strong {
      color: #111827;
      font-weight: 700;
    }

    .otp-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #6b46ff;
      margin-bottom: 12px;
    }

    .otp-box {
      background: #f8fbff;
      border: 1px solid #e6eef6;
      border-radius: 12px;
      padding: 20px 18px;
      text-align: center;
      margin-bottom: 24px;
    }

    .otp-digits {
      display: inline-flex;
      gap: 12px;
      justify-content: center;
      align-items: center;
      flex-wrap: nowrap;
      margin-bottom: 8px;
    }

    .otp-digit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: #ffffff;
      border: 1px solid #e6eef6;
      border-radius: 8px;
      font-family: 'Space Mono', 'Courier New', monospace;
      font-size: 20px;
      font-weight: 700;
      color: #0f1724;
    }

    .otp-sep {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 52px;
      font-family: 'Space Mono', 'Courier New', monospace;
      font-size: 18px;
      color: #9ca3af;
    }

    .otp-expiry {
      font-size: 13px;
      color: #6b7280;
      margin-top: 6px;
    }

    .otp-expiry span {
      color: #6b46ff;
      font-weight: 700;
    }

    .note {
      background: #f1f5ff;
      border-left: 3px solid #c7b3ff;
      border-radius: 0 8px 8px 0;
      padding: 12px 14px;
      margin-bottom: 20px;
    }

    .note p {
      font-size: 13px;
      color: #374151;
      line-height: 1.6;
    }

    .cta-text {
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .divider {
      height: 1px;
      background: #eef3fb;
      margin-bottom: 18px;
    }

    .footer {
      padding: 18px 28px 28px;
      text-align: center;
    }

    .footer p {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }

    .footer a {
      color: #6b46ff;
      text-decoration: none;
    }

    @media (max-width: 480px) {
      .header, .body { padding: 20px 18px; }
      .footer { padding: 14px 18px 20px; }
      .otp-digit { width: 44px; height: 44px; font-size: 18px; }
      .otp-digits { gap: 8px; }
      .otp-sep { height: 44px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <div class="header">
        <div class="logo-ring">
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" style="width:32px;height:32px;">
            <circle cx="9"  cy="5.5" r="1.6" fill="white" opacity="0.55"/>
            <circle cx="16" cy="3.8" r="1.9" fill="white" opacity="0.9"/>
            <circle cx="23" cy="5.5" r="1.6" fill="white" opacity="0.55"/>
            <path d="M5 9 L16 24 L27 9" stroke="white" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="16" cy="24" r="5.5" stroke="white" stroke-width="1.4" opacity="0.35"/>
            <circle cx="16" cy="18.5" r="2" fill="white"/>
          </svg>
        </div>
        <p class="app-name">${appName}</p>
        <h1>${title}</h1>
      </div>

      <div class="body">
        <p class="greeting">
          Hey there, <strong>${userName}</strong>! 👋<br/><br/>
          Use the verification code below to complete your action. This code is valid for a limited time and should not be shared with anyone.
        </p>

        <p class="otp-label">Your one-time password</p>
        <div class="otp-box">
          <div class="otp-digits" role="presentation" aria-hidden="true">
            <div class="otp-digit">${d1}</div>
            <div class="otp-digit">${d2}</div>
            <div class="otp-digit">${d3}</div>
            <div class="otp-sep">—</div>
            <div class="otp-digit">${d4}</div>
            <div class="otp-digit">${d5}</div>
            <div class="otp-digit">${d6}</div>
          </div>
          <p class="otp-expiry">Expires in <span>${otpExpiry}</span></p>
        </div>

        <div class="note">
          <p>
            <strong>Security tip:</strong> We will never ask for this code via phone, chat, or email.
            If you didn't request this, please
            <a href="${securityUrl}" style="color:#a78bfa;">secure your account</a> immediately.
          </p>
        </div>

        <p class="cta-text">
          If you have any trouble, visit our
          <a href="${helpUrl}" style="color:#6c63ff;text-decoration:none;font-weight:600;">Help Center</a>
          or reply to this email and our team will be happy to assist you.
        </p>
      </div>

      <div class="divider" style="margin: 0 40px 28px;"></div>
      <div class="footer">
        <div class="social-links">
          <a href="${twitterUrl}" class="social-link">
            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.904-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="${instagramUrl}" class="social-link">
            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="${tiktokUrl}" class="social-link">
            <svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          </a>
        </div>

        <p>
          © ${year} ${appName}. All rights reserved.<br/>
          <a href="${unsubscribeUrl}">Unsubscribe</a> · <a href="${privacyUrl}">Privacy Policy</a> · <a href="${termsUrl}">Terms of Service</a>
        </p>
        ${companyAddress ? `<p style="margin-top: 12px;">${companyAddress}</p>` : ""}
      </div>

    </div>
  </div>
</body>
</html>`;
};
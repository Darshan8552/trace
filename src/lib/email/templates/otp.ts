type OtpEmailInput = {
  otp: string;
  expiresInMinutes: number;
};

export function renderOtpEmail({ otp, expiresInMinutes }: OtpEmailInput) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your Trace code</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f2e9;color:#1e1c17;font-family:'Public Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your Trace verification code is ${otp}.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2e9;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fcf9f2;border:1px solid #dcd4c4;border-top:3px solid #c4442e;">
            <tr>
              <td style="padding:28px 32px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:-0.02em;color:#1e1c17;">
                Trace
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                <p style="margin:0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:11px;color:#6c675c;">
                  Verify your email
                </p>
                <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.15;letter-spacing:-0.02em;color:#1e1c17;">
                  Here&rsquo;s your code.
                </h1>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#6c675c;">
                  Enter this code to finish signing in to Trace.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                <div style="background:#f6f2e9;border:1px solid #dcd4c4;padding:18px 0;text-align:center;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:32px;font-weight:600;letter-spacing:0.36em;text-indent:0.36em;color:#1e1c17;">
                  ${otp}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6c675c;">
                  The code expires in ${expiresInMinutes} minutes. If you didn&rsquo;t ask for it, you can ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <hr style="border:none;border-top:1px solid #dcd4c4;margin:0 0 16px;" />
                <p style="margin:0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:12px;line-height:1.6;color:#6c675c;">
                  Trace &mdash; answers you can trace.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textContent = [
    `Your Trace verification code is ${otp}.`,
    "",
    `The code expires in ${expiresInMinutes} minutes.`,
    "If you didn't ask for it, you can ignore this email.",
    "",
    "Trace - answers you can trace.",
  ].join("\n");

  return { html, textContent };
}

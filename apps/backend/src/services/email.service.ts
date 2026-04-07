import { env } from '../config/env'
import { AppError } from '../middlewares/errorHandler'

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: env.BREVO_FROM_NAME, email: env.BREVO_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.error('[Brevo] 이메일 전송 실패:', body)
    throw new AppError(500, '이메일 전송에 실패했습니다', 'INTERNAL_ERROR')
  }
}

export const emailService = {
  async sendVerificationEmail(to: string, code: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color:#4f46e5;padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Scorely</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;">이메일 인증</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              아래 6자리 인증 코드를 입력해 이메일을 인증해주세요.<br>인증 코드는 <strong>10분</strong> 후 만료됩니다.
            </p>
            <div style="background-color:#f5f3ff;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
              <span style="font-size:36px;font-weight:700;color:#4f46e5;letter-spacing:12px;">${code}</span>
            </div>
            <p style="margin:0;font-size:12px;color:#9ca3af;">이 메일을 요청하지 않았다면 무시해주세요.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    await sendEmail(to, '[Scorely] 이메일 인증 코드', html)
  },

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color:#4f46e5;padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Scorely</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;">비밀번호 재설정</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              아래 버튼을 클릭하여 비밀번호를 재설정해주세요.<br>링크는 <strong>15분</strong> 후 만료됩니다.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${resetLink}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">비밀번호 재설정하기</a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">버튼이 작동하지 않으면 아래 링크를 복사해 브라우저에 붙여넣어 주세요.</p>
            <p style="margin:0;font-size:11px;color:#9ca3af;word-break:break-all;">${resetLink}</p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">이 메일을 요청하지 않았다면 무시해주세요.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    await sendEmail(to, '[Scorely] 비밀번호 재설정 링크', html)
  },
}

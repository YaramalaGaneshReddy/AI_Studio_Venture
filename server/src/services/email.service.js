import nodemailer from 'nodemailer';

export async function sendReportEmail({ to, subject, text, attachments = [] }) {
  const apiKey = process.env.RESEND_API_KEY || (process.env.SMTP_PASS?.startsWith('re_') ? process.env.SMTP_PASS : null);
  const fromAddress = process.env.SMTP_FROM || 'AI Venture Studio <onboarding@resend.dev>';

  // 1. Primary Path: Resend REST API (Fast, reliable, serverless-safe)
  if (apiKey) {
    try {
      const resendAttachments = attachments.map((att) => {
        let contentStr = '';
        if (Buffer.isBuffer(att.content)) {
          contentStr = att.content.toString('base64');
        } else if (typeof att.content === 'string') {
          contentStr = Buffer.from(att.content).toString('base64');
        }
        return {
          filename: att.filename,
          content: contentStr
        };
      });

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: Array.isArray(to) ? to : [to],
          subject,
          text,
          attachments: resendAttachments.length > 0 ? resendAttachments : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Email Service] Resend API Error:', data);
        return {
          success: false,
          error: data.message || data.name || 'Failed to send email via Resend API'
        };
      }

      return { success: true, id: data.id };
    } catch (err) {
      console.error('[Email Service] Resend API Exception:', err);
      // Fallback to Nodemailer SMTP below if HTTP fetch fails
    }
  }

  // 2. Secondary Path: Nodemailer SMTP
  if (!process.env.SMTP_HOST) {
    return { skipped: true, reason: 'Neither RESEND_API_KEY nor SMTP_HOST is configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      attachments
    });

    return { success: true, messageId: info.messageId };
  } catch (smtpErr) {
    console.error('[Email Service] Nodemailer Error:', smtpErr);
    return { success: false, error: smtpErr.message || 'SMTP transport failed' };
  }
}

export async function sendVentureReportEmail(project, recipientEmail) {
  const subject = `Venture Report: ${project.startupName || project.title || 'Untitled Project'}`;
  const text = `Here is the executive report for ${project.startupName || project.title || 'Untitled Project'}.\n\nOverview:\n${project.overview || project.tagline || 'No overview provided.'}`;
  return sendReportEmail({
    to: recipientEmail,
    subject,
    text
  });
}



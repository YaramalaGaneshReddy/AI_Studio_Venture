import nodemailer from 'nodemailer';

export async function sendReportEmail({ to, subject, text, attachments = [] }) {
  if (!process.env.SMTP_HOST) {
    return { skipped: true, reason: 'SMTP_HOST is not configured' };
  }

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

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'AI Venture Studio <noreply@example.com>',
    to,
    subject,
    text,
    attachments
  });
}

export async function sendVentureReportEmail(project, recipientEmail) {
  const subject = `Venture Report: ${project.title || 'Untitled Project'}`;
  const text = `Here is the executive report for ${project.title || 'Untitled Project'}.\n\nOverview:\n${project.overview || 'No overview provided.'}`;
  return sendReportEmail({
    to: recipientEmail,
    subject,
    text
  });
}


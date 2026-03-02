import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) {
  await sgMail.send({
    to: params.to,
    from: params.from || process.env.SENDGRID_FROM_EMAIL!,
    subject: params.subject,
    html: params.html,
    text: params.text || params.html.replace(/<[^>]*>/g, ""),
  });
}

const nodemailer = require("nodemailer");

async function sendEmail({ payload, to }) {
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMPT_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  await transporter.verify();
  const html = `<ul>
	${payload.map(el => `<li>${el.title} - ${el.url}</li>`)}
	</ul>`;
  const res = await transporter.sendMail({
    to,
    from: process.env.SMTP_EMAIL,
    html,
    subject: "Nouveau posts welcometothejungle",
  });
  return res;
}

module.exports = { sendEmail };

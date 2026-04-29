const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

// Agrega esto temporalmente
console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log("GMAIL_APP_PASS:", process.env.GMAIL_APP_PASS);

const EmailService = {
  async sendPasswordReset(destinatario, codigo) {
    const mailOptions = {
      from: `"Casecon S.A.S" <${process.env.GAMIL_USER}`,
      to: destinatario,
      subject: "Código de recuperación - Casercon",
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px;
                    border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
 
          <h2 style="color: #1f2937; margin-bottom: 8px;">🔐 Recuperar contraseña</h2>
 
          <p style="color: #4b5563; font-size: 15px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en
            <strong>Casercon S.A.S</strong>.
          </p>
 
          <p style="color: #4b5563; font-size: 15px;">
            Ingresa el siguiente código en la aplicación. Expira en <strong>15 minutos</strong>.
          </p>
 
          <div style="text-align: center; margin: 28px 0;">
            <span style="
              display: inline-block;
              font-size: 38px;
              font-weight: bold;
              letter-spacing: 10px;
              color: #111827;
              background: #fef9c3;
              border: 2px solid #facc15;
              padding: 14px 28px;
              border-radius: 10px;
            ">
              ${codigo}
            </span>
          </div>
 
          <p style="font-size: 13px; color: #9ca3af; margin-top: 24px;">
            Si no solicitaste esto, ignora este mensaje. Tu contraseña no cambiará.
          </p>
 
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
 
          <p style="font-size: 12px; color: #d1d5db; text-align: center;">
            Casercon S.A.S — Sistema de Inventario
          </p>
        </div>
            `,
    };

    await transporter.sendMail(mailOptions);
  },
};

module.exports = EmailService;

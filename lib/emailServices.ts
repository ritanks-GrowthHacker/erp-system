import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rihina.techorzo@gmail.com",
    pass: "wdufgyawvizccnwc",
  },
});

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const mailOptions = {
      from: "rihina.techorzo@gmail.com",
      to: options.to,
      subject: options.subject,
      text: options.text || "",
      html: options.html || "",
    };

    const response = await transporter.sendMail(mailOptions);

    console.log("Email sent:", response.messageId);
    return { 
      success: true, 
      messageId: response.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

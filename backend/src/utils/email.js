import nodemailer from "nodemailer";

function getTransporter() {
  // Read directly from process.env so a server restart always picks up new values
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
  });
}

/**
 * Send store-owner welcome email with login credentials.
 * Falls back to a console.log when SMTP is not configured (development).
 */
export async function sendOwnerCredentials({ name, email, password, storeName }) {
  const subject = `Welcome to Store Ratings — your login details`;
  const text = `Hi ${name},

A Store Ratings account has been created for you as the owner of "${storeName}".

Your login credentials:
  Email:    ${email}
  Password: ${password}

Please log in at http://localhost:3000 and change your password
from the My Profile page as soon as possible.

— The Store Ratings Team`;

  const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
  <h2 style="color:#4f46e5">Welcome to Store Ratings</h2>
  <p>Hi <strong>${name}</strong>,</p>
  <p>A Store Ratings account has been created for you as the owner of
     <strong>${storeName}</strong>. Log in at
     <a href="http://localhost:3000">http://localhost:3000</a>.</p>
  <table style="border-collapse:collapse;margin:20px 0;width:100%">
    <tr>
      <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:120px">Email</td>
      <td style="padding:8px 12px;background:#fafafa;font-family:monospace">${email}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Password</td>
      <td style="padding:8px 12px;background:#fafafa;font-family:monospace">${password}</td>
    </tr>
  </table>
  <p style="color:#b91c1c;font-size:14px">
    ⚠️ Please log in and change your password from the <strong>My Profile</strong> page
    as soon as possible.
  </p>
  <p style="font-size:13px;color:#666">— The Store Ratings Team</p>
</div>`;

  const transporter = getTransporter();

  if (!transporter) {
    // Dev fallback — print to console so the admin can see the credentials
    console.log("\n────────────────────────────────────────");
    console.log("[email] SMTP not configured. Credentials that would have been sent:");
    console.log(`  To:       ${email}`);
    console.log(`  Name:     ${name}`);
    console.log(`  Store:    ${storeName}`);
    console.log(`  Password: ${password}`);
    console.log("────────────────────────────────────────\n");
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@storeratings.app",
    to: email,
    subject,
    text,
    html,
  });
}

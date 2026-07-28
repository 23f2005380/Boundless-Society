export async function sendApprovalEmail(toEmail, toName, tripName, whatsappLink, qrCodeUrl) {
  const apiKey = process.env.BREVO_API_KEY;
  const templateId = process.env.BREVO_TEMPLATE_ID;

  if (!apiKey || !templateId) {
    console.warn("Brevo API Key or Template ID is missing in environment variables. Email was not sent.");
    return null;
  }

  const payload = {
    to: [
      {
        email: toEmail,
        name: toName
      }
    ],
    templateId: parseInt(templateId, 10),
    params: {
      name: toName,
      tripName: tripName,
      whatsappLink: whatsappLink || "",
      qrCodeUrl: qrCodeUrl || ""
    }
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Brevo API returned error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("Brevo email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending Brevo email:", error);
    throw error;
  }
}

/**
 * Send a correction / re-upload request email to the student.
 * Uses raw HTML (no template) so no extra Brevo template setup is needed.
 */
export async function sendCorrectionRequestEmail(toEmail, toName, tripName, issueText, actionFields, tripId) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("Brevo API Key is missing. Correction email was not sent.");
    return null;
  }

  const fieldsHtml = actionFields && actionFields.length > 0
    ? `<ul style="margin:8px 0 0 0;padding:0 0 0 20px;color:#4B1A36;">
        ${actionFields.map(f => `<li style="margin-bottom:4px;">${f}</li>`).join("")}
       </ul>`
    : "";

  const messageHtml = issueText
    ? `<p style="margin:12px 0 0 0;color:#3E1126;font-size:15px;">${issueText.replace(/\n/g, "<br/>")}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:2px solid #e5e7eb;overflow:hidden;max-width:96vw;">
        <tr>
          <td style="background:#3E1126;padding:28px 32px;">
            <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">⚠️ Action Required – ${tripName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px 0;color:#111;font-size:15px;">Hi <strong>${toName}</strong>,</p>
            <p style="margin:0 0 16px 0;color:#444;font-size:15px;">
              The coordinators for <strong>${tripName}</strong> have reviewed your registration and need you to make some corrections or provide additional information.
            </p>
            ${messageHtml}
            ${fieldsHtml ? `<div style="margin-top:16px;padding:16px;background:#FFF8F0;border-left:4px solid #F59E0B;border-radius:8px;">
              <p style="margin:0 0 6px 0;font-weight:bold;color:#92400E;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Fields to correct:</p>
              ${fieldsHtml}
            </div>` : ""}
            <div style="margin-top:28px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://boundlesssociety.in"}/trip-registration?tripId=${tripId}" 
                 style="background:#3E1126;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:bold;font-size:15px;display:inline-block;">
                Submit Corrections →
              </a>
            </div>
            <p style="margin:24px 0 0 0;color:#999;font-size:12px;text-align:center;">
              You are receiving this email because you registered for ${tripName} with Boundless Travel Society.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const senderName = process.env.BREVO_SENDER_NAME || "Boundless Travel Society";
  const replyTo = process.env.BREVO_REPLY_TO || "";

  // Dynamically fetch the verified sender from Brevo instead of hardcoding
  let senderEmail = null;
  try {
    const sendersRes = await fetch("https://api.brevo.com/v3/senders", {
      headers: { "accept": "application/json", "api-key": apiKey },
    });
    if (sendersRes.ok) {
      const sendersData = await sendersRes.json();
      const activeSender = (sendersData.senders || []).find(s => s.active);
      senderEmail = activeSender?.email || sendersData.senders?.[0]?.email || null;
    }
  } catch (senderErr) {
    console.warn("Could not fetch Brevo senders:", senderErr);
  }

  if (!senderEmail) {
    console.error("No verified Brevo sender found. Correction email not sent.");
    return null;
  }

  const payload = {
    to: [{ email: toEmail, name: toName }],
    sender: { name: senderName, email: senderEmail },
    ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    subject: `⚠️ Action Required: Correction Requested for ${tripName}`,
    htmlContent: html,
  };


  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Brevo API returned error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("Correction request email sent:", data);
    return data;
  } catch (error) {
    console.error("Error sending correction request email:", error);
    return null; // non-fatal — don't block the status update
  }
}

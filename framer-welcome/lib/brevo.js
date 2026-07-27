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

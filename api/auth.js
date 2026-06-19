export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Use POST for authentication." });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const action = String(request.body?.action || "");
  const email = String(request.body?.email || "").trim().toLowerCase();

  if (!supabaseUrl || !supabaseKey) {
    return response.status(503).json({
      error: "Email sign-in is not configured yet. You can continue as a guest.",
    });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: "Enter a valid email address." });
  }

  try {
    if (action === "request") {
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: "POST",
        headers: createHeaders(supabaseKey),
        body: JSON.stringify({
          email,
          create_user: request.body?.mode === "signup",
        }),
      });
      const data = await readJson(authResponse);

      if (!authResponse.ok) {
        return response.status(authResponse.status).json({
          error: data.msg || data.message || data.error_description || "Could not send the verification code.",
        });
      }

      return response.status(200).json({ message: "A 6-digit verification code was sent to your email." });
    }

    if (action === "verify") {
      const token = String(request.body?.token || "").trim();
      if (!/^\d{6}$/.test(token)) {
        return response.status(400).json({ error: "Enter the 6-digit code from your email." });
      }

      const authResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: "POST",
        headers: createHeaders(supabaseKey),
        body: JSON.stringify({ email, token, type: "email" }),
      });
      const data = await readJson(authResponse);

      if (!authResponse.ok) {
        return response.status(authResponse.status).json({
          error: data.msg || data.message || data.error_description || "The verification code is invalid or expired.",
        });
      }

      return response.status(200).json({
        user: { id: data.user?.id, email: data.user?.email || email },
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
    }

    return response.status(400).json({ error: "Unsupported authentication action." });
  } catch (error) {
    return response.status(502).json({ error: error.message || "Authentication service unavailable." });
  }
}

function createHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

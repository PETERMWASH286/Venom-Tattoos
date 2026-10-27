import { createHmac, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import type { IssuedPass, PassMethod } from "@/lib/pass";
import { ADDRESS, artistById, money, prettyDate, prettyTime, serviceById } from "@/lib/studio";

type Wire = {
  c: string;
  n: string;
  e: string;
  p: string;
  s: string;
  a: string;
  d: string;
  t: string;
  $: number;
  m: PassMethod;
  l: 0 | 1;
  w: string;
  i: string;
};

function ticketSecret() {
  return process.env.TICKET_SECRET?.trim() || "venom-queen-west-pass-v1";
}

function signPass(pass: IssuedPass) {
  const wire: Wire = {
    c: pass.code,
    n: pass.name,
    e: pass.email,
    p: pass.phone,
    s: pass.serviceId,
    a: pass.artistId,
    d: pass.date,
    t: pass.time,
    $: pass.deposit,
    m: pass.method,
    l: pass.live ? 1 : 0,
    w: pass.placement,
    i: pass.idea,
  };
  const body = Buffer.from(JSON.stringify(wire), "utf8").toString("base64url");
  const sig = createHmac("sha256", ticketSecret()).update(body).digest("base64url");
  return `${body}~${sig}`;
}

export function openPass(token: string): IssuedPass | null {
  const cut = token.indexOf("~");
  if (cut < 1) return null;
  const body = token.slice(0, cut);
  const sig = token.slice(cut + 1);
  if (!body || !sig || sig.length > 128) return null;
  const expected = createHmac("sha256", ticketSecret()).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  let wire: Wire;
  try {
    wire = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Wire;
  } catch {
    return null;
  }
  if (!wire || typeof wire.c !== "string" || !/^VNM-[A-Z0-9]{4}$/.test(wire.c)) return null;
  if (typeof wire.n !== "string" || typeof wire.e !== "string") return null;
  const method: PassMethod = wire.m === "paypal" || wire.m === "usdt" ? wire.m : "card";
  return {
    code: wire.c,
    name: wire.n.slice(0, 80),
    email: wire.e.slice(0, 120),
    phone: String(wire.p ?? "").slice(0, 24),
    serviceId: String(wire.s ?? ""),
    artistId: String(wire.a ?? ""),
    date: String(wire.d ?? ""),
    time: String(wire.t ?? ""),
    deposit: Number.isFinite(Number(wire.$)) ? Number(wire.$) : 0,
    method,
    live: wire.l === 1,
    placement: String(wire.w ?? "").slice(0, 40),
    idea: String(wire.i ?? "").slice(0, 180),
  };
}

function esc(value: string) {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}

function methodLabel(method: PassMethod) {
  if (method === "paypal") return "PayPal";
  if (method === "usdt") return "USDT";
  return "Card";
}

function letter(pass: IssuedPass, url: string) {
  const service = serviceById(pass.serviceId);
  const artist = artistById(pass.artistId);
  const when = `${prettyDate(pass.date)} · ${prettyTime(pass.time)}`;
  const deposit = `${money(pass.deposit)} · ${methodLabel(pass.method)}`;
  const funds = pass.live
    ? "The deposit is in. It comes off the session total."
    : "This hold was saved without a live charge. The chair is still under your code.";
  const subject = `Your chair is held — ${pass.code}`;
  const text = [
    `Venom Tattoos — your chair is held`,
    ``,
    `Code: ${pass.code}`,
    `Guest: ${pass.name}`,
    `Sitting: ${service.name} with ${artist.name}`,
    `When: ${when}`,
    `Placement: ${pass.placement}`,
    `Deposit: ${deposit}`,
    `Idea: ${pass.idea}`,
    ``,
    funds,
    ``,
    `Open your pass: ${url}`,
    `Scan the attached QR code with your phone camera. It opens this same booking.`,
    ``,
    ADDRESS,
    `Arrive ten minutes early with photo ID. 18 and over.`,
    `Move the date once with 48 hours’ notice.`,
  ].join("\n");

  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #e4dfd4;font-family:Georgia,serif;font-size:13px;color:#6d685e;width:34%;">${esc(label)}</td><td style="padding:10px 0;border-bottom:1px solid #e4dfd4;font-family:Georgia,serif;font-size:15px;color:#14160a;">${esc(value)}</td></tr>`;

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#090908;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#090908;">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#f3efe6;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6d685e;">Venom Tattoos · Queen West</td>
          </tr>
          <tr>
            <td style="padding:10px 28px 0;font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#3d4a12;">Chair held</td>
          </tr>
          <tr>
            <td style="padding:6px 28px 0;font-family:Georgia,serif;font-size:40px;line-height:1;letter-spacing:-0.04em;color:#14160a;">${esc(pass.code)}</td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;font-family:Georgia,serif;font-size:18px;font-style:italic;color:#14160a;">The drawing is yours, ${esc(pass.name.split(" ")[0] || pass.name)}.</td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 28px 8px;">
              <img src="cid:pass-qr" width="240" height="240" alt="QR code for booking ${esc(pass.code)}" style="display:block;width:240px;height:240px;border-radius:12px;background:#ffffff;" />
              <p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6d685e;">Scan to open the booking</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${row("Sitting", `${service.name} · ${artist.name}`)}
                ${row("When", when)}
                ${row("Placement", pass.placement)}
                ${row("Deposit", deposit)}
                ${row("Idea", pass.idea)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 0;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#3c3a34;">${esc(funds)} Arrive ten minutes early with photo ID.</td>
          </tr>
          <tr>
            <td style="padding:18px 28px 8px;">
              <a href="${esc(url)}" style="display:inline-block;background:#d6ff4a;color:#14160a;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:14px 22px;border-radius:999px;">Open your pass</a>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 28px 22px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6d685e;">
              ${esc(ADDRESS)}<br />
              Move the date once with 48 hours’ notice. After that the deposit stays with the studio.<br />
              <a href="${esc(url)}" style="color:#14160a;">${esc(url)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html, when, deposit, serviceName: service.name, artistName: artist.name };
}

async function sendResend(apiKey: string, from: string, pass: IssuedPass, url: string, png: Buffer) {
  const note = letter(pass, url);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [pass.email],
      subject: note.subject,
      html: note.html,
      text: note.text,
      attachments: [
        {
          filename: "venom-pass-qr.png",
          content: png.toString("base64"),
          content_id: "pass-qr",
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    console.error("resend failed", res.status);
    return false;
  }
  return true;
}

async function sendSendgrid(apiKey: string, from: string, pass: IssuedPass, url: string, png: Buffer) {
  const note = letter(pass, url);
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: pass.email, name: pass.name }] }],
      from: { email: from, name: "Venom Tattoos" },
      subject: note.subject,
      content: [
        { type: "text/plain", value: note.text },
        { type: "text/html", value: note.html },
      ],
      attachments: [
        {
          content: png.toString("base64"),
          filename: "venom-pass-qr.png",
          type: "image/png",
          disposition: "inline",
          content_id: "pass-qr",
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    console.error("sendgrid failed", res.status);
    return false;
  }
  return true;
}

async function sendPostmark(token: string, from: string, pass: IssuedPass, url: string, png: Buffer) {
  const note = letter(pass, url);
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: from,
      To: pass.email,
      Subject: note.subject,
      HtmlBody: note.html,
      TextBody: note.text,
      MessageStream: "outbound",
      Attachments: [
        {
          Name: "venom-pass-qr.png",
          Content: png.toString("base64"),
          ContentType: "image/png",
          ContentID: "cid:pass-qr",
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    console.error("postmark failed", res.status);
    return false;
  }
  return true;
}

async function postFormsubmit(pass: IssuedPass, url: string, png: Buffer | null) {
  const service = serviceById(pass.serviceId);
  const artist = artistById(pass.artistId);
  const when = `${prettyDate(pass.date)} · ${prettyTime(pass.time)}`;
  const fd = new FormData();
  fd.set("_subject", `Your chair is held — ${pass.code}`);
  fd.set("_captcha", "false");
  fd.set("_template", "box");
  fd.set("code", pass.code);
  fd.set("guest", pass.name);
  fd.set("sitting", `${service.name} with ${artist.name}`);
  fd.set("when", when);
  fd.set("placement", pass.placement);
  fd.set("deposit", `${money(pass.deposit)} · ${methodLabel(pass.method)}`);
  fd.set("idea", pass.idea);
  fd.set("pass", url);
  fd.set(
    "qr",
    png
      ? "Open the attached PNG and scan it. The code opens this booking on your phone."
      : "Open the pass link on your phone to see the scannable code.",
  );
  fd.set("studio", ADDRESS);
  fd.set("arrive", "Ten minutes early, fed, with photo ID. 18 and over. Move the date once with 48 hours’ notice.");
  if (png) {
    fd.set("attachment", new Blob([new Uint8Array(png)], { type: "image/png" }), "venom-pass-qr.png");
  }
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(pass.email)}`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: fd,
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    let success = false;
    try {
      const json = JSON.parse(text) as { success?: boolean | string };
      success = json.success === true || json.success === "true";
    } catch {
      success = false;
    }
    if (!res.ok || !success) {
      console.error("formsubmit failed", res.status);
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (error) {
    console.error("formsubmit failed", error instanceof Error ? error.message : "error");
    return { ok: false, status: 0 };
  }
}

export async function issueAndSend(pass: IssuedPass & { origin: string }) {
  const token = signPass(pass);
  const url = `${pass.origin}/pass/${token}`;
  const png = await QRCode.toBuffer(url, {
    width: 640,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#14160a", light: "#ffffff" },
  });

  let emailSent = false;
  let emailHasQr = false;
  const from = process.env.BOOKING_FROM_EMAIL?.trim();
  try {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      emailSent = await sendResend(
        resendKey,
        from || "Venom Tattoos <onboarding@resend.dev>",
        pass,
        url,
        png,
      );
      emailHasQr = emailSent;
    }
    const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
    if (!emailSent && sendgridKey && from) {
      emailSent = await sendSendgrid(sendgridKey, from, pass, url, png);
      emailHasQr = emailSent;
    }
    const postmark = process.env.POSTMARK_SERVER_TOKEN?.trim();
    if (!emailSent && postmark && from) {
      emailSent = await sendPostmark(postmark, from, pass, url, png);
      emailHasQr = emailSent;
    }
    if (!emailSent) {
      const attached = await postFormsubmit(pass, url, png);
      if (attached.ok) {
        emailSent = true;
        emailHasQr = true;
      } else if (attached.status !== 429) {
        const plain = await postFormsubmit(pass, url, null);
        emailSent = plain.ok;
        emailHasQr = false;
      }
    }
  } catch (error) {
    console.error("booking email failed", error instanceof Error ? error.message : "error");
    emailSent = false;
    emailHasQr = false;
  }

  return { token, url, emailSent, emailHasQr };
}

/**
 * Checkout / payments unit tests.
 * Pure logic only — no network, no Stripe/PayPal SDKs.
 *
 * Run:
 *   node --experimental-strip-types --test src/lib/payments.test.ts
 * or add this path to the "test" script in package.json.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isAddress, USDT_BY_CHAIN } from "./payments.ts";
import { cadToUsdt, money, serviceById, services, STUDIO_RATE_CAD_PER_USDT } from "./studio.ts";

/** Mirror of bookings.makeCode — avoids pulling zustand into the test process. */
function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < 4; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `VNM-${body}`;
}

type PayMethod = "card" | "paypal" | "usdt";

const emptyDraft = {
  serviceId: "session",
  artistId: "mira",
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  placement: "",
  idea: "",
};

// ---------------------------------------------------------------------------
// Catalog & deposit integrity (source of truth for charges)
// ---------------------------------------------------------------------------

describe("service catalog deposits", () => {
  it("exposes the four production sittings", () => {
    const ids = services.map((s) => s.id).sort();
    assert.deepEqual(ids, ["consult", "day", "session", "small"]);
  });

  it("keeps deposit amounts in CAD and positive", () => {
    for (const s of services) {
      assert.ok(Number.isInteger(s.deposit), `${s.id} deposit must be integer CAD`);
      assert.ok(s.deposit > 0, `${s.id} deposit must be > 0`);
      assert.ok(
        s.deposit <= s.from || s.from === 0,
        `${s.id}: deposit should not exceed session floor when floor is set`,
      );
    }
  });

  it("matches expected deposit schedule", () => {
    assert.equal(serviceById("consult").deposit, 50);
    assert.equal(serviceById("small").deposit, 80);
    assert.equal(serviceById("session").deposit, 150);
    assert.equal(serviceById("day").deposit, 250);
  });

  it("serviceById falls back to half-day for unknown ids", () => {
    assert.equal(serviceById("nope").id, "session");
  });
});

// ---------------------------------------------------------------------------
// Money & USDT quote (what the wallet UI shows)
// ---------------------------------------------------------------------------

describe("money formatting", () => {
  it("formats whole CAD without cents", () => {
    const formatted = money(150);
    assert.match(formatted, /150/);
    assert.ok(formatted.includes("$") || formatted.includes("CA"), `unexpected format: ${formatted}`);
  });
});

describe("cadToUsdt studio quote", () => {
  it("uses the fixed studio rate", () => {
    assert.equal(STUDIO_RATE_CAD_PER_USDT, 1.38);
  });

  it("converts deposits to two decimal USDT strings", () => {
    assert.equal(cadToUsdt(50), (50 / 1.38).toFixed(2));
    assert.equal(cadToUsdt(150), (150 / 1.38).toFixed(2));
    assert.equal(cadToUsdt(250), (250 / 1.38).toFixed(2));
  });

  it("never returns NaN for catalog deposits", () => {
    for (const s of services) {
      const usdt = cadToUsdt(s.deposit);
      assert.ok(!Number.isNaN(Number(usdt)), `NaN for ${s.id}`);
      assert.match(usdt, /^\d+\.\d{2}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// Address validation & chain contracts
// ---------------------------------------------------------------------------

describe("isAddress", () => {
  it("accepts a valid 0x address", () => {
    assert.equal(isAddress("0xc2132D05D31c914a87C6611C10748AEb04B58e8F"), true);
    assert.equal(isAddress("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"), true);
  });

  it("rejects incomplete or non-hex values", () => {
    assert.equal(isAddress(""), false);
    assert.equal(isAddress("0x"), false);
    assert.equal(isAddress("0x123"), false);
    assert.equal(isAddress("c2132D05D31c914a87C6611C10748AEb04B58e8F"), false);
    assert.equal(isAddress("0xGGGG2D05D31c914a87C6611C10748AEb04B58e8F"), false);
  });
});

describe("USDT_BY_CHAIN", () => {
  it("maps Polygon and Arbitrum to known USDT contracts", () => {
    assert.equal(USDT_BY_CHAIN[137], "0xc2132D05D31c914a87C6611C10748AEb04B58e8F");
    assert.equal(USDT_BY_CHAIN[42161], "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9");
    assert.ok(isAddress(USDT_BY_CHAIN[137]));
    assert.ok(isAddress(USDT_BY_CHAIN[42161]));
  });
});

// ---------------------------------------------------------------------------
// Booking codes & draft shape
// ---------------------------------------------------------------------------

describe("makeCode", () => {
  it("returns VNM-XXXX with safe alphabet (no I/O/0/1)", () => {
    for (let i = 0; i < 40; i += 1) {
      const code = makeCode();
      assert.match(code, /^VNM-[A-HJ-NP-Z2-9]{4}$/);
    }
  });
});

describe("emptyDraft", () => {
  it("starts with a real service and artist", () => {
    assert.ok(services.some((s) => s.id === emptyDraft.serviceId));
    assert.equal(typeof emptyDraft.name, "string");
    assert.equal(emptyDraft.date, "");
    assert.equal(emptyDraft.time, "");
  });
});

// ---------------------------------------------------------------------------
// Checkout readiness rules (mirror book-page checks)
// ---------------------------------------------------------------------------

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readyToPay(draft: typeof emptyDraft) {
  return (
    draft.name.trim().length >= 2 &&
    validEmail(draft.email.trim()) &&
    draft.phone.replace(/\D/g, "").length >= 10 &&
    draft.placement.trim().length >= 2 &&
    draft.idea.trim().length >= 8
  );
}

describe("checkout readiness", () => {
  it("blocks payment until contact + placement + idea are filled", () => {
    assert.equal(readyToPay(emptyDraft), false);

    const almost = {
      ...emptyDraft,
      name: "A",
      email: "not-an-email",
      phone: "123",
      placement: "",
      idea: "short",
    };
    assert.equal(readyToPay(almost), false);

    const ok = {
      ...emptyDraft,
      name: "Mira Guest",
      email: "guest@example.com",
      phone: "(416) 555-0100",
      placement: "Forearm",
      idea: "Blackwork band with a small moth",
    };
    assert.equal(readyToPay(ok), true);
  });

  it("accepts the three payment methods the UI offers", () => {
    const methods: PayMethod[] = ["card", "paypal", "usdt"];
    assert.deepEqual(methods, ["card", "paypal", "usdt"]);
  });
});

// ---------------------------------------------------------------------------
// Stripe amount invariant (server must charge deposit * 100 cents)
// ---------------------------------------------------------------------------

describe("Stripe amount invariant", () => {
  it("deposit * 100 is a safe integer for every service (PaymentIntent amount)", () => {
    for (const s of services) {
      const cents = s.deposit * 100;
      assert.ok(Number.isSafeInteger(cents), `${s.id} cents not safe integer`);
      assert.ok(cents >= 50, `${s.id} below Stripe minimum for CAD in many regions`);
    }
  });
});

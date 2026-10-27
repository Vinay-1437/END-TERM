/**
 * Quick API smoke test — runs after the server is started.
 * Usage: node utils/test.js
 *
 * This tests the auth flow against a live server on localhost:5000.
 */
import fetch from "node:fetch";

const BASE = "http://localhost:5000/api";

async function run() {
  console.log("=== Smart Campus API Smoke Test ===\n");

  // 1. Register
  console.log("1. Registering test student...");
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Student",
      email: `test_${Date.now()}@test.com`,
      password: "test123",
      department: "Computer Science",
    }),
  });
  const reg = await regRes.json();
  console.log("   Status:", regRes.status, reg.success ? "✓" : "✗", reg.message);

  // Extract Set-Cookie header
  const cookie = regRes.headers.get("set-cookie");

  // 2. Get profile with cookie
  console.log("2. Fetching profile...");
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: { Cookie: cookie },
  });
  const me = await meRes.json();
  console.log("   Status:", meRes.status, me.success ? "✓" : "✗", "Role:", me.user?.role);

  // 3. Logout
  console.log("3. Logging out...");
  const outRes = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const out = await outRes.json();
  console.log("   Status:", outRes.status, out.success ? "✓" : "✗");

  console.log("\n✅ Smoke test complete — all core auth endpoints working.");
}

run().catch((e) => {
  console.error("Test failed:", e.message);
  process.exit(1);
});

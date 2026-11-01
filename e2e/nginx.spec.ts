import { expect, type Page, test } from "@playwright/test";

/**
 * What only the site's own server does (deploy/nginx.conf), so these run against its image, not
 * `astro preview`:
 *
 *   docker build -t nestor-web . && docker run --rm -p 8080:8080 nestor-web
 *   E2E_NGINX=1 E2E_BASE=http://localhost:8080 pnpm e2e e2e/nginx.spec.ts
 */
test.skip(!process.env.E2E_NGINX, "needs the site's Nginx image (E2E_NGINX=1, E2E_BASE)");

/** An admin not served over HTTPS, as the relay finds it in `state`. */
const CALLBACK = "http://nestor.test:8123/connections/callback";
const encode = (url: string) => Buffer.from(url).toString("base64url");
const STATE = `abc123.${encode(CALLBACK)}`;
const QUERY = `code=the-code&state=${encodeURIComponent(STATE)}`;

/** Answers in place of the admin and returns the requests it received. */
async function admin(page: Page) {
  const seen: { url: string; referer: string | undefined }[] = [];
  await page.route("http://nestor.test:8123/**", async (route) => {
    const request = route.request();
    seen.push({ url: request.url(), referer: request.headers().referer });
    await route.fulfill({ contentType: "text/plain", body: "admin" });
  });
  return seen;
}

for (const path of ["/redirect/oauth", "/redirect/oauth/"]) {
  test(`${path} sends the browser back to the admin with the code and state`, async ({ page }) => {
    const seen = await admin(page);
    await page.goto(`${path}?${QUERY}`);
    await expect(page).toHaveURL(`${CALLBACK}?${QUERY}`);
    expect(seen).toEqual([{ url: `${CALLBACK}?${QUERY}`, referer: undefined }]);
  });
}

test("the relay is served at the exact URL providers have, query untouched", async ({ request }) => {
  const response = await request.get(`/redirect/oauth?${QUERY}`, { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^text\/html/);
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.text()).toContain('src="relay.js"');
  expect((await request.get("/redirect/relay.js")).status()).toBe(200);

  const slash = await request.get(`/redirect/oauth/?${QUERY}`, { maxRedirects: 0 });
  expect(slash.status()).toBe(301);
  expect(slash.headers().location).toBe(`/redirect/oauth?${QUERY}`);
});

test("the relay forwards nowhere but to an admin's callback", async ({ page, request }) => {
  const seen = await admin(page);
  const elsewhere: string[] = [];
  await page.route("https://elsewhere.test/**", async (route) => {
    elsewhere.push(route.request().url());
    await route.fulfill({ body: "elsewhere" });
  });
  const waiting = /<p id="message">([^<]*)<\/p>/.exec(await (await request.get("/redirect/oauth")).text())?.[1];
  expect(waiting).toBeTruthy();
  await page.goto(`/redirect/oauth?code=the-code&state=abc123.${encode("https://elsewhere.test/login")}`);
  // the page says the link leads nowhere and stays put
  await expect(page.locator("#message")).not.toHaveText(waiting ?? "");
  expect(new URL(page.url()).pathname).toBe("/redirect/oauth");
  expect([...seen, ...elsewhere]).toEqual([]);
});

test("a directory redirect keeps the visitor's host and scheme", async ({ request }) => {
  const response = await request.get("/docs", { maxRedirects: 0 });
  expect(response.status()).toBe(301);
  expect(response.headers().location).toBe("/docs/");
});

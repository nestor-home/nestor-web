import { expect, test } from "@playwright/test";

/** The production origin the schemas' `$id`s name. */
const SITE = "https://nestorhome.dev";

test("the protocol's schemas are served where their $id points", async ({ request }) => {
  const path = "/schemas/satellite/2/hello.json";
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/json/);
  expect((await response.json()).$id).toBe(`${SITE}${path}`);
});

test("the developers' page links to a schema that is served", async ({ page, request }) => {
  await page.goto("/developers/");
  const href = await page.locator('a[href^="/schemas/"]').first().getAttribute("href");
  expect(href).toMatch(/^\/schemas\/satellite\/\d+\/manifest\.json$/);
  const schema = await (await request.get(href ?? "")).json();
  expect(schema.$id).toBe(`${SITE}${href}`);
  expect(schema.properties.protocol.const).toBe(`nestor.satellite/${href?.split("/")[3]}`);
});

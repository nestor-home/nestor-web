import type { APIRoute, GetStaticPaths } from "astro";
import { LOCALES, type Locale, translator } from "@/i18n";
import { ditherImage, EMBER, h, INK, INK_MUTED, type Node, PAPER, pngOf, RULE, svgOf, wordmark } from "@/lib/og";

export const getStaticPaths: GetStaticPaths = () => LOCALES.map((locale) => ({ params: { locale } }));

const W = 1200;
const H = 630;

/** The sharing card of a locale: the wordmark, the hero's promise, the dither horizon. */
export const GET: APIRoute = async ({ params }) => {
  const t = translator(params.locale as Locale);
  const title = [t("hero-line-1"), t("hero-line-2"), t("hero-line-3")].join(" ");
  const horizon: Node = {
    type: "img",
    props: {
      src: ditherImage(W, 300, 0, 0.55, "#c4b8a4"),
      width: W,
      height: 300,
      style: { position: "absolute", left: 0, bottom: 0 },
    },
  };
  const card = h(
    "div",
    { width: W, height: H, background: PAPER, flexDirection: "column", position: "relative", padding: "64px 72px" },
    horizon,
    wordmark(44),
    h(
      "div",
      { marginTop: 64, maxWidth: 820, alignItems: "flex-end", flexWrap: "wrap" },
      h("div", { fontFamily: "Fraunces", fontSize: 100, lineHeight: 1, letterSpacing: -3.5, color: INK }, title),
    ),
    h(
      "div",
      {
        position: "absolute",
        left: 72,
        top: H - 110,
        width: W - 144,
        justifyContent: "space-between",
        fontFamily: "IBM Plex Mono",
        fontSize: 22,
        color: INK_MUTED,
        borderTop: `1px solid ${RULE}`,
        paddingTop: 18,
        background: PAPER,
      },
      h("div", {}, "github.com/nestor-home/nestor"),
      h("div", { color: EMBER }, t("status-licence")),
    ),
  );
  const png = pngOf(await svgOf(card, W, H), W);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};

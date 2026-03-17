import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface SeoMetaOptions {
  titleJa: string;
  titleEn?: string;
  titleZh?: string;
  titleKo?: string;
  descriptionJa?: string;
  descriptionEn?: string;
  keywordsJa?: string;
  keywordsEn?: string;
  ogImage?: string;
  ogUrl?: string;
}

const BASE_TITLE = "YumHomeStay";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/og-image-AoesiHCNxNPbgaZVvDJRrc.png";

function setMeta(name: string, content: string, attr = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSeoMeta(options: SeoMetaOptions) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "ja";

  useEffect(() => {
    const titleMap: Record<string, string | undefined> = {
      ja: options.titleJa,
      en: options.titleEn,
      zh: options.titleZh,
      ko: options.titleKo,
    };
    const descMap: Record<string, string | undefined> = {
      ja: options.descriptionJa,
      en: options.descriptionEn,
    };
    const kwMap: Record<string, string | undefined> = {
      ja: options.keywordsJa,
      en: options.keywordsEn,
    };

    const title = titleMap[lang] || titleMap["ja"] || BASE_TITLE;
    const description = descMap[lang] || descMap["ja"] || "";
    const keywords = kwMap[lang] || kwMap["ja"] || "";

    document.title = title;

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, "property");
      setMeta("twitter:description", description);
    }
    if (keywords) {
      setMeta("keywords", keywords);
    }
    setMeta("og:title", title, "property");
    setMeta("twitter:title", title);
    if (options.ogImage) {
      setMeta("og:image", options.ogImage, "property");
      setMeta("twitter:image", options.ogImage);
    } else {
      setMeta("og:image", DEFAULT_OG_IMAGE, "property");
      setMeta("twitter:image", DEFAULT_OG_IMAGE);
    }
    if (options.ogUrl) {
      setMeta("og:url", options.ogUrl, "property");
    }
  }, [lang, options.titleJa, options.titleEn, options.titleZh, options.titleKo]);
}

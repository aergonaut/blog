import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://chrisfung.dev", // replace this with your deployed domain
  author: "Chris Fung",
  desc: "A collection of scattered thoughts, half-formed opinions, and vague ideas.",
  title: "aergonomicon",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/aergonaut",
    linkTitle: "GitHub",
    active: true,
  },
  {
    name: "Bluesky",
    href: "https://bsky.app/profile/aergonaut.com",
    linkTitle: "Bluesky",
    active: true,
  },
  {
    name: "Mastodon",
    href: "https://ruby.social/@aergonaut",
    linkTitle: "Mastodon",
    active: true,
    rel: "me",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/chrisfung",
    linkTitle: "LinkedIn",
    active: true,
  },
];

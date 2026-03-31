// frontend/nuxt.config.ts
import { md3 } from "vuetify/blueprints";

export default defineNuxtConfig({
  compatibilityDate: "2025-04-07",
  devtools: { enabled: true },

  ssr: false,

  modules: ["@nuxtjs/i18n", "vuetify-nuxt-module", "@pinia/nuxt"],

  i18n: {
    defaultLocale: "en",
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "lang",
    },
    compilation: {
      strictMessage: false,
    },
    locales: [
      { code: "en", name: "English" },
      { code: "zhs", name: "简体中文" },
    ],
  },

  vuetify: {
    vuetifyOptions: {
      blueprint: md3,
      defaults: {
        VCard: {
          rounded: "xl",
          variant: "flat",
          border: true,
        },
        VBtn: {
          rounded: "xl",
          class: "text-none font-weight-bold",
        },
        VTextField: {
          variant: "outlined",
          color: "primary",
          rounded: "xl",
        },
        VChip: {
          rounded: "xl",
        },
        VMenu: {
          rounded: "xl",
        },
        VDialog: {
          rounded: "xl",
        },
        VSnackbar: {
          rounded: "xl",
        },
        VAlert: {
          rounded: "xl",
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBase: "https://e164.dn42/api/",
    },
  },

  app: {
    head: {
      title: "e164.dn42",
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["legacy-js-api"],
        },
      },
    },
  },
});

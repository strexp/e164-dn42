import en from "./locales/en.json";
import zhs from "./locales/zhs.json";

import { en as $vuetify_en } from 'vuetify/locale'
import { zhHans as $vuetify_zhs } from 'vuetify/locale'

export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: "en",
    messages: {
      en: {
        ...en,
        $vuetify: $vuetify_en,
      },
      zhs: {
        ...zhs,
        $vuetify: $vuetify_zhs,
      },
    },
  };
});

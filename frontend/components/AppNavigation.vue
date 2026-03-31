<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { useRoute } from "vue-router";
import { computed } from "vue";
import { useTheme } from "vuetify";
import { useI18n } from "vue-i18n";

const authStore = useAuthStore();
const route = useRoute();
const theme = useTheme();
const { t, locale, locales, setLocale } = useI18n();

const toggleTheme = () => {
    theme.global.name.value = theme.global.current.value.dark
        ? "light"
        : "dark";
};

const navItems = computed(() => {
    const items = [
        {
            title: t("nav.publicPhonebook"),
            to: "/phonebook/public",
            icon: "mdi-contacts-outline",
            activeIcon: "mdi-contacts",
        },
    ];

    if (authStore.isLoggedIn) {
        return [
            {
                title: t("nav.nsSettings"),
                to: "/ns-settings",
                icon: "mdi-dns-outline",
                activeIcon: "mdi-dns",
            },
            {
                title: t("nav.myExtensions"),
                to: "/phonebook/personal",
                icon: "mdi-card-account-phone-outline",
                activeIcon: "mdi-card-account-phone",
            },
            ...items,
            {
                title: t("nav.participants"),
                to: "/participants",
                icon: "mdi-account-group-outline",
                activeIcon: "mdi-account-group",
            },
        ];
    }

    return items;
});
</script>

<template>
    <div>
        <v-app-bar
            app
            elevation="0"
            color="surface"
            class="border-b"
            height="76"
        >
            <v-container class="d-flex align-center px-4" max-width="1200">
                <v-app-bar-title
                    class="font-weight-black text-primary mr-8"
                    style="
                        flex: none;
                        width: auto;
                        font-size: 1.6rem;
                        letter-spacing: -0.8px;
                    "
                >
                    <v-btn variant="text" size="xl" to="/" :active="false">
                        e164<span class="text-medium-emphasis">.dn42</span>
                    </v-btn>
                </v-app-bar-title>

                <div class="d-none d-md-flex align-center h-100">
                    <v-btn
                        v-for="item in navItems"
                        :key="item.to"
                        :to="item.to"
                        variant="text"
                        class="text-body-2 px-5 text-none mx-1 font-weight-bold transition-swing"
                        :class="
                            route.path === item.to
                                ? 'text-primary bg-primary-lighten-5'
                                : 'text-medium-emphasis'
                        "
                        rounded="xl"
                        :active="false"
                    >
                        <v-icon
                            start
                            :icon="
                                route.path === item.to
                                    ? item.activeIcon
                                    : item.icon
                            "
                            size="large"
                        ></v-icon>
                        {{ item.title }}
                    </v-btn>
                </div>

                <v-spacer></v-spacer>

                <div class="d-flex align-center">
                    <v-btn
                        icon
                        variant="text"
                        @click="toggleTheme"
                        class="mr-3 text-medium-emphasis"
                    >
                        <v-icon>{{
                            theme.global.current.value.dark
                                ? "mdi-weather-night"
                                : "mdi-weather-sunny"
                        }}</v-icon>
                    </v-btn>

                    <v-menu
                        offset-y
                        transition="slide-y-transition"
                        rounded="xl"
                    >
                        <template #activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon
                                variant="text"
                                class="mr-3 text-medium-emphasis"
                            >
                                <v-icon>mdi-translate</v-icon>
                            </v-btn>
                        </template>
                        <v-card
                            min-width="150"
                            rounded="xl"
                            class="mt-2 border-0 bg-surface"
                        >
                            <v-list bg-color="transparent" class="pa-2" density="compact">
                                <v-list-item
                                    v-for="l in locales"
                                    :key="typeof l === 'string' ? l : l.code"
                                    :value="typeof l === 'string' ? l : l.code"
                                    :active="
                                        locale ===
                                        (typeof l === 'string' ? l : l.code)
                                    "
                                    @click="
                                        setLocale(
                                            typeof l === 'string' ? l : l.code,
                                        )
                                    "
                                    color="primary"
                                    class="rounded-xl mb-1"
                                >
                                    <v-list-item-title
                                        class="font-weight-medium"
                                    >
                                        {{ typeof l === "string" ? l : l.name }}
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </v-menu>

                    <template v-if="authStore.isLoggedIn">
                        <v-menu
                            offset-y
                            transition="slide-y-transition"
                            rounded="xl"
                        >
                            <template #activator="{ props }">
                                <v-btn
                                    v-bind="props"
                                    variant="tonal"
                                    color="primary"
                                    rounded="xl"
                                    class="px-6 font-weight-bold"
                                    height="44"
                                >
                                    <v-icon
                                        start
                                        icon="mdi-account-circle"
                                        size="large"
                                    ></v-icon>
                                    AS{{ authStore.user?.asn }}
                                    <v-icon
                                        end
                                        icon="mdi-chevron-down"
                                        size="small"
                                    ></v-icon>
                                </v-btn>
                            </template>
                            <v-card
                                min-width="260"
                                rounded="xl"
                                class="mt-2 border-0 bg-surface"
                            >
                                <v-list
                                    lines="two"
                                    bg-color="transparent"
                                    class="pa-3"
                                >
                                    <v-list-item
                                        prepend-avatar="https://ui-avatars.com/api/?name=AS&background=random"
                                        :title="$t('nav.asInfo')"
                                        :subtitle="'AS' + authStore.user?.asn"
                                        class="rounded-xl"
                                    ></v-list-item>
                                    <v-divider class="my-3"></v-divider>
                                    <v-list-item
                                        lines="one"
                                        prepend-icon="mdi-logout"
                                        :title="$t('nav.logout')"
                                        @click="authStore.logout()"
                                        class="rounded-xl text-error font-weight-bold transition-swing hover-error"
                                        base-color="error"
                                    ></v-list-item>
                                </v-list>
                            </v-card>
                        </v-menu>
                    </template>
                    <template v-else>
                        <v-btn
                            :active="false"
                            to="/login"
                            variant="flat"
                            color="primary"
                            rounded="xl"
                            class="px-6 font-weight-bold"
                            height="44"
                        >
                            <v-icon
                                start
                                icon="mdi-login"
                                size="large"
                            ></v-icon>
                            {{ $t("nav.login") }}
                        </v-btn>
                    </template>
                </div>
            </v-container>
        </v-app-bar>

        <v-bottom-navigation
            v-if="$vuetify.display.smAndDown"
            grow
            color="primary"
            class="border-t bg-surface"
            elevation="0"
        >
            <v-btn
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :value="item.to"
                class="px-1"
            >
                <v-icon>{{
                    route.path === item.to ? item.activeIcon : item.icon
                }}</v-icon>
                <span
                    class="text-caption mt-1 font-weight-medium"
                    style="font-size: 10px !important"
                >
                    {{ item.title }}
                </span>
            </v-btn>
        </v-bottom-navigation>
    </div>
</template>

<style scoped>
.hover-error:hover {
    background-color: rgba(var(--v-theme-error), 0.1) !important;
}
</style>

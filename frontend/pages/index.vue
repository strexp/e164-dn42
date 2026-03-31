<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { useSnackbar } from "~/composables/useSnackbar";
import { useI18n } from "vue-i18n";

const authStore = useAuthStore();
const { showSnackbar } = useSnackbar();
const { t } = useI18n();

const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        showSnackbar(t('dashboard.copied'), "success");
    } catch (err) {
        showSnackbar(t('dashboard.copyFailed'), "error");
    }
};
</script>

<template>
    <div class="animate-fade-in">
        <div class="mb-10">
            <h1 class="text-h3 font-weight-bold text-primary mb-2">
                {{ $t('dashboard.welcome', { asn: authStore.user?.asn }) }}
            </h1>
            <p class="text-body-1 text-medium-emphasis">
                {{ $t('dashboard.description') }}
            </p>
        </div>

        <NonDN42Alert v-if="!authStore.canWrite" />

        <v-row>
            <v-col cols="12" md="6">
                <v-card class="h-100 bg-primary-lighten-5">
                    <v-card-text class="pa-6">
                        <div class="d-flex align-center mb-4">
                            <v-avatar
                                color="primary"
                                variant="tonal"
                                rounded="xl"
                                class="mr-4"
                            >
                                <v-icon>mdi-pound</v-icon>
                            </v-avatar>
                            <div class="text-h6 font-weight-bold">{{ $t('dashboard.yourPrefix') }}</div>
                        </div>
                        <div
                            class="text-h4 font-weight-black text-primary mt-4 ml-2 text-mono"
                            :class="{ 'text-medium-emphasis': !authStore.user?.prefix }"
                        >
                            {{ authStore.user?.prefix || $t('dashboard.noPrefix') }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6">
                <v-card class="h-100 bg-secondary-lighten-5">
                    <v-card-text class="pa-6">
                        <div class="d-flex align-center mb-4">
                            <v-avatar
                                color="primary"
                                variant="tonal"
                                rounded="xl"
                                class="mr-4"
                            >
                                <v-icon>mdi-dns</v-icon>
                            </v-avatar>
                            <div class="text-h6 font-weight-bold">
                                {{ $t('dashboard.yourE164Zone') }}
                            </div>
                        </div>
                        <div
                            class="d-flex align-center justify-space-between mt-4 bg-surface pa-4 rounded-xl border"
                        >
                            <code
                                class="text-h5 font-weight-medium text-primary text-mono"
                                :class="{ 'text-medium-emphasis': !authStore.user?.e164Zone }"
                            >
                                {{ authStore.user?.e164Zone || 'N/A' }}
                            </code>
                            <v-btn
                                icon
                                variant="tonal"
                                color="primary"
                                size="small"
                                :disabled="!authStore.user?.e164Zone"
                                @click="copyToClipboard(authStore.user?.e164Zone || '')"
                            >
                                <v-icon>mdi-content-copy</v-icon>
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row class="mt-6">
            <v-col cols="12" md="6">
                <v-card
                    to="/ns-settings"
                    class="transition-swing h-100 border bg-surface"
                >
                    <v-card-text class="pa-6 d-flex align-center">
                        <v-avatar
                            color="info"
                            variant="tonal"
                            size="x-large"
                            rounded="lg"
                            class="mr-6"
                        >
                            <v-icon size="x-large">mdi-server-network</v-icon>
                        </v-avatar>
                        <div>
                            <div class="text-h6 font-weight-bold mb-1">
                                {{ $t('dashboard.nsSettings') }}
                            </div>
                            <div class="text-body-2 text-medium-emphasis">
                                {{ $t('dashboard.nsSettingsDesc') }}
                            </div>
                        </div>
                        <v-spacer></v-spacer>
                        <v-icon color="medium-emphasis">mdi-chevron-right</v-icon>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6">
                <v-card
                    to="/phonebook/personal"
                    class="transition-swing h-100 border bg-surface"
                >
                    <v-card-text class="pa-6 d-flex align-center">
                        <v-avatar
                            color="success"
                            variant="tonal"
                            size="x-large"
                            rounded="lg"
                            class="mr-6"
                        >
                            <v-icon size="x-large">mdi-contacts-outline</v-icon>
                        </v-avatar>
                        <div>
                            <div class="text-h6 font-weight-bold mb-1">
                                {{ $t('dashboard.manageExtensions') }}
                            </div>
                            <div class="text-body-2 text-medium-emphasis">
                                {{ $t('dashboard.manageExtensionsDesc') }}
                            </div>
                        </div>
                        <v-spacer></v-spacer>
                        <v-icon color="medium-emphasis">mdi-chevron-right</v-icon>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

<script setup lang="ts">
import type { AuthProvider } from "~/types";

const { $api } = useNuxtApp();
const config = useRuntimeConfig();

const providers = ref<AuthProvider[]>([]);
const loading = ref(true);

onMounted(async () => {
    try {
        providers.value = await $api("/auth/providers");
    } catch (e) {
        console.error("Failed to fetch auth providers", e);
    } finally {
        loading.value = false;
    }
});

const login = (providerId: string) => {
    window.location.href = `${config.public.apiBase}/auth/login/${providerId}`;
};
</script>

<template>
    <div class="animate-fade-in d-flex flex-column align-center justify-center w-100" style="min-height: 70vh">
        <div class="text-center mb-8">
            <v-avatar color="primary" variant="tonal" size="160" class="mb-6">
                <v-icon size="80" color="primary">mdi-phone-classic</v-icon>
            </v-avatar>
            <h1 class="text-h3 font-weight-black text-primary mb-3" style="letter-spacing: -1px">
                {{ $t('auth.login.welcome') }}
            </h1>
            <p class="text-h6 text-medium-emphasis font-weight-regular max-w-md mx-auto">
                {{ $t('auth.login.description') }}
            </p>
        </div>

        <v-card width="100%" max-width="450" class="border" rounded="xl">
            <v-card-text class="pa-8">
                <div v-if="loading" class="d-flex flex-column align-center py-8">
                    <v-progress-circular indeterminate color="primary" size="64" width="6" class="mb-4"></v-progress-circular>
                    <div class="text-body-1 text-medium-emphasis font-weight-medium">
                        {{ $t('auth.login.loading') }}
                    </div>
                </div>
                <div v-else class="d-flex flex-column gap-4">
                    <v-btn
                        v-for="provider in providers"
                        :key="provider.id"
                        block
                        color="primary"
                        size="x-large"
                        variant="outlined"
                        class="mb-4 text-none font-weight-bold transition-swing"
                        @click="login(provider.id)"
                        height="56"
                        prepend-icon="mdi-shield-account"
                    >
                        {{ $t('auth.login.loginWith', { name: provider.name }) }}
                    </v-btn>

                    <v-divider class="my-4"></v-divider>

                    <div class="text-center text-body-2 text-medium-emphasis" v-html="$t('auth.login.terms')"></div>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(15px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

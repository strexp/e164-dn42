<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();
const error = ref(false);

onMounted(() => {
    try {
        const route = useRoute();
        const token = route.query.token as string;
        if (token) {
            authStore.setToken(token);
            navigateTo("/");
        } else {
            error.value = true;
            setTimeout(() => navigateTo("/login"), 2000);
        }
    } catch (e) {
        error.value = true;
        setTimeout(() => navigateTo("/login"), 2000);
    }
});
</script>

<template>
    <div
        class="d-flex flex-column align-center justify-center w-100"
        style="min-height: 70vh"
    >
        <v-card v-if="error" color="error" width="400" rounded="xl">
            <v-card-text class="text-center py-8">
                <v-icon size="64" class="mb-4">mdi-alert-circle-outline</v-icon>
                <div class="text-h6 font-weight-bold">
                    {{ $t("auth.callback.failedTitle") }}
                </div>
                <div class="text-body-1 mt-2">
                    {{ $t("auth.callback.failedDesc") }}
                </div>
            </v-card-text>
        </v-card>
        <v-card v-else width="400" rounded="xl" class="border">
            <v-card-text class="text-center py-10">
                <v-progress-circular
                    indeterminate
                    size="64"
                    color="primary"
                    width="6"
                    class="mb-6"
                ></v-progress-circular>
                <div class="text-h6 font-weight-bold text-primary">
                    {{ $t("auth.callback.loadingTitle") }}
                </div>
                <div class="text-body-2 text-medium-emphasis mt-2">
                    {{ $t("auth.callback.loadingDesc") }}
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

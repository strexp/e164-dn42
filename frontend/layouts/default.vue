<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
const authStore = useAuthStore();
</script>

<template>
    <v-app class="bg-background min-h-screen">
        <AppNavigation />

        <v-main class="d-flex flex-column">
            <div class="flex-grow-1 h-100 d-flex flex-column">
                <v-container class="py-16 px-4 flex-grow-1" max-width="1200">
                    <NuxtPage />
                </v-container>
                <AppFooter />
            </div>
        </v-main>

        <GlobalSnackbar />
    </v-app>
</template>

<style>
html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
.bg-background {
    background-color: rgb(var(--v-theme-background)) !important;
}
.z-index-1 {
    z-index: 1;
}
</style>

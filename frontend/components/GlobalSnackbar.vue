<script setup lang="ts">
import { useSnackbar } from "~/composables/useSnackbar";
const { snackbar } = useSnackbar();
</script>

<template>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
        {{ snackbar.text }}
        <template #actions>
            <v-btn variant="text" color="white" @click="snackbar.show = false">
                {{ $t('snackbar.close') }}
            </v-btn>
        </template>
    </v-snackbar>
</template>

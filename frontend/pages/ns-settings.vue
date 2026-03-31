<script setup lang="ts">
import type { NSConfig } from "~/types";
import { useAuthStore } from "~/stores/auth";
import { useSnackbar } from "~/composables/useSnackbar";
import { useI18n } from "vue-i18n";

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const { showSnackbar } = useSnackbar();
const { t } = useI18n();

const formRef = ref();
const loading = ref(false);
const saving = ref(false);

const config = ref<NSConfig>({
    enabled: false,
    servers: [""],
});

const loadConfig = async () => {
    loading.value = true;
    try {
        const data = await $api("/ns");
        config.value = data as NSConfig;
        while (config.value.servers.length != 1) {
            config.value.servers.push("");
        }
    } catch (e) {
        showSnackbar(t('ns.loadFailed'), "error");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadConfig();
});

const validateNS = (value: string): boolean | string => {
    if (!value) return t('ns.validation.required');
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    const domainPattern = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    const dn42Pattern = /^([a-zA-Z0-9-]+\.)+dn42\.?$/i;

    if (
        ipPattern.test(value) ||
        ipv6Pattern.test(value) ||
        domainPattern.test(value) ||
        dn42Pattern.test(value)
    ) {
        return true;
    }
    return t('ns.validation.invalid');
};

const addNS = () => {
    if (!authStore.canWrite) return;
    if (config.value.servers.length < 4) {
        config.value.servers.push("");
    }
};

const removeNS = (index: number) => {
    if (!authStore.canWrite) return;
    if (config.value.servers.length >= 2) {
        config.value.servers.splice(index, 1);
    }
};

const updateStatus = async (val: any) => {
    if (!authStore.canWrite) return;
    if (typeof val !== "boolean") return;
    config.value.enabled = val;
    try {
        await $api("/ns/status", {
            method: "PATCH",
            body: { enabled: val },
        });
        showSnackbar(val ? t('ns.statusEnabled') : t('ns.statusDisabled'), "success");
    } catch (e: any) {
        config.value.enabled = !val;
        showSnackbar(e?.data?.error || t('ns.statusFailed'), "error");
    }
};

const save = async () => {
    if (!authStore.canWrite) return;
    const { valid } = await formRef.value.validate();
    if (!valid) {
        showSnackbar(t('ns.validation.checkInputs'), "warning");
        return;
    }

    saving.value = true;
    try {
        await $api("/ns", {
            method: "PUT",
            body: {
                enabled: config.value.enabled,
                servers: config.value.servers,
            },
        });
        showSnackbar(t('ns.saveSuccess'), "success");
    } catch (e: any) {
        showSnackbar(e?.data?.error || t('ns.saveFailed'), "error");
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <div class="animate-fade-in">
        <div class="mb-8">
            <h1 class="text-h3 font-weight-bold text-primary mb-2">
                {{ $t('ns.title') }}
            </h1>
            <p class="text-body-1 text-medium-emphasis">
                {{ $t('ns.description') }}
            </p>
        </div>

        <NonDN42Alert v-if="!authStore.canWrite" />

        <div v-if="loading" class="d-flex justify-center py-12">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </div>

        <v-form v-else ref="formRef" @submit.prevent="save">
            <v-card class="mb-6 overflow-hidden border">
                <v-card-text class="pa-6">
                    <div class="d-flex align-center">
                        <div>
                            <div class="text-h6 font-weight-bold">{{ $t('ns.enableService') }}</div>
                            <div class="text-body-2 text-medium-emphasis">
                                {{ $t('ns.enableServiceDesc') }}
                            </div>
                        </div>
                        <v-spacer></v-spacer>
                        <v-switch
                            :model-value="config.enabled"
                            @update:model-value="updateStatus"
                            color="primary"
                            inset
                            hide-details
                            :disabled="!authStore.canWrite"
                        ></v-switch>
                    </div>
                </v-card-text>
            </v-card>

            <v-card class="border">
                <v-card-title class="px-6 pt-6 pb-2 text-h6 font-weight-bold">
                    {{ $t('ns.listTitle') }}
                </v-card-title>
                <v-card-subtitle class="px-6 pb-4 text-medium-emphasis">
                    {{ $t('ns.listSubtitle') }}
                </v-card-subtitle>
                <v-card-text class="px-6 pb-6">
                    <v-row>
                        <v-col
                            cols="12"
                            md="6"
                            v-for="(ns, index) in config.servers"
                            :key="index"
                        >
                            <v-text-field
                                v-model="config.servers[index]"
                                :label="'Name Server ' + (index + 1)"
                                :rules="[validateNS]"
                                variant="outlined"
                                bg-color="surface"
                                prepend-inner-icon="mdi-dns-outline"
                                hide-details="auto"
                                :disabled="!authStore.canWrite"
                            >
                                <template #append-inner>
                                    <v-btn
                                        v-if="
                                            authStore.canWrite &&
                                            config.servers.length >= 2 &&
                                            index >= 1
                                        "
                                        icon="mdi-close-circle"
                                        color="error"
                                        size="small"
                                        variant="text"
                                        @click="removeNS(index)"
                                    ></v-btn>
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>

                    <div
                        class="mt-6 d-flex justify-center"
                        v-if="authStore.canWrite"
                    >
                        <v-btn
                            variant="tonal"
                            color="primary"
                            :disabled="config.servers.length >= 4"
                            @click="addNS"
                            prepend-icon="mdi-plus"
                        >
                            {{ $t('ns.addServer') }}
                        </v-btn>
                    </div>
                </v-card-text>

                <v-divider v-if="authStore.canWrite"></v-divider>

                <v-card-actions
                    class="pa-4 d-flex justify-end"
                    v-if="authStore.canWrite"
                >
                    <v-btn
                        color="primary"
                        variant="flat"
                        size="large"
                        type="submit"
                        :loading="saving"
                        class="px-8"
                    >
                        {{ $t('ns.saveChanges') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>
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

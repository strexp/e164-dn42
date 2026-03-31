<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useSnackbar } from "~/composables/useSnackbar";
import type { PublicEntry } from "~/types";
import { useI18n } from "vue-i18n";

const { $api } = useNuxtApp();
const { showSnackbar } = useSnackbar();
const { t } = useI18n();

const loading = ref(false);
const entries = ref<PublicEntry[]>([]);
const search = ref("");

const config = useRuntimeConfig();

const loadEntries = async () => {
    loading.value = true;
    try {
        entries.value = (await $api("/public/phonebook")) as PublicEntry[];
    } catch (e) {
        console.error("Failed to load public phonebook", e);
    } finally {
        loading.value = false;
    }
};

const download = async (format: "vcf" | "csv") => {
    try {
        const data = await $api(
            `/public/phonebook/download?format=${format}`,
            {
                responseType: "blob",
            },
        );

        const blob = new Blob([data as Blob], {
            type: format === "vcf" ? "text/vcard" : "text/csv",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `e164-phonebook.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSnackbar(t('phonebook.public.downloadSuccess', { format: format === "vcf" ? "vCard" : "CSV" }), "success");
    } catch (e) {
        showSnackbar(t('phonebook.public.downloadFailed'), "error");
    }
};

onMounted(() => {
    loadEntries();
});

const headers = computed(() =>[
    { title: t('phonebook.public.headers.asn'), key: "asn", sortable: true },
    { title: t('phonebook.public.headers.number'), key: "number", sortable: true },
    { title: t('phonebook.public.headers.name'), key: "name", sortable: true },
]);
</script>

<template>
    <div class="animate-fade-in">
        <div class="mb-8">
            <h1 class="text-h3 font-weight-bold text-primary mb-2">
                {{ $t('phonebook.public.title') }}
            </h1>
            <p class="text-body-1 text-medium-emphasis">
                {{ $t('phonebook.public.description') }}
            </p>
        </div>

        <v-alert
            type="info"
            variant="tonal"
            icon="mdi-information-outline"
            border="start"
            class="mb-6 rounded-xl border-0"
        >
            {{ $t('phonebook.public.info') }}
        </v-alert>

        <v-card class="border">
            <v-card-text class="pa-0">
                <div class="d-flex flex-wrap align-center justify-space-between pa-6 bg-surface border-b">
                    <div style="flex: 1; max-width: 400px" class="mr-4">
                        <v-text-field
                            v-model="search"
                            :label="$t('phonebook.public.search')"
                            prepend-inner-icon="mdi-magnify"
                            variant="outlined"
                            hide-details
                            density="compact"
                            bg-color="surface"
                            rounded="lg"
                            clearable
                        ></v-text-field>
                    </div>

                    <div class="d-flex ga-3 mt-4 mt-sm-0">
                        <v-btn
                            color="primary"
                            variant="tonal"
                            @click="download('vcf')"
                            prepend-icon="mdi-card-account-details-outline"
                        >
                            {{ $t('phonebook.public.downloadVcf') }}
                        </v-btn>
                        <v-btn
                            color="primary"
                            variant="tonal"
                            @click="download('csv')"
                            prepend-icon="mdi-file-delimited-outline"
                        >
                            {{ $t('phonebook.public.downloadCsv') }}
                        </v-btn>
                    </div>
                </div>

                <v-data-table
                    :headers="headers"
                    :items="entries"
                    :loading="loading"
                    :search="search"
                    hover
                    class="bg-transparent px-2"
                >
                    <template #item.asn="{ item }">
                        <v-chip variant="text" class="text-medium-emphasis font-weight-bold">
                            AS{{ item.asn }}
                        </v-chip>
                    </template>

                    <template #item.number="{ item }">
                        <span class="text-primary font-weight-medium">
                            <v-icon start color="primary">mdi-phone</v-icon>
                            {{ item.number }}
                        </span>
                    </template>

                    <template #item.name="{ item }">
                        <span class="font-weight-medium">{{ item.name }}</span>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>
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

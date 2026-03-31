<script setup lang="ts">
import type { Participant } from "~/types";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { $api } = useNuxtApp();
const { t } = useI18n();
const loading = ref(true);
const entries = ref<Participant[]>([]);
const search = ref("");

onMounted(async () => {
    try {
        entries.value = (await $api("/user/participants")) as Participant[];
    } catch (e) {
        console.error("Failed to load participants", e);
    } finally {
        loading.value = false;
    }
});

const headers = computed(() =>[
    { title: t('participants.headers.asn'), key: "asn", sortable: true },
    { title: t('participants.headers.prefix'), key: "prefix", sortable: true },
]);
</script>

<template>
    <div class="animate-fade-in">
        <div class="mb-10 text-center text-md-left">
            <h1 class="text-h3 font-weight-black text-primary mb-3" style="letter-spacing: -1px">
                {{ $t('participants.title') }}
            </h1>
            <p class="text-h6 text-medium-emphasis font-weight-regular">
                {{ $t('participants.description') }}
            </p>
        </div>

        <v-card class="border">
            <v-card-text class="pa-0">
                <div class="pa-6 bg-surface border-b d-flex align-center justify-space-between">
                    <div style="flex: 1; max-width: 400px">
                        <v-text-field
                            v-model="search"
                            :label="$t('participants.search')"
                            prepend-inner-icon="mdi-magnify"
                            variant="outlined"
                            hide-details
                            density="compact"
                            bg-color="surface"
                            rounded="lg"
                            clearable
                        ></v-text-field>
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

                    <template #item.prefix="{ item }">
                        <v-chip variant="text" class="font-weight-medium">
                            {{ item.prefix || "N/A" }}
                        </v-chip>
                    </template>
                </v-data-table>
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

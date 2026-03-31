<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import type { PhoneEntry } from "~/types";
import { useAuthStore } from "~/stores/auth";
import { useSnackbar } from "~/composables/useSnackbar";
import { useI18n } from "vue-i18n";

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const { showSnackbar } = useSnackbar();
const { t } = useI18n();

const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const deleting = ref(false);

const entries = ref<PhoneEntry[]>([]);
const deletingEntry = ref<PhoneEntry | null>(null);

const loadEntries = async () => {
    loading.value = true;
    try {
        entries.value = (await $api("/phonebook/me")) as PhoneEntry[];
    } catch (e) {
        console.error("Failed to load phonebook", e);
    } finally {
        loading.value = false;
    }
};

const confirmDelete = (entry: PhoneEntry) => {
    deletingEntry.value = entry;
    deleteDialog.value = true;
};

const deleteEntry = async () => {
    if (!deletingEntry.value) return;
    deleting.value = true;
    try {
        await $api(`/phonebook/me/${deletingEntry.value.id}`, {
            method: "DELETE",
        });
        showSnackbar(t('phonebook.personal.deleteSuccess'), "success");
        deleteDialog.value = false;
        await loadEntries();
    } catch (e: any) {
        showSnackbar(e?.data?.error || t('phonebook.personal.deleteFailed'), "error");
    } finally {
        deleting.value = false;
    }
};

onMounted(() => {
    loadEntries();
});

const headers = computed(() => {
    const cols: any =[
        {
            title: t('phonebook.personal.headers.number'),
            key: "number",
            sortable: false,
            width: "40%",
        },
        {
            title: t('phonebook.personal.headers.name'),
            key: "name",
            sortable: false,
            width: "40%",
        },
    ];
    if (authStore.canWrite) {
        cols.push({
            title: t('phonebook.personal.headers.actions'),
            key: "actions",
            sortable: false,
            align: "end" as const,
        });
    }
    return cols;
});
</script>

<template>
    <div class="animate-fade-in">
        <div class="mb-8 d-flex align-center justify-space-between flex-wrap ga-4">
            <div>
                <h1 class="text-h3 font-weight-bold text-primary mb-2">
                    {{ $t('phonebook.personal.title') }}
                    <span class="text-h5 text-medium-emphasis">({{ entries.length }}/20)</span>
                </h1>
                <p class="text-body-1 text-medium-emphasis">
                    {{ $t('phonebook.personal.description') }}
                </p>
            </div>
            <v-btn
                v-if="authStore.canWrite"
                color="primary"
                variant="flat"
                size="large"
                @click="dialog = true"
                prepend-icon="mdi-plus"
                :disabled="entries.length >= 20"
            >
                {{ $t('phonebook.personal.addBtn') }}
            </v-btn>
        </div>

        <NonDN42Alert v-if="!authStore.canWrite" />

        <v-card class="border">
            <v-data-table
                :headers="headers"
                :items="entries"
                :loading="loading"
                hide-default-footer
                hover
                class="bg-transparent"
            >
                <template #loading>
                    <v-skeleton-loader type="table-row@3"></v-skeleton-loader>
                </template>
                <template #no-data>
                    <div class="py-12 text-center text-medium-emphasis">
                        <v-icon size="64" class="mb-4" color="grey-lighten-2">mdi-phone-outline</v-icon>
                        <div class="text-h6">{{ $t('phonebook.personal.noData') }}</div>
                        <div class="text-body-2" v-if="authStore.canWrite">
                            {{ $t('phonebook.personal.noDataHint') }}
                        </div>
                    </div>
                </template>
                <template #item.number="{ item }">
                    <v-chip color="primary" variant="tonal" class="font-weight-medium">
                        <v-icon start size="small">mdi-phone</v-icon>
                        {{ item.number }}
                    </v-chip>
                </template>
                <template #item.name="{ item }">
                    <span class="font-weight-medium">{{ item.name }}</span>
                </template>
                <template #item.actions="{ item }">
                    <v-btn
                        icon="mdi-delete-outline"
                        size="small"
                        variant="tonal"
                        color="error"
                        @click="confirmDelete(item)"
                    ></v-btn>
                </template>
            </v-data-table>
        </v-card>

        <PhonebookAddDialog v-model="dialog" @saved="loadEntries" />

        <ConfirmDialog
            v-model="deleteDialog"
            :title="$t('phonebook.personal.deleteConfirmTitle')"
            :confirmText="$t('phonebook.personal.deleteConfirmBtn')"
            :loading="deleting"
            @confirm="deleteEntry"
        >
            <span v-html="$t('phonebook.personal.deleteConfirmText', { number: deletingEntry?.number, name: deletingEntry?.name })"></span>
        </ConfirmDialog>
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

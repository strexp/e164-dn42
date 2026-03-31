<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useSnackbar } from '~/composables/useSnackbar';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const { showSnackbar } = useSnackbar();
const { t } = useI18n();

const dialogFormRef = ref();
const saving = ref(false);

const newEntry = ref({
  extension: '',
  name: '',
});

const maxExtensionLength = computed(() => 15 - (authStore.user?.prefix?.length || 8));

watch(() => props.modelValue, (val) => {
  if (val) {
    newEntry.value = { extension: '', name: '' };
    if (dialogFormRef.value) dialogFormRef.value.resetValidation();
  }
});

const close = () => {
  emit('update:modelValue', false);
};

const saveEntry = async () => {
  const { valid } = await dialogFormRef.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const fullNumber = `${authStore.user?.prefix}${newEntry.value.extension}`;
    const data = { number: fullNumber, name: newEntry.value.name };
    await $api('/phonebook/me', { method: 'POST', body: data });
    showSnackbar(t('phonebook.add.success'), 'success');
    emit('saved');
    close();
  } catch (e: any) {
    showSnackbar(e?.data?.error || t('phonebook.add.failed'), 'error');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="500" persistent>
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-2 text-h5 font-weight-bold">
        {{ $t('phonebook.add.title') }}
      </v-card-title>
      <v-card-text class="px-6">
        <v-form ref="dialogFormRef" @submit.prevent="saveEntry">
          <div class="text-body-2 text-medium-emphasis mb-6" v-html="$t('phonebook.add.description', { prefix: authStore.user?.prefix })">
          </div>
          <v-text-field
            v-model="newEntry.extension"
            :prefix="authStore.user?.prefix"
            :label="$t('phonebook.add.suffixLabel')"
            :placeholder="$t('phonebook.add.suffixPlaceholder')"
            variant="outlined"
            bg-color="surface"
            class="mb-4"
            :maxlength="maxExtensionLength"
            :rules="[
                v => !!v || $t('phonebook.add.rules.suffixRequired'), 
                v => /^\d+$/.test(v) || $t('phonebook.add.rules.suffixDigits'),
                v => v.length <= maxExtensionLength || $t('phonebook.add.rules.suffixMax', { max: maxExtensionLength })
            ]"
          ></v-text-field>
          <v-text-field
            v-model="newEntry.name"
            :label="$t('phonebook.add.nameLabel')"
            :placeholder="$t('phonebook.add.namePlaceholder')"
            variant="outlined"
            bg-color="surface"
            :maxlength="50"
            :rules="[
                v => !!v || $t('phonebook.add.rules.nameRequired'),
                v => v.length <= 50 || $t('phonebook.add.rules.nameMax')
            ]"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-6 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" color="medium-emphasis" @click="close" class="px-4">{{ $t('phonebook.add.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="saveEntry" class="px-6">{{ $t('phonebook.add.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

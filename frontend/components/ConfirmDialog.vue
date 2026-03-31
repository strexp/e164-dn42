<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="400">
    <v-card rounded="xl">
      <v-card-text class="pa-6 text-center">
        <v-avatar color="error" variant="tonal" size="x-large" class="mb-4">
          <v-icon size="x-large">mdi-alert</v-icon>
        </v-avatar>
        <h3 class="text-h6 font-weight-bold mb-2">{{ title }}</h3>
        <p class="text-body-2 text-medium-emphasis mb-6">
          <slot></slot>
        </p>
        <v-row dense>
          <v-col cols="6">
            <v-btn block variant="tonal" color="medium-emphasis" @click="emit('update:modelValue', false)">
              {{ cancelText || $t('dialog.cancel') }}
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn block color="error" variant="flat" :loading="loading" @click="emit('confirm')">
              {{ confirmText || $t('dialog.confirm') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

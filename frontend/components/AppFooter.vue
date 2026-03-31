<template>
    <v-footer
        class="bg-surface border-t d-flex flex-column pa-6 mt-8"
        style="flex: none"
    >
        <v-container
            class="px-0 py-2 d-flex flex-column flex-md-row align-center justify-space-between w-100"
            max-width="1200"
        >
            <div class="d-flex align-center mb-4 mb-md-0">
                <v-avatar
                    color="primary"
                    variant="tonal"
                    size="small"
                    class="mr-3"
                >
                    <v-icon size="small">mdi-phone-classic</v-icon>
                </v-avatar>
                <span class="text-h6 font-weight-black text-primary"
                    >{{ $t('footer.title') }}</span
                >
            </div>

            <div
                class="text-body-2 text-medium-emphasis text-center text-md-right font-weight-medium"
            >
                {{ $t('footer.madeWith') }}
                <v-icon color="error" size="small" class="mx-1"
                    >mdi-heart</v-icon
                >
                {{ $t('footer.forDN42') }}
                <br />
                {{ $t('footer.copyright', { year: new Date().getFullYear() }) }}
            </div>
        </v-container>
    </v-footer>
</template>

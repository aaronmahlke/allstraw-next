<script setup lang="ts">
type Props = {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

const {
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false
} = defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const isOpen = computed({
  get: () => open,
  set: (value) => {
    if (!value) {
      emit("close")
    }
  }
})

function confirm() {
  emit("confirm")
}
</script>

<template>
  <DModal
    v-model:open="isOpen"
  >
    <DModalContent>
      <DModalHeader>
        <DModalTitle>
          {{ title }}
        </DModalTitle>
        <DModalDescription v-if="description">
          {{ description }}
        </DModalDescription>
      </DModalHeader>

      <div
        v-if="!description && $slots.default"
        class="px-6 py-4"
      >
        <slot />
      </div>
      <slot v-else />

      <DModalFooter v-slot="{ close }">
        <DButton
          variant="secondary"
          @click="close"
        >
          {{ cancelText }}
        </DButton>
        <DButton
          :variant="danger ? 'danger' : 'primary'"
          @click="confirm"
        >
          {{ confirmText }}
        </DButton>
      </DModalFooter>
    </DModalContent>
  </DModal>
</template>

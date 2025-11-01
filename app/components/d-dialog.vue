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

function close() {
  emit("close")
}

function confirm() {
  emit("confirm")
}
</script>

<template>
  <DModal
    :open="open"
    :title="title"
    :description="description"
    :confirm-text="confirmText"
    :danger="danger"
    @close="close"
    @confirm="confirm"
  >
    <div
      v-if="!description"
      class="px-6 py-4"
    >
      <slot></slot>
    </div>
  </DModal>
</template>

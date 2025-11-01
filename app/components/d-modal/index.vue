<script setup lang="ts">
import {
  DialogOverlay,
  DialogPortal,
  DialogRoot
} from "reka-ui"

type Props = {
  open: boolean
}

const { open } = defineProps<Props>()

const emit = defineEmits<{
  "update:open": [value: boolean]
}>()

function handleUpdate(open: boolean) {
  emit("update:open", open)
}

const { registerModal, unregisterModal, modalStackCount } = useModal()

const currentLevel = ref(-1)

watch(() => open, (isOpen) => {
  if (isOpen) {
    currentLevel.value = registerModal()
  } else {
    unregisterModal()
    currentLevel.value = -1
  }
}, { immediate: true })

const maxLevel = computed(() => modalStackCount.value - 1)

const hasNestedDialog = computed(() => {
  if (!open || currentLevel.value === -1) return false
  return currentLevel.value < maxLevel.value
})

const close = () => handleUpdate(false)
provide("modal-close", close)
provide("modal-level", computed(() => currentLevel.value))
provide("modal-stack-count", modalStackCount)

const overlayZIndex = computed(() => {
  const level = currentLevel.value
  if (level === 0) return 20
  const parentContentZ = 30 + ((level - 1) * 10)
  return parentContentZ + 5
})
</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="handleUpdate"
    :data-nested-dialog-open="hasNestedDialog"
  >
    <DialogPortal>
      <DialogOverlay
        :class="`data-[state=open]:animate-overlayShow bg-neutral-inverse/5 pointer-events-none fixed inset-0 backdrop-blur-xs`"
        :style="{ zIndex: overlayZIndex }"
      />
      <slot />
    </DialogPortal>
  </DialogRoot>
</template>


<script setup lang="ts">
import { DialogContent } from "reka-ui"

type Props = {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
}

const { size = "md" } = defineProps<Props>()

const modalLevel = inject<ComputedRef<number> | number>("modal-level", 0)

const level = computed(() => typeof modalLevel === 'number' ? modalLevel : modalLevel.value)

const contentZIndex = computed(() => 30 + (level.value * 10))

const modalStyle = computed(() => ({
  zIndex: contentZIndex.value
}))


const sizeClasses: { [key: string]: string } = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl"
}
</script>

<template>
  <DialogContent
    :class="[
      'data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg outline-none transition-transform duration-200',
      sizeClasses[size]
    ]"
    :style="modalStyle"
    :data-modal-level="level"
  >
    <slot />
  </DialogContent>
</template>


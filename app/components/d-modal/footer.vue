<script setup lang="ts">
const slots = useSlots()

// Get close function from useModal composable
const { close } = useModal()

// Expose close function via slot props
const slotProps = {
  close
}
</script>

<template>
  <div v-if="slots.default" class="flex justify-end space-x-2 rounded-b p-4">
    <slot v-bind="slotProps" />
  </div>
</template>


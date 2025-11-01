<script setup lang="ts">
type Props = {
  name: string
  to: string
}
defineProps<Props>()
</script>
<template>
  <NuxtLink
    :to="to"
    class="text-neutral-subtle hover:text-neutral hover:bg-neutral-subtle text-copy block rounded-lg px-3 py-2"
    active-class="bg-neutral-subtle text-neutral font-medium"
  >
    {{ name }}
  </NuxtLink>
</template>

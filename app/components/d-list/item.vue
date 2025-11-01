<script setup lang="ts">
import { NuxtLink } from "#components"

type Props = {
  to?: string
  padding?: boolean
  minHeight?: boolean
  hover?: boolean
}

const { to = undefined, padding = true, minHeight = true, hover = true } = defineProps<Props>()

const component = computed(() => {
  return to ? NuxtLink : "div"
})
</script>
<template>
  <component
    :is="component"
    class="group border-neutral flex border-b bg-white last:border-transparent"
    :class="[
      padding ? 'px-4 py-3' : '',
      hover ? 'hover:bg-neutral-hover' : '',
      minHeight ? 'min-h-14' : ''
    ]"
    :to="to"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { LoaderCircleIcon } from "lucide-vue-next"
import { NuxtLink } from "#components"
import { refDebounced } from "@vueuse/core"

const slots = useSlots()

type Props = {
  variant?: "primary" | "secondary" | "transparent" | "danger"
  leadingIcon?: Component
  trailingIcon?: Component
  to?: "string"
  size?: "xs" | "sm" | "md"
  type?: "submit" | "button"
  loading?: boolean
  disabled?: boolean
}

const props = defineProps<Props>()
const { variant = "primary", size = "md", type = "button", loading = false } = props

const variantClasses: { [key: string]: string } = {
  primary: "bg-surface text-neutral hover:bg-surface-subtle border border-neutral shadow-xs",
  secondary:
    "bg-neutral-subtle text-neutral hover:bg-neutral-strong active:bg-neutral border border-transparent",
  transparent:
    "text-neutral-subtle hover:bg-surface-subtle active:bg-surface-strong border border-transparent",
  danger: "bg-danger text-danger-onsurface hover:bg-danger-hover border border-danger shadow-xs"
}

const paddingClasses: { [key: string]: string } = {
  xs: "px-2",
  sm: "px-3",
  md: "px-3"
}

const heightClasses: { [key: string]: string } = {
  xs: "h-6",
  sm: "h-7",
  md: "h-8"
}

const widthClasses: { [key: string]: string } = {
  xs: "w-5",
  sm: "w-7",
  md: "w-8"
}

const sizeClass = computed(() => {
  if (slots.default) {
    return [paddingClasses[size], heightClasses[size]]
  } else {
    return [heightClasses[size], widthClasses[size]]
  }
})

const isLoading = refDebounced(toRef(props, "loading"), 100)
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :type
    :to
    class="relative shrink-0 cursor-default gap-2 rounded-lg text-sm whitespace-pre ring-blue-600 outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2"
    :class="[sizeClass, variantClasses[variant], disabled ? 'pointer-events-none opacity-50' : '']"
    :disabled
  >
    <div
      :class="{ 'opacity-0': isLoading }"
      class="flex items-center justify-center"
    >
      <component
        v-if="leadingIcon"
        :is="leadingIcon"
        class="size-4"
      />
      <slot name="leading"></slot>
      <div
        v-if="$slots.default"
        class="inline"
      >
        <slot></slot>
      </div>
      <slot name="trailing"></slot>
      <component
        v-if="trailingIcon"
        :is="trailingIcon"
        class="size-4"
      />
    </div>
    <div
      v-if="isLoading"
      class="absolute inset-0 grid place-items-center"
    >
      <LoaderCircleIcon class="size-5 animate-spin" />
    </div>
  </component>
</template>

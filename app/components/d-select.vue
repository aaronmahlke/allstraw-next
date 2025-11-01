<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectGroup
} from "reka-ui"
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from "lucide-vue-next"

interface Props {
  options: { value: string | number | boolean | null; label: string }[]
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
}

const { options, placeholder, disabled, multiple } = defineProps<Props>()
const model = defineModel<string | number | boolean | null | (string | number | boolean)[]>()
const open = ref(false)

const isMultiSelect = computed(() => multiple === true)
</script>

<template>
  <SelectRoot
    v-model="model"
    :open="open"
    @update:open="open = $event"
    :multiple="isMultiSelect"
  >
    <SelectTrigger
      :disabled="disabled"
      class="bg-neutral border-neutral hover: flex h-9 w-full cursor-default items-center justify-between rounded-lg border px-2.5 text-sm outline-none select-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-300"
      :class="[
        disabled ? 'cursor-not-allowed bg-neutral-100 opacity-50' : 'hover:border-neutral-strong/30'
      ]"
    >
      <SelectValue :placeholder="placeholder">
        <template v-if="isMultiSelect && Array.isArray(model) && model.length > 0">
          {{ model.map((val) => options.find((o) => o.value === val)?.label).join(", ") }}
        </template>
      </SelectValue>
      <div>
        <ChevronDownIcon
          v-if="!open"
          class="ml-2 size-4 text-neutral-700"
        />
        <ChevronUpIcon
          v-else
          class="ml-2 size-4 text-neutral-700"
        />
      </div>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        side="bottom"
        align="start"
        class="border-neutral z-[9999] w-[var(--reka-select-trigger-width)] rounded-lg border bg-white shadow-sm"
        :side-offset="5"
        ref="selectContentRef"
      >
        <SelectViewport class="max-h-48 overflow-auto p-1">
          <SelectGroup>
            <SelectItem
              v-for="option in options"
              :key="String(option.value)"
              :value="option.value"
              class="hover:bg-neutral-hover focus:bg-neutral-hover flex cursor-default items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-neutral-900 select-none focus:outline-0"
            >
              <SelectItemText>
                {{ option.label }}
              </SelectItemText>
              <SelectItemIndicator>
                <CheckIcon class="ml-2 size-4" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectGroup>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

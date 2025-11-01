<script setup lang="ts">
import { ChevronDownIcon, ChevronRightIcon } from "lucide-vue-next"

interface Option {
  name: string
  values: string[]
}
interface Variant {
  id: string | number
  options: Record<string, string>
  price?: number | null
  inventory?: number | null
}

type Props = {
  options: Option[]
  variants: Variant[]
  priceIndicator?: string
}

const props = withDefaults(defineProps<Props>(), {
  priceIndicator: "EUR"
})

const emit = defineEmits<{
  (
    e: "update:variant",
    payload: { variantId: string; field: "price" | "inventory"; value: number | null }
  ): void
  (
    e: "update:group",
    payload: {
      groupValue: string
      groupingOption: string
      field: "price" | "inventory"
      value: number | null
    }
  ): void
}>()

const groupByOptionName = ref<string | null>(null)
const expandedGroups = ref<Set<string>>(new Set())
const isSingleOption = computed(() => props.options.length <= 1)
const groupByOptionsForSelect = computed(() =>
  props.options.map((opt) => ({ value: opt.name, label: opt.name }))
)

const groupedVariants = computed(() => {
  console.log("[List] Recomputing groupedVariants")
  if (isSingleOption.value || !groupByOptionName.value || props.variants.length === 0) return []
  const groupMap = new Map<string, Variant[]>()
  const groupByKey = groupByOptionName.value
  props.variants.forEach((variant) => {
    const groupValue = variant.options[groupByKey]
    if (!groupMap.has(groupValue)) groupMap.set(groupValue, [])
    groupMap.get(groupValue)?.push(variant)
  })
  const groupOption = props.options.find((opt) => opt.name === groupByKey)
  const sortedGroupValues = groupOption ? groupOption.values : Array.from(groupMap.keys())
  const result = sortedGroupValues
    .filter((value) => groupMap.has(value))
    .map((value) => ({ groupValue: value, variants: groupMap.get(value)! }))
  return result
})

// --- Watchers ---
watch(
  () => props.options,
  (newOptions) => {
    console.log("[List] Options prop changed:", newOptions)
    if (
      newOptions &&
      newOptions.length > 0 &&
      (!groupByOptionName.value || !newOptions.find((opt) => opt.name === groupByOptionName.value))
    ) {
      groupByOptionName.value = newOptions[0]?.name || null
      console.log("[List] GroupBy set to:", groupByOptionName.value)
    } else if (newOptions.length === 0) {
      groupByOptionName.value = null
      console.log("[List] GroupBy cleared (no options)")
    }
  },
  { immediate: true, deep: true }
)
watch(groupByOptionName, (newVal, oldVal) => {
  console.log(`[List] GroupBy changed from ${oldVal} to ${newVal}, clearing expansion.`)
  expandedGroups.value.clear()
})

// --- Methods ---
function toggleGroup(groupValue: string) {
  console.log("[List] Toggling group:", groupValue)
  if (isSingleOption.value) return
  expandedGroups.value.has(groupValue)
    ? expandedGroups.value.delete(groupValue)
    : expandedGroups.value.add(groupValue)
}
function isExpanded(groupValue: string): boolean {
  return isSingleOption.value || expandedGroups.value.has(groupValue)
}
function getVariantDisplayName(variant: Variant): string {
  if (isSingleOption.value) {
    const o = props.options[0]?.name
    return o ? variant.options[o] : "V"
  }
  if (!groupByOptionName.value) return "V"
  const r = props.options.map((o) => o.name).filter((n) => n !== groupByOptionName.value)
  return r.map((n) => variant.options[n]).join(" / ") || "V"
}

function handleVariantInput(
  variantId: string | number,
  field: "price" | "inventory",
  event: Event
) {
  console.log(`[List] handleVariantInput: variantId=${variantId}, field=${field}`)
  const target = event.target as HTMLInputElement
  let value: number | null =
    field === "price" ? parseFloat(target.value) : parseInt(target.value, 10)
  if (isNaN(value) || target.value.trim() === "") value = null
  else if (field === "inventory" && value < 0) {
    value = 0
    target.value = "0"
  }
  const payload = { variantId: String(variantId), field, value }
  console.log("[List] Emitting update:variant:", payload)
  emit("update:variant", payload)
}
function handleGroupInput(groupValue: string, field: "price" | "inventory", event: Event) {
  console.log(`[List] handleGroupInput: groupValue=${groupValue}, field=${field}`)
  if (!groupByOptionName.value) {
    console.warn("[List] Cannot handle group input without groupByOptionName set.")
    return
  }
  const target = event.target as HTMLInputElement
  let value: number | null =
    field === "price" ? parseFloat(target.value) : parseInt(target.value, 10)
  if (isNaN(value) || target.value.trim() === "") value = null
  else if (field === "inventory" && value < 0) {
    value = 0
    target.value = "0"
  }
  const payload = { groupValue, groupingOption: groupByOptionName.value, field, value }
  console.log("[List] Emitting update:group:", payload)
  emit("update:group", payload)
}

// --- Get Value for Group Input Binding ---
// Determines the ACTUAL value shown in the input field
function getGroupInputValue(groupVariants: Variant[], field: "price" | "inventory"): number | null {
  console.log(`[List] Computing getGroupInputValue for field: ${field}`)
  if (groupVariants.length === 0) return null

  const firstValue = groupVariants[0][field]
  const allSame = groupVariants.every((v) => v[field] === firstValue)

  if (allSame && firstValue !== null && firstValue !== undefined) {
    console.log(`[List] getGroupInputValue(${field}): All variants same: ${firstValue}`)
    if (typeof firstValue === "number") {
      return firstValue
    } else {
      const num = Number(firstValue)
      return isNaN(num) ? null : num
    }
  } else {
    console.log(
      `[List] getGroupInputValue(${field}): Values differ or are null/undefined, returning null`
    )
    return null
  }
}

// --- Get Placeholder for Group Input ---
function getGroupInputPlaceholder(groupVariants: Variant[], field: "price" | "inventory"): string {
  console.log(`[List] Computing getGroupInputPlaceholder for field: ${field}`)
  const allNumericValues = groupVariants
    .map((v) => v[field])
    .filter((val) => val !== null && val !== undefined && !isNaN(Number(val))) as number[] // Ensure numbers

  if (allNumericValues.length === 0) {
    return field === "price" ? "Price" : "Inv."
  }

  const uniqueValues = new Set(allNumericValues)

  if (uniqueValues.size > 1) {
    if (field === "price") {
      // Price: Show range
      const min = Math.min(...allNumericValues)
      const max = Math.max(...allNumericValues)
      const placeholder = `$${min.toFixed(2)} – $${max.toFixed(2)}`
      console.log(
        `[List] getGroupInputPlaceholder(${field}): Multiple values, range: ${placeholder}`
      )
      return placeholder
    } else {
      // Inventory: Show sum
      const sum = allNumericValues.reduce((acc, val) => acc + val, 0)
      const placeholder = `${sum} Available`
      console.log(`[List] getGroupInputPlaceholder(${field}): Multiple values, sum: ${placeholder}`)
      return placeholder
    }
  } else if (uniqueValues.size === 1) {
    const singleValue = allNumericValues[0]
    const placeholder = field === "price" ? `$${singleValue?.toFixed(2)}` : `${singleValue}`
    console.log(`[List] getGroupInputPlaceholder(${field}): Single value: ${placeholder}`)
    return placeholder
  } else {
    return field === "price" ? "Price" : "Inv."
  }
}
</script>

<template>
  <div class="space-y-4">
    <div
      class="flex items-center justify-between gap-2"
      v-if="!isSingleOption && options.length > 1"
    >
      <p class="text-copy-sm text-neutral-subtle whitespace-nowrap">Group by:</p>
      <div class="w-40">
        <DSelect
          v-model="groupByOptionName"
          :options="groupByOptionsForSelect"
          placeholder="Select option"
        />
      </div>
    </div>

    <DList v-if="variants.length > 0">
      <template v-if="isSingleOption">
        <DListItem
          v-for="variant in variants"
          :key="variant.id"
          :padding="false"
          class="bg-neutral-weak hover:bg-neutral-subtle"
        >
          <div class="flex w-full items-center gap-4 px-4 py-2">
            <span class="text-copy text-neutral min-w-0 flex-1 truncate">
              {{ getVariantDisplayName(variant) }}
            </span>
            <DInput
              type="number"
              step="0.01"
              placeholder="Price"
              :trailing="priceIndicator"
              class="!h-8 w-60 text-right"
              :model-value="variant.price as number"
              @change="handleVariantInput(variant.id, 'price', $event)"
              title="Enter Price"
            />
            <DInput
              type="number"
              step="1"
              :min="0"
              placeholder="Inv."
              class="!h-8 w-20 text-right"
              :model-value="variant.inventory as number"
              @change="handleVariantInput(variant.id, 'inventory', $event)"
              title="Enter Inventory"
            />
          </div>
        </DListItem>
      </template>

      <!-- Case 2: Multiple Options -->
      <template v-else>
        <template
          v-for="group in groupedVariants"
          :key="group.groupValue"
        >
          <!-- Group Header -->
          <DListItem
            :padding="false"
            class="hover:bg-neutral-subtle !min-h-12 items-center"
          >
            <div class="flex w-full items-center gap-4 px-4 py-2">
              <div
                class="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                @click="toggleGroup(group.groupValue)"
              >
                <component
                  :is="isExpanded(group.groupValue) ? ChevronDownIcon : ChevronRightIcon"
                  class="text-neutral-weak size-4 flex-shrink-0"
                />
                <span
                  class="text-copy text-neutral truncate font-medium"
                  :title="group.groupValue"
                >
                  {{ group.groupValue }}
                </span>
                <span class="text-copy-sm text-neutral-subtle flex-shrink-0">
                  ({{ group.variants.length }})
                </span>
              </div>
              <DInput
                type="number"
                step="0.01"
                :placeholder="getGroupInputPlaceholder(group.variants, 'price')"
                :trailing="priceIndicator"
                class="!h-8 w-60 text-right"
                :model-value="getGroupInputValue(group.variants, 'price') as number"
                @change="handleGroupInput(group.groupValue, 'price', $event)"
                :key="`group-price-input-${group.groupValue}-${groupByOptionName}`"
              />
              <DInput
                type="number"
                step="1"
                :min="0"
                :placeholder="getGroupInputPlaceholder(group.variants, 'inventory')"
                class="!h-8 w-20 text-right"
                :model-value="getGroupInputValue(group.variants, 'inventory') as number"
                @change="handleGroupInput(group.groupValue, 'inventory', $event)"
                :key="`group-inv-input-${group.groupValue}-${groupByOptionName}`"
              />
            </div>
          </DListItem>

          <!-- Expanded Variants within Group -->
          <template v-if="isExpanded(group.groupValue)">
            <DListItem
              v-for="variant in group.variants"
              :key="variant.id"
              :padding="false"
              class="border-neutral-subtle bg-neutral-weak hover:bg-neutral-subtle !border-t"
            >
              <div class="flex w-full items-center gap-4 py-2 pr-4 pl-10">
                <span class="text-copy text-neutral min-w-0 flex-1 truncate">
                  {{ getVariantDisplayName(variant) }}
                </span>
                <DInput
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  :trailing="priceIndicator"
                  class="!h-8 w-60 text-right"
                  :model-value="variant.price as number"
                  @change="handleVariantInput(variant.id, 'price', $event)"
                  title="Enter Price"
                />
                <DInput
                  type="number"
                  step="1"
                  :min="0"
                  placeholder="Inv."
                  class="!h-8 w-20 text-right"
                  :model-value="variant.inventory as number"
                  @change="handleVariantInput(variant.id, 'inventory', $event)"
                  title="Enter Inventory"
                />
              </div>
            </DListItem>
          </template>
        </template>
      </template>
    </DList>

    <!-- Empty State -->
    <div
      v-else
      class="text-neutral-subtle py-4 text-center"
    >
      Define options and values to generate variants.
    </div>
  </div>
</template>

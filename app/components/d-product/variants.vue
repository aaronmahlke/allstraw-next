<script setup lang="ts">
import { ChevronDownIcon, ChevronRightIcon } from "lucide-vue-next"
import type { DCompositeOption, DProductVariant } from "~/types/models"

type Props = {
  variants: DProductVariant[]
  options: DCompositeOption[]
  unitOptions: { value: string; label: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits(["update:variants"])

const expandedGroups = ref(new Set<string>())
const selectedGroupOptionId = ref<string | null>(null)

const groupingOptions = computed(() => props.options.map((o) => ({ value: o.id, label: o.name })))

watchEffect(() => {
  const options = props.options
  if (options.length && !selectedGroupOptionId.value) {
    selectedGroupOptionId.value = options[0].id
  }
})

const selectedGroupOption = computed(() =>
  props.options.find((o) => o.id === selectedGroupOptionId.value)
)

const groupedVariants = computed(() => {
  console.log(selectedGroupOption.value)
  if (!selectedGroupOption.value) return []

  const groups = new Map<
    string,
    {
      value: string
      variants: DProductVariant[]
      priceRange: { min: number; max: number }
      inventoryRange: { min: number; max: number }
      baseUnitsRange: { min: string; max: string }
      salesUnits: Set<string>
    }
  >()

  props.variants.forEach((variant) => {
    const groupValue = variant.optionValues.find(
      (ov) => ov.optionId === selectedGroupOption.value?.id
    )?.optionValue.value
    console.log(groupValue)

    if (!groupValue) return

    if (!groups.has(groupValue)) {
      groups.set(groupValue, {
        value: groupValue,
        variants: [],
        priceRange: { min: Infinity, max: -Infinity },
        inventoryRange: { min: Infinity, max: -Infinity },
        baseUnitsRange: { min: "Infinity", max: "-Infinity" },
        salesUnits: new Set()
      })
    }

    const group = groups.get(groupValue)!
    group.variants.push(variant)
    group.priceRange.min = Math.min(group.priceRange.min, variant.baseUnitPrice)
    group.priceRange.max = Math.max(group.priceRange.max, variant.baseUnitPrice)
    group.inventoryRange.min = Math.min(group.inventoryRange.min, variant.inventory)
    group.inventoryRange.max = Math.max(group.inventoryRange.max, variant.inventory)
    group.baseUnitsRange.min = String(
      Math.min(Number(group.baseUnitsRange.min), Number(variant.baseUnitsPerSalesUnit))
    )
    group.baseUnitsRange.max = String(
      Math.max(Number(group.baseUnitsRange.max), Number(variant.baseUnitsPerSalesUnit))
    )
    group.salesUnits.add(variant.salesUnit)
  })

  return Array.from(groups.values())
})

function getGroupIdentifier(groupValue: string): string {
  return `${selectedGroupOption.value?.id}-${groupValue}`
}

function toggleGroup(groupValue: string) {
  const identifier = getGroupIdentifier(groupValue)
  if (expandedGroups.value.has(identifier)) {
    expandedGroups.value.delete(identifier)
  } else {
    expandedGroups.value.add(identifier)
  }
}

function updateVariantField(variant: DProductVariant, field: string, value: any) {
  const updatedVariants = props.variants.map((v) =>
    v.id === variant.id ? { ...v, [field]: value } : v
  )
  emit("update:variants", updatedVariants)
}

function updateVariantPrice(variant: DProductVariant, value: string) {
  const updatedVariants = props.variants.map((v) =>
    v.id === variant.id ? { ...v, baseUnitPrice: Math.round(Number(value) * 100) } : v
  )
  emit("update:variants", updatedVariants)
}

function updateGroupField(group: string, field: string, value: any) {
  const updatedVariants = props.variants.map((v) => {
    const groupValue = v.optionValues.find((ov) => ov.optionId === selectedGroupOption.value?.id)
      ?.optionValue.value

    return groupValue === group ? { ...v, [field]: value } : v
  })
  emit("update:variants", updatedVariants)
}

function formatOptionValues(variant: DProductVariant): string {
  return variant.optionValues
    .filter((ov) => ov.optionId !== selectedGroupOption.value?.id)
    .map((ov) => ov.optionValue.value)
    .join("/")
}
</script>

<template>
  <div
    v-if="variants && options"
    class="space-y-4"
  >
    <div class="flex items-center justify-start gap-4">
      <p class="text-copy text-neutral-subtle text-nowrap">Group by</p>
      <div class="w-30">
        <DSelect
          :modelValue="selectedGroupOptionId"
          :options="groupingOptions"
          @update:modelValue="selectedGroupOptionId = $event as string"
        />
      </div>
    </div>

    <div class="mb-2 grid grid-cols-[2fr_repeat(4,1fr)] gap-4">
      <!-- Headers -->
      <div class="text-neutral-subtle text-copy-sm">Variant</div>
      <div class="text-neutral-subtle text-copy-sm">Price (EUR)</div>
      <div class="text-neutral-subtle text-copy-sm">Base Units / SU</div>
      <div class="text-neutral-subtle text-copy-sm">Sales Unit</div>
      <div class="text-neutral-subtle text-copy-sm">Inventory</div>
    </div>

    <DList>
      <template
        v-for="group in groupedVariants"
        :key="group.value"
      >
        <!-- Parent row -->
        <DListItem
          :hover="true"
          :padding="false"
          class="px-4"
        >
          <div class="grid w-full grid-cols-[2fr_repeat(4,1fr)] items-center gap-4">
            <button
              @click="toggleGroup(group.value)"
              class="flex h-full cursor-pointer items-center gap-2"
            >
              <component
                :is="
                  expandedGroups.has(getGroupIdentifier(group.value))
                    ? ChevronDownIcon
                    : ChevronRightIcon
                "
                class="h-4 w-4 flex-shrink-0"
              />
              <span class="font-medium">{{ group.value }}</span>
            </button>

            <DInput
              type="number"
              :modelValue="
                group.priceRange.min === group.priceRange.max ? group.priceRange.min / 100 : ''
              "
              :placeholder="`${group.priceRange.min / 100} - ${group.priceRange.max / 100}`"
              @update:modelValue="
                updateGroupField(group.value, 'baseUnitPrice', Math.round(Number($event) * 100))
              "
            />

            <DInput
              type="number"
              :modelValue="
                group.baseUnitsRange.min === group.baseUnitsRange.max
                  ? group.baseUnitsRange.min
                  : ''
              "
              :placeholder="`${group.baseUnitsRange.min} - ${group.baseUnitsRange.max}`"
              @update:modelValue="updateGroupField(group.value, 'baseUnitsPerSalesUnit', $event)"
            />

            <DSelect
              :modelValue="group.salesUnits.size === 1 ? Array.from(group.salesUnits)[0] : ''"
              :options="unitOptions"
              :placeholder="group.salesUnits.size > 1 ? 'Multiple' : 'Select unit'"
              @update:modelValue="updateGroupField(group.value, 'salesUnit', $event)"
            />

            <DInput
              type="number"
              :modelValue="
                group.inventoryRange.min === group.inventoryRange.max
                  ? group.inventoryRange.min
                  : ''
              "
              :placeholder="`${group.inventoryRange.min} - ${group.inventoryRange.max}`"
              @update:modelValue="updateGroupField(group.value, 'inventory', Number($event))"
            />
          </div>
        </DListItem>

        <!-- Child rows -->
        <template v-if="expandedGroups.has(getGroupIdentifier(group.value))">
          <DListItem
            v-for="variant in group.variants"
            :key="variant.id"
            :hover="false"
            class="bg-neutral-50"
          >
            <div class="grid w-full grid-cols-[2fr_repeat(4,1fr)] items-center gap-4">
              <div class="pl-6 text-sm text-gray-600">{{ formatOptionValues(variant) }}</div>

              <DInput
                type="number"
                :modelValue="variant.baseUnitPrice / 100"
                @update:modelValue="updateVariantPrice(variant, $event)"
              />

              <DInput
                type="number"
                :modelValue="variant.baseUnitsPerSalesUnit"
                @update:modelValue="updateVariantField(variant, 'baseUnitsPerSalesUnit', $event)"
              />

              <DSelect
                :modelValue="variant.salesUnit"
                :options="unitOptions"
                @update:modelValue="updateVariantField(variant, 'salesUnit', $event)"
              />

              <DInput
                type="number"
                :modelValue="variant.inventory"
                @update:modelValue="updateVariantField(variant, 'inventory', Number($event))"
              />
            </div>
          </DListItem>
        </template>
      </template>
    </DList>
  </div>
</template>

<script setup lang="ts">
import type { DCompositeOption, DProductVariant } from "~/types/models"

const props = defineProps<{
  variants: DProductVariant[]
  options: DCompositeOption[]
  unitOptions: { value: string; label: string }[]
}>()

const emit = defineEmits(["update:variants"])

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
</script>

<template>
  <div
    v-if="variants && options.some((o) => o.type === 'select')"
    class="space-y-4"
  >
    <h3 class="text-lg font-medium">Variants</h3>
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr class="border-b">
            <th
              v-for="option in options.filter((o) => o.type === 'select')"
              :key="option.id"
              class="p-2 text-left"
            >
              {{ option.name }}
            </th>
            <th class="p-2 text-left">Price (EUR)</th>
            <th class="p-2 text-left">Base Units / SU</th>
            <th class="p-2 text-left">Sales Unit</th>
            <th class="p-2 text-left">Inventory</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="variant in variants"
            :key="variant.id"
            class="border-b"
          >
            <td
              v-for="optionValue in variant.optionValues"
              :key="optionValue.optionValueId"
              class="p-2"
            >
              {{ optionValue.optionValue.value }}
            </td>
            <td class="p-2">
              <DInput
                type="number"
                :modelValue="variant.baseUnitPrice / 100"
                @update:modelValue="updateVariantPrice(variant, $event)"
                class="w-24"
              />
            </td>
            <td class="p-2">
              <DInput
                type="number"
                :modelValue="variant.baseUnitsPerSalesUnit"
                @update:modelValue="
                  updateVariantField(variant, 'baseUnitsPerSalesUnit', Number($event))
                "
                class="w-24"
              />
            </td>
            <td class="p-2">
              <DSelect
                :modelValue="variant.salesUnit"
                :options="unitOptions"
                @update:modelValue="updateVariantField(variant, 'salesUnit', $event)"
              />
            </td>
            <td class="p-2">
              <DInput
                type="number"
                :modelValue="variant.inventory"
                @update:modelValue="updateVariantField(variant, 'inventory', Number($event))"
                class="w-24"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

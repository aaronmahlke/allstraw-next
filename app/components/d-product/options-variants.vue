<script setup lang="ts">
import { uuidv7 } from "uuidv7"
import type { DCompositeOption, DProductVariant } from "~/types/models"

type Props = {
  options: DCompositeOption[]
  variants: DProductVariant[]
}
const props = defineProps<Props>()
const emit = defineEmits(["update"])

const unitOptions = salesUnitOptions

function createVariantCombinations(options: DCompositeOption[]) {
  if (options.length === 0) return props.variants

  const optionsWithValues = options
    .filter((option) => option.type === "select" && option.values.length > 0)
    .map((option) => ({
      option,
      values: option.values
    }))

  if (optionsWithValues.length === 0) return props.variants

  function generateCombinations(currentIndex = 0, currentCombination = []): DProductVariant[] {
    if (currentIndex === optionsWithValues.length) {
      const existingVariant = props.variants.find((existing) =>
        currentCombination.every(({ option, value }) =>
          existing.optionValues.some(
            (ev) => ev.optionId === option.id && ev.optionValueId === value.id
          )
        )
      )

      return [
        {
          id: existingVariant?.id || uuidv7(),
          productId: existingVariant?.productId || "",
          baseUnitPrice: existingVariant?.baseUnitPrice ?? 0,
          salesUnit: existingVariant?.salesUnit ?? "",
          baseUnitsPerSalesUnit: existingVariant?.baseUnitsPerSalesUnit ?? "1",
          inventory: existingVariant?.inventory ?? 0,
          optionValues: currentCombination.map(({ option, value }) => ({
            optionId: option.id,
            optionValueId: value.id,
            rangeValue: null,
            option,
            optionValue: value
          }))
        }
      ]
    }

    const currentOption = optionsWithValues[currentIndex]
    const combinations = []

    for (const value of currentOption.values) {
      combinations.push(
        ...generateCombinations(currentIndex + 1, [
          ...currentCombination,
          { option: currentOption.option, value }
        ])
      )
    }

    return combinations
  }

  return generateCombinations()
}

function updateVariantOptions(newOptions: DCompositeOption[]) {
  const newVariants = createVariantCombinations(newOptions)
  emit("update", newOptions, newVariants)
}

function updateVariants(newVariants: DProductVariant[]) {
  emit("update", props.options, newVariants)
}
</script>

<template>
  <div class="space-y-2">
    <h3 class="text-neutral text-copy-lg font-medium">Variants</h3>
    <div class="space-y-6">
      <!-- Variant Options Section -->
      <DProductOptions
        :options="options"
        @update:options="updateVariantOptions"
      />

      <!-- Variants List Section -->
      <div v-if="variants.length > 0">
        <DProductVariants
          :variants="variants"
          :options="options"
          :unit-options="unitOptions"
          @update:variants="updateVariants"
        />
      </div>
    </div>
  </div>
</template>

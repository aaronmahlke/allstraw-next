<script setup lang="ts">
import type { DCompositeProduct } from "~/types/models"

type Props = {
  product: DCompositeProduct
}

const { product } = defineProps<Props>()

const emit = defineEmits<{
  (e: "update:modelValue", value: DCompositeProduct): void
}>()

function updateField(key: keyof DCompositeProduct, value: any) {
  emit("update:modelValue", { ...product, [key]: value })
}

const basePriceEur = computed({
  get: () => (product?.basePrice ? product.basePrice / 100 : 0),
  set: (value) => {
    if (product) {
      product.basePrice = Math.round(Number(value) * 100)
    }
  }
})

const dimensionalUnit = computed(() => {
  return getDimensionalUnit(product.baseUnit, product.width, product.height, product.depth)
})

function getUnitName(value: string) {
  return salesUnitOptions.find((option) => option.value === value)?.label || ""
}
</script>

<template>
  <div
    v-if="product"
    class="space-y-4"
  >
    <DFormGroup>
      <DFormLabel
        required
        name="name"
      >
        Product Name
      </DFormLabel>
      <DInput
        type="text"
        :model-value="product.name"
        @change="updateField('name', $event.target.value)"
        placeholder="e.g., Premium Oak Flooring"
        required
      />
    </DFormGroup>
    <DFormGroup>
      <DFormLabel name="description">Description</DFormLabel>
      <DTextarea
        :model-value="product.description || ''"
        @change="updateField('description', $event.target.value)"
        placeholder="Detailed description of the product"
        :rows="4"
      />
    </DFormGroup>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DFormGroup>
        <DFormLabel
          required
          name="basePricePerUnit"
        >
          Base Price Per Unit
        </DFormLabel>
        <DInput
          type="number"
          v-model="basePriceEur"
          placeholder="e.g., 25.50"
          :step="0.01"
          :min="0"
          required
          leading="EUR"
        />
      </DFormGroup>
      <DFormGroup>
        <DFormLabel
          required
          name="baseUnitSymbol"
        >
          Base Unit ({{ dimensionalUnit }})
        </DFormLabel>
        <DSelect
          v-model="product.baseUnit"
          :options="unitOptions ?? []"
          placeholder="Select base unit..."
          required
        />
      </DFormGroup>
      <DFormGroup>
        <DFormLabel
          required
          name="salesUnitSymbol"
        >
          Sales Unit
        </DFormLabel>
        <DSelect
          :model-value="product.salesUnit"
          @update:model-value="updateField('salesUnit', $event)"
          :options="salesUnitOptions ?? []"
          placeholder="Select base unit..."
          required
        />
      </DFormGroup>
      <DFormGroup>
        <DFormLabel
          required
          name="baseUnitsPerSalesUnit"
        >
          Base Units / {{ getUnitName(product.salesUnit) }}
        </DFormLabel>
        <DInput
          type="number"
          v-model="product.baseUnitsPerSalesUnit"
          placeholder="e.g. 20cm²/ Box"
          :min="0"
          required
          :trailing="`${dimensionalUnit} / ${getUnitName(product.salesUnit)}`"
        />
      </DFormGroup>
    </div>
  </div>
</template>

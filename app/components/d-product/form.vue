<script setup lang="ts">
import { PlusIcon } from "lucide-vue-next"
import type { DProductCreate, DCarrier } from "~/types/models"

type ProductFormData = DProductCreate
type DimensionType = "width" | "height" | "depth"
type BaseUnitType = "cm" | "m" | "piece"

type Props = {
  product: ProductFormData
  loading?: boolean
}

const { product, loading = false } = defineProps<Props>()

const emit = defineEmits<{
  "update:modelValue": [value: ProductFormData]
  validate: [errors: string[]]
}>()

const { data: carriersData } = await useFetch<{ carriers: DCarrier[] }>("/api/carriers")
const carriers = carriersData.value?.carriers || []

const carrierOptions = carriers.map((carrier) => ({
  label: `${carrier.name} (€${(carrier.basePrice / 100).toFixed(2)})`,
  value: carrier.id
}))

function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
  emit("update:modelValue", { ...product, [key]: value })
}

const basePriceEur = computed({
  get: () => (product.basePrice ? product.basePrice / 100 : undefined),
  set: (value) => {
    updateField("basePrice", value ? Math.round(Number(value) * 100) : 0)
  }
})

const shippingPriceEur = computed({
  get: () => (product.shippingPricePerUnit ? product.shippingPricePerUnit / 100 : undefined),
  set: (value) => {
    updateField("shippingPricePerUnit", value ? Math.round(Number(value) * 100) : null)
  }
})

const baseUnitOptions = [
  { label: "Centimeters (cm)", value: "cm" },
  { label: "Meters (m)", value: "m" },
  { label: "Pieces", value: "piece" }
] as const

const isDimensional = computed(() => {
  return product.baseUnit !== "piece"
})

function addDimension(dimension: DimensionType) {
  updateField(dimension, { min: 0.1, max: 10, step: 0.1 })
}

function removeDimension(dimension: DimensionType) {
  updateField(dimension, null)
}

function validateProduct() {
  const errors: string[] = []

  if (!product.name.trim()) {
    errors.push("Product name is required")
  }

  if (!product.basePrice || product.basePrice <= 0) {
    errors.push("Base price must be greater than 0")
  }

  if (product.minOrderQuantity <= 0) {
    errors.push("Minimum order quantity must be greater than 0")
  }

  // Validate dimensions if they exist
  if (product.width) {
    if (product.width.min > product.width.max) {
      errors.push("Width minimum must be less than or equal to maximum")
    }
  }

  if (product.height) {
    if (product.height.min > product.height.max) {
      errors.push("Height minimum must be less than or equal to maximum")
    }
  }

  if (product.depth) {
    if (product.depth.min > product.depth.max) {
      errors.push("Depth minimum must be less than or equal to maximum")
    }
  }

  emit("validate", errors)
  return errors
}

defineExpose({
  validateProduct
})
</script>

<template>
  <div class="space-y-6">
    <!-- Basic Info -->
    <div class="space-y-4">
      <h3 class="text-title-sm text-neutral-strong">Basic Information</h3>

      <DFormGroup>
        <DFormLabel
          required
          name="name"
        >
          Product Name
        </DFormLabel>
        <DInput
          :model-value="product.name"
          @update:model-value="updateField('name', String($event))"
          placeholder="e.g., Premium Oak Flooring"
          :disabled="loading"
          required
        />
      </DFormGroup>

      <DFormGroup>
        <DFormLabel name="description">Description</DFormLabel>
        <DTextarea
          :model-value="product.description || ''"
          @update:model-value="updateField('description', String($event))"
          placeholder="Detailed description of the product"
          :rows="3"
          :disabled="loading"
        />
      </DFormGroup>
    </div>

    <!-- Pricing -->
    <div class="space-y-4">
      <h3 class="text-title-sm text-neutral-strong">Pricing</h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DFormGroup>
          <DFormLabel
            required
            name="basePrice"
          >
            Base Price
          </DFormLabel>
          <DInput
            type="number"
            v-model="basePriceEur"
            placeholder="25.50"
            :step="0.01"
            :min="0"
            :disabled="loading"
            required
            leading="€"
          />
        </DFormGroup>

        <DFormGroup>
          <DFormLabel
            required
            name="baseUnit"
          >
            Base Unit
          </DFormLabel>
          <DCombobox
            :model-value="product.baseUnit"
            @update:model-value="updateField('baseUnit', $event as BaseUnitType)"
            :items="baseUnitOptions"
            placeholder="Select unit..."
            :disabled="loading"
          />
        </DFormGroup>
      </div>
    </div>

    <!-- Dimensions (only for non-piece products) -->
    <div
      v-if="isDimensional"
      class="space-y-4"
    >
      <h3 class="text-title-sm text-neutral-strong">Dimensions</h3>
      <p class="text-copy-sm text-neutral-subtle">
        Configure dimension constraints for customer customization
      </p>

      <DProductDimensionInput
        v-if="product.width !== null"
        label="Width"
        :model-value="product.width"
        @update:model-value="updateField('width', $event)"
        @remove="removeDimension('width')"
        :unit="product.baseUnit"
        :loading="loading"
      />

      <DProductDimensionInput
        v-if="product.height !== null"
        label="Height"
        :model-value="product.height"
        @update:model-value="updateField('height', $event)"
        @remove="removeDimension('height')"
        :unit="product.baseUnit"
        :loading="loading"
      />

      <DProductDimensionInput
        v-if="product.depth !== null"
        label="Depth"
        :model-value="product.depth"
        @update:model-value="updateField('depth', $event)"
        @remove="removeDimension('depth')"
        :unit="product.baseUnit"
        :loading="loading"
      />

      <!-- Add Dimension Buttons -->
      <div class="flex items-center gap-2">
        <DButton
          v-if="product.width === null"
          @click="addDimension('width')"
          variant="secondary"
          :icon-left="PlusIcon"
          :disabled="loading"
        >
          Add width
        </DButton>
        <DButton
          v-if="product.height === null"
          @click="addDimension('height')"
          :icon-left="PlusIcon"
          variant="secondary"
          :disabled="loading"
        >
          Add height
        </DButton>
        <DButton
          v-if="product.depth === null"
          @click="addDimension('depth')"
          variant="secondary"
          :icon-left="PlusIcon"
          :disabled="loading"
        >
          Add depth
        </DButton>
      </div>
    </div>

    <!-- Order Settings -->
    <div class="space-y-4">
      <h3 class="text-title-sm text-neutral-strong">Order Settings</h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DFormGroup>
          <DFormLabel name="minOrderQuantity">Minimum Order Quantity</DFormLabel>
          <DInput
            type="number"
            :model-value="product.minOrderQuantity"
            @update:model-value="updateField('minOrderQuantity', Number($event as string))"
            :min="1"
            placeholder="1"
            :disabled="loading"
          />
        </DFormGroup>

        <DFormGroup>
          <DFormLabel name="shippingPrice">Shipping Price per Unit</DFormLabel>
          <DInput
            type="number"
            v-model="shippingPriceEur"
            placeholder="2.50"
            :step="0.01"
            :min="0"
            :disabled="loading"
            leading="€"
          />
        </DFormGroup>

        <DFormGroup>
          <DFormLabel name="carrier">Carrier</DFormLabel>
          <DCombobox
            :model-value="product.carrierId"
            @update:model-value="updateField('carrierId', $event)"
            :items="carrierOptions"
            placeholder="Select carrier..."
            :disabled="loading"
          />
        </DFormGroup>
      </div>
    </div>
  </div>
</template>

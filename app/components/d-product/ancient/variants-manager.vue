<script setup lang="ts">
import { useToast } from "~/composables/useToast"
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-vue-next"
import type { Ref } from "vue"
import type { ProductVariant, ProductProperty, UnitOption } from "~/types/product" // Assuming types

// Define the structure for the modal's state, separating selected property values
interface VariantModalState extends Omit<ProductVariant, "properties" | "id"> {
  id?: string // Make ID optional for creation
  selectedPropertyValues: Record<string, string | null> // { propertyId: propertyValueId | null }
}

const props = defineProps<{
  productId: string
  variants: ProductVariant[]
  properties: ProductProperty[] // Needed to populate property value selects
  baseUnitSymbol: string | null
}>()

// Define specific emits for parent component
const emit = defineEmits<{
  (e: "variant:saved", variant: ProductVariant): void
  (e: "variant:deleted", variantId: string): void
}>()

const { toast } = useToast()

// --- Local State ---
const isVariantModalOpen = ref(false)
const editingVariantId = ref<string | null>(null) // Track if editing
const variantModalState = ref<VariantModalState>(createEmptyModalState())
const isSavingVariant = ref(false)
const isDeleteVariantModalOpen = ref(false)
const variantToDelete = ref<ProductVariant | null>(null)
const isDeletingVariant = ref(false)

// --- Fetch Units ---
const { data: allUnitOptions, status: unitsStatus } = useFetch<UnitOption[]>("/api/units", {
  lazy: true,
  transform: (units) =>
    units.map((u) => ({ value: u.symbol, label: `${u.name} (${u.symbol})`, type: u.type }))
})
const packagingUnitOptions = computed(
  () => allUnitOptions.value?.filter((u) => u.type === "packaging") ?? []
)
const isLoadingUnits = computed(() => unitsStatus.value === "pending")

// --- Utility Functions ---
function createEmptyModalState(): VariantModalState {
  const selectedValues: Record<string, string | null> = {}
  // Initialize selection state for each available property
  props.properties.forEach((prop) => {
    selectedValues[prop.id] = null
  })
  return {
    id: undefined,
    packagingUnitSymbol: null,
    quantityPerPackage: null,
    packagePrice: null,
    minOrderQuantity: 1,
    orderQuantityIncrement: 1,
    selectedPropertyValues: selectedValues
  }
}

function mapVariantToModalState(variant: ProductVariant): VariantModalState {
  const selectedValues: Record<string, string | null> = {}
  // Initialize with nulls for all product properties
  props.properties.forEach((prodProp) => {
    selectedValues[prodProp.id] = null
  })
  // Populate with actual values from the variant's properties link table
  variant.properties?.forEach((link) => {
    if (link.productPropertyId && link.productPropertyValueId) {
      selectedValues[link.productPropertyId] = link.productPropertyValueId
    }
  })

  return {
    id: variant.id,
    packagingUnitSymbol: variant.packagingUnitSymbol,
    // Ensure numbers are handled correctly (null if needed)
    quantityPerPackage: variant.quantityPerPackage ?? null,
    packagePrice: variant.packagePrice ?? null,
    minOrderQuantity: variant.minOrderQuantity ?? 1,
    orderQuantityIncrement: variant.orderQuantityIncrement ?? 1,
    selectedPropertyValues: selectedValues
  }
}

// --- Methods ---
function openAddEditVariantModal(variant: ProductVariant | null = null) {
  if (!props.properties?.length) {
    toast.info({
      title: "Add Properties First",
      description: "You need to define product properties before you can create variants."
    })
    return
  }

  if (variant) {
    editingVariantId.value = variant.id
    variantModalState.value = mapVariantToModalState(variant)
  } else {
    editingVariantId.value = null
    variantModalState.value = createEmptyModalState()
  }
  isVariantModalOpen.value = true
}

async function handleSaveVariant() {
  const state = variantModalState.value
  if (!state) return

  // --- Validation ---
  const requiredPropertyIds = props.properties.map((p) => p.id)
  const missingSelection = requiredPropertyIds.some(
    (propId) => !state.selectedPropertyValues[propId]
  )

  if (missingSelection) {
    toast.error({
      title: "Validation Error",
      description: "Please select a value for all properties."
    })
    return
  }
  if (!state.packagingUnitSymbol) {
    toast.error({ title: "Validation Error", description: "Packaging Unit is required." })
    return
  }
  if (state.quantityPerPackage === null || state.quantityPerPackage <= 0) {
    toast.error({
      title: "Validation Error",
      description: "Quantity Per Package must be positive."
    })
    return
  }
  if (state.packagePrice !== null && state.packagePrice < 0) {
    toast.error({ title: "Validation Error", description: "Package Price cannot be negative." })
    return
  }
  if (state.minOrderQuantity === null || state.minOrderQuantity < 1) {
    toast.error({ title: "Validation Error", description: "Min Order Qty must be at least 1." })
    return
  }
  if (state.orderQuantityIncrement === null || state.orderQuantityIncrement < 1) {
    toast.error({
      title: "Validation Error",
      description: "Order Qty Increment must be at least 1."
    })
    return
  }
  // --- End Validation ---

  isSavingVariant.value = true
  try {
    // Prepare payload: Base fields + array of selected property value IDs
    const selectedPropertyValueIds = Object.values(state.selectedPropertyValues).filter(
      (id): id is string => id !== null
    )
    // Destructure carefully to avoid sending extra properties
    const payload = {
      id: state.id, // Keep id if editing
      packagingUnitSymbol: state.packagingUnitSymbol,
      quantityPerPackage: state.quantityPerPackage,
      packagePrice: state.packagePrice,
      minOrderQuantity: state.minOrderQuantity,
      orderQuantityIncrement: state.orderQuantityIncrement,
      properties: selectedPropertyValueIds // Only send the IDs
    }

    let savedVariant: ProductVariant
    const variantId = state.id

    if (variantId) {
      // Update existing variant
      savedVariant = await $fetch(`/api/products/${props.productId}/variants/${variantId}`, {
        method: "PUT",
        body: payload
      })
      toast.success({ title: "Variant Updated", description: `Variant details saved.` })
    } else {
      // Create new variant
      // Remove id from payload for creation
      const createPayload = { ...payload }
      delete createPayload.id
      savedVariant = await $fetch(`/api/products/${props.productId}/variants`, {
        method: "POST",
        body: createPayload
      })
      toast.success({ title: "Variant Added", description: `New variant created.` })
    }

    // IMPORTANT: The backend needs to return the *full* variant data including
    // its associated `properties` array for the UI to display them correctly.
    // Emit the full saved variant data received from the API to the parent.
    emit("variant:saved", savedVariant)
    isVariantModalOpen.value = false // Close modal on success
  } catch (error: any) {
    const message =
      error.data?.message ||
      (editingVariantId.value ? "Failed to update variant." : "Failed to create variant.")
    // Check for specific duplicate variant error (adjust based on your API response)
    if (error.data?.code === "VARIANT_EXISTS" || message.includes("already exists")) {
      toast.error({
        title: "Duplicate Variant",
        description: "A variant with these property values already exists."
      })
    } else {
      toast.error({ title: "Save Error", description: message })
    }
    console.error("Variant save error:", error)
  } finally {
    isSavingVariant.value = false
  }
}

function openDeleteVariantConfirmModal(variant: ProductVariant) {
  variantToDelete.value = variant
  isDeleteVariantModalOpen.value = true
}

async function handleDeleteVariant() {
  const variantIdToDelete = variantToDelete.value?.id
  if (!variantIdToDelete) return

  isDeletingVariant.value = true
  try {
    await $fetch(`/api/products/${props.productId}/variants/${variantIdToDelete}`, {
      method: "DELETE"
    })
    toast.success({ title: "Variant Deleted", description: `Variant deleted successfully.` })
    // Emit the ID of the deleted variant
    emit("variant:deleted", variantIdToDelete)
    isDeleteVariantModalOpen.value = false
  } catch (error: any) {
    toast.error({
      title: "Delete Error",
      description: error.data?.message || "Failed to delete variant."
    })
  } finally {
    isDeletingVariant.value = false
    variantToDelete.value = null
  }
}

// Helper to get display text for variant properties
function getVariantPropertyText(variant: ProductVariant): string {
  // Ensure variant.properties exists and is an array
  if (!Array.isArray(variant.properties) || !variant.properties.length) {
    // Add a check to see if props.properties is also empty, indicating maybe properties haven't loaded yet or none exist
    if (!props.properties?.length) {
      return "No properties defined for product." // Or some other indicator
    }
    // If product properties exist, but this variant has none linked, this is the "integrity" issue.
    return "No properties assigned (check data integrity)."
  }

  // Map over the variant's linked properties
  return variant.properties
    .map((propLink) => {
      // Find the corresponding full property definition from the main props
      const propDef = props.properties.find((p) => p.id === propLink.productPropertyId)
      // Find the corresponding value definition within that property
      const valueDef = propDef?.values.find((v) => v.id === propLink.productPropertyValueId)

      // Use names/values from the full definitions, falling back gracefully
      const name = propLink.propertyName || propDef?.name || "Unknown Property"
      let valueText = propLink.value || valueDef?.value || "Unknown Value"
      const unit = propLink.unitSymbol || valueDef?.unitSymbol

      if (unit) valueText += ` (${unit})`
      return `${name}: ${valueText}`
    })
    .join(", ")
}
</script>

<template>
  <div class="border-neutral rounded-lg border bg-white p-4">
    <div class="border-neutral mb-3 flex items-center justify-between border-b pb-2">
      <h3 class="text-lg font-semibold">Variants</h3>
      <DButton
        size="sm"
        variant="secondary"
        :icon-left="PlusIcon"
        @click="openAddEditVariantModal(null)"
        :disabled="!properties?.length"
        title="Add New Variant"
      >
        Add Variant
      </DButton>
    </div>
    <p
      v-if="!properties?.length"
      class="text-neutral-subtle mb-3 text-sm italic"
    >
      Define product properties before adding variants.
    </p>
    <div
      v-if="variants?.length"
      class="space-y-2"
    >
      <div
        v-for="variant in variants"
        :key="variant.id"
        class="border-neutral-weak group hover:bg-neutral-background/50 relative rounded border p-3 text-sm transition-colors"
      >
        <div
          class="absolute top-1 right-1 hidden items-center gap-1 rounded bg-white/80 p-0.5 backdrop-blur-sm group-hover:flex"
        >
          <DButton
            variant="ghost"
            size="xs"
            :icon-left="PencilIcon"
            @click="openAddEditVariantModal(variant)"
            title="Edit Variant"
          />
          <DButton
            variant="ghost"
            size="xs"
            :icon-left="TrashIcon"
            @click="openDeleteVariantConfirmModal(variant)"
            class="text-red-600 hover:bg-red-100"
            title="Delete Variant"
          />
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-3">
          <p>
            <b class="text-neutral font-medium">Packaging:</b>
            {{ variant.packagingUnitSymbol }}
          </p>
          <p>
            <b class="text-neutral font-medium">Qty/Pkg:</b>
            {{ variant.quantityPerPackage }} {{ baseUnitSymbol ?? "" }}
          </p>
          <p>
            <b class="text-neutral font-medium">Price/Pkg:</b>
            {{
              variant.packagePrice !== null && variant.packagePrice !== undefined
                ? `EUR ${variant.packagePrice.toFixed(2)}`
                : "(Calculated)"
            }}
          </p>
          <p>
            <b class="text-neutral font-medium">Min Order:</b>
            {{ variant.minOrderQuantity }} pkgs
          </p>
          <p>
            <b class="text-neutral font-medium">Increment:</b>
            {{ variant.orderQuantityIncrement }} pkgs
          </p>
        </div>

        <!-- Updated conditional rendering for properties -->
        <div class="border-neutral-weak mt-2 border-t pt-2 text-xs">
          <span class="text-neutral-subtle font-medium">Properties:</span>
          <span
            v-if="variant.properties && variant.properties.length"
            class="text-neutral-strong ml-1"
          >
            {{ getVariantPropertyText(variant) }}
          </span>
          <span
            v-else
            class="text-neutral-subtle ml-1 italic"
          >
            No properties assigned.
          </span>
        </div>
        <!-- Removed the redundant v-else paragraph -->
      </div>
    </div>
    <p
      v-else-if="properties?.length"
      class="text-neutral-subtle text-sm"
    >
      No variants defined yet for this product.
    </p>

    <!-- Variant Add/Edit Modal -->
    <DModal
      :open="isVariantModalOpen"
      :title="editingVariantId ? 'Edit Variant' : 'Add New Variant'"
      size="xl"
      @close="isVariantModalOpen = false"
      :confirm-text="editingVariantId ? 'Save Changes' : 'Create Variant'"
      @confirm="handleSaveVariant"
      :loading="isSavingVariant"
    >
      <!-- Form is placed inside the default slot of DModal -->
      <form
        v-if="variantModalState"
        @submit.prevent="handleSaveVariant"
        class="space-y-4 p-5"
      >
        <!-- Packaging & Pricing -->
        <h4 class="text-md font-semibold">Packaging & Pricing</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DFormGroup>
            <DFormLabel required>Packaging Unit</DFormLabel>
            <DSelect
              v-model="variantModalState.packagingUnitSymbol"
              :options="packagingUnitOptions"
              placeholder="Select..."
              required
              :disabled="isSavingVariant || isLoadingUnits"
              :loading="isLoadingUnits"
            />
          </DFormGroup>
          <DFormGroup>
            <DFormLabel required>Quantity Per Package</DFormLabel>
            <DInput
              type="number"
              :modelValue="variantModalState.quantityPerPackage"
              @update:modelValue="
                variantModalState.quantityPerPackage =
                  $event === '' || $event === null ? null : Number($event)
              "
              placeholder="e.g., 50"
              step="any"
              min="0.000001"
              required
              :disabled="isSavingVariant"
              :trailing="baseUnitSymbol ?? ''"
            />
          </DFormGroup>
          <DFormGroup>
            <DFormLabel>Package Price (Optional)</DFormLabel>
            <DInput
              type="number"
              :modelValue="variantModalState.packagePrice"
              @update:modelValue="
                variantModalState.packagePrice =
                  $event === '' || $event === null ? null : Number($event)
              "
              placeholder="Overrides calculation"
              step="0.01"
              min="0"
              :disabled="isSavingVariant"
              leading="EUR"
            />
            <p class="text-neutral-subtle mt-1 text-xs">Uses base price if blank.</p>
          </DFormGroup>
        </div>

        <!-- Order Quantity Rules -->
        <h4 class="text-md font-semibold">Order Rules</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DFormGroup>
            <DFormLabel>Min Order Qty (Packages)</DFormLabel>
            <DInput
              type="number"
              v-model.number="variantModalState.minOrderQuantity"
              placeholder="1"
              step="1"
              min="1"
              required
              :disabled="isSavingVariant"
            />
          </DFormGroup>
          <DFormGroup>
            <DFormLabel>Order Qty Increment (Packages)</DFormLabel>
            <DInput
              type="number"
              v-model.number="variantModalState.orderQuantityIncrement"
              placeholder="1"
              step="1"
              min="1"
              required
              :disabled="isSavingVariant"
            />
          </DFormGroup>
        </div>

        <!-- Variant Property Selection -->
        <div class="border-neutral mt-4 border-t pt-4">
          <h4 class="text-md mb-3 font-semibold">Variant Properties</h4>
          <p
            v-if="!properties?.length"
            class="text-sm text-red-500"
          >
            Error: No product properties found. Cannot create variant.
          </p>
          <div
            v-else
            class="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3"
          >
            <DFormGroup
              v-for="prop in properties"
              :key="prop.id"
            >
              <DFormLabel required>{{ prop.name }}</DFormLabel>
              <DSelect
                v-model="variantModalState.selectedPropertyValues[prop.id]"
                :options="
                  (prop.values || []).map((v) => ({
                    value: v.id,
                    label: `${v.value}${v.unitSymbol ? ` (${v.unitSymbol})` : ''}`
                  }))
                "
                placeholder="Select value..."
                required
                :disabled="isSavingVariant || !prop.values?.length"
              />
              <p
                v-if="!prop.values?.length"
                class="text-neutral-subtle mt-1 text-xs italic"
              >
                No allowed values defined for '{{ prop.name }}'.
              </p>
            </DFormGroup>
          </div>
        </div>

        <!-- REMOVED the explicit button div here -->
      </form>
      <div
        v-else
        class="text-neutral-subtle p-5 text-center"
      >
        Loading variant data...
      </div>
    </DModal>

    <!-- Delete Variant Confirmation Modal -->
    <DModal
      :open="isDeleteVariantModalOpen"
      title="Delete Variant"
      :description="`Are you sure you want to delete this variant? Please check associated orders before proceeding. This action cannot be undone.`"
      confirm-text="Delete Variant"
      danger
      size="md"
      @close="isDeleteVariantModalOpen = false"
      @confirm="handleDeleteVariant"
      :loading="isDeletingVariant"
    ></DModal>
    <!-- Pass loading state here too -->
  </div>
</template>

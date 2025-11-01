<script setup lang="ts">
import type { DProductCreate } from "~/types/models"

definePageMeta({ layout: "admin" })

const { toast } = useToast()

const productData = ref<DProductCreate>({
  name: "",
  description: "",
  basePrice: null,
  baseUnit: "cm",
  minOrderQuantity: 1,
  width: null,
  height: null,
  depth: null,
  shippingPricePerUnit: null,
  carrierId: null,
  organisationId: "" // Will be set by API
})

const isSaving = ref(false)
const productForm = ref()

async function saveProduct() {
  const errors = productForm.value?.validateProduct() || []

  if (errors.length > 0) {
    toast.error({
      title: "Validation Error",
      description: errors[0] // Show first error
    })
    return
  }

  isSaving.value = true
  try {
    const response = await $fetch("/api/products", {
      method: "POST",
      body: productData.value
    })

    toast.success({
      title: "Product Created",
      description: `${productData.value.name} has been created successfully`
    })

    navigateTo(`/admin/products/${response.product.id}`)
  } catch (error) {
    console.error("Error creating product:", error)
    toast.error({
      title: "Creation Failed",
      description: "Failed to create product. Please try again."
    })
  } finally {
    isSaving.value = false
  }
}

function cancel() {
  navigateTo("/admin/products")
}
</script>

<template>
  <div>
    <DPageTitle title="Create New Product">
      <div class="flex gap-2">
        <DButton
          variant="secondary"
          @click="cancel"
        >
          Cancel
        </DButton>
        <DButton
          @click="saveProduct"
          :loading="isSaving"
        >
          Save Product
        </DButton>
      </div>
    </DPageTitle>

    <DPageWrapper>
      <div class="py-5">
        <form
          @submit.prevent="saveProduct"
          class="border-neutral bg-surface mx-auto max-w-2xl rounded-lg border p-6"
        >
          <DProductForm
            ref="productForm"
            :product="productData"
            @update:model-value="productData = $event"
            :loading="isSaving"
          />
          <button
            type="submit"
            class="hidden"
          ></button>
        </form>
      </div>
    </DPageWrapper>
  </div>
</template>

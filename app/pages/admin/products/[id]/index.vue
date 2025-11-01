<script setup lang="ts">
import type { DProduct, DProductCreate } from "~/types/models"

definePageMeta({ layout: "admin" })

const { toast } = useToast()

const route = useRoute()
const productId = route.params.id as string

if (!productId) {
  throw createError({ statusCode: 400, statusMessage: "Product ID is required" })
}

const { data: product } = await useFetch(`/api/products/${productId}`)
if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: "Product not found" })
}

const productData = ref<DProductCreate>({
  name: product.value.product.name,
  description: product.value.product.description || "",
  basePrice: product.value.product.basePrice,
  baseUnit: product.value.product.baseUnit,
  minOrderQuantity: product.value.product.minOrderQuantity,
  width: product.value.product.width,
  height: product.value.product.height,
  depth: product.value.product.depth,
  shippingPricePerUnit: product.value.product.shippingPricePerUnit,
  carrierId: product.value.product.carrierId,
  organisationId: product.value.product.organisationId
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
    await $fetch(`/api/products/${productId}`, {
      method: "PUT",
      body: productData.value
    })

    toast.success({
      title: "Product Updated",
      description: `${productData.value.name} has been updated successfully`
    })

    navigateTo("/admin/products")
  } catch (error) {
    console.error("Error updating product:", error)
    toast.error({
      title: "Update Failed",
      description: "Failed to update product. Please try again."
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
    <DPageTitle :title="`Edit ${product?.product?.name || 'Product'}`">
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
          Save Changes
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

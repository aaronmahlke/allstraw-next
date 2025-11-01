<script setup lang="ts">
import { PackageOpen, PlusIcon } from "lucide-vue-next"
import type { DProductWithCarrier } from "~/types/models"

definePageMeta({ layout: "admin" })

const { data: products } = await useFetch<{ products: DProductWithCarrier[] }>("/api/products")

const { data: me } = await useFetch("/api/me")

function goToCreatePage() {
  navigateTo("/admin/products/create")
}
</script>

<template>
  <DPageTitle title="Products">
    <DButton
      v-if="me && me.role === 'admin'"
      :icon-left="PlusIcon"
      @click="goToCreatePage"
      size="md"
    >
      Add Product
    </DButton>
  </DPageTitle>
  <DPageWrapper>
    <div class="py-5">
      <div
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        v-if="products?.products && products.products.length > 0"
      >
        <NuxtLink
          :to="`/admin/products/${product.id}`"
          v-for="product in products.products"
          :key="product.id"
          class="hover:border-neutral-strong/20 group cursor-pointer overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm transition-all duration-100 hover:shadow-md"
        >
          <div class="p-5">
            <p class="text-copy-xl group-hover:text-blue-600">
              {{ product.name }}
            </p>
            <p class="text-copy text-neutral">
              {{ product.description || "No description" }}
            </p>
            <div class="text-copy-sm text-neutral-subtle mt-2 flex items-center gap-2">
              <span>€{{ (product.basePrice / 100).toFixed(2) }} / {{ product.baseUnit }}</span>
              <span
                v-if="product.carrierName"
                class="rounded bg-neutral-100 px-2 py-1 text-xs"
              >
                {{ product.carrierName }}
              </span>
            </div>
            <p
              v-if="product.minOrderQuantity > 1"
              class="text-copy-sm text-neutral-subtle mt-1"
            >
              Min. {{ product.minOrderQuantity }} {{ product.baseUnit }}
            </p>
          </div>
        </NuxtLink>
      </div>
      <DEmpty
        v-else
        :icon="PackageOpen"
        title="No Products yet"
        description="Create a new product to get started."
        size="lg"
      >
        <DButton
          variant="secondary"
          :icon-left="PlusIcon"
          @click="goToCreatePage"
        >
          Create Product
        </DButton>
      </DEmpty>
    </div>
  </DPageWrapper>
</template>

<script lang="ts" setup>
import { LogOutIcon } from "lucide-vue-next"
type Props = {
  navigation: Array<{ name: string; to: string }>
}
const { navigation } = defineProps<Props>()

const productId = useRouteParams<string>("id")

const product = ref()
if (productId.value) {
  let { data } = await useFetch(`/api/products/${productId.value}`)
  product.value = data.value
}

const { data: me } = await useFetch(`/api/me`)

const initials = computed(() => {
  if (!me.value) return ""
  const name = me.value.name?.split(" ")
  return (name[0]?.charAt(0) || "") + (name[1]?.charAt(0) || "")
})
</script>

<template>
  <header class="bg-neutral border-neutral w-full border-b">
    <div class="flex items-center justify-between px-6 py-3">
      <div class="flex items-center gap-2">
        <NuxtLink
          :to="`/products`"
          class="flex flex-shrink-0 items-center gap-2"
        >
          <d-logo class="size-7" />
        </NuxtLink>
        <DPageHeaderSeparator />
        <DPageHeaderBreadcrumbLink
          :name="me?.organisationName as string"
          to="/admin/products"
        />
        <template v-if="productId && product">
          <DPageHeaderSeparator />
          <DPageHeaderBreadcrumbLink
            :name="product.name"
            :to="`/admin/products/${product.id}`"
          />
        </template>
      </div>
      <div class="flex items-center gap-2">
        <DButton
          :icon-left="LogOutIcon"
          variant="secondary"
          size="md"
          to="/logout"
        />
        <div
          class="bg-neutral-inverse text-neutral-inverse text-copy-sm grid size-8 place-items-center rounded-full font-semibold uppercase"
        >
          {{ initials }}
        </div>
      </div>
    </div>

    <DPageHeaderNavigation :navigation="navigation" />
  </header>
</template>

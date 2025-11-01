const modalStackCount = ref(0)

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--nested-dialogs', modalStackCount.value.toString())
  }
})

export function useModal() {
  const close = inject<() => void>("modal-close", () => {})

  return {
    close,
    registerModal: () => {
      const level = modalStackCount.value
      modalStackCount.value++
      return level
    },
    unregisterModal: () => {
      modalStackCount.value = Math.max(0, modalStackCount.value - 1)
    },
    getMaxLevel: () => modalStackCount.value - 1,
    modalStackCount
  }
}


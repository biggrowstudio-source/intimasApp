import type { App } from 'vue'

import AppButton from '@components/base/AppButton.vue'
import AppInput from '@components/base/AppInput.vue'
import AppTextarea from '@components/base/AppTextarea.vue'
import AppSelect from '@components/base/AppSelect.vue'
import AppSwitch from '@components/base/AppSwitch.vue'
import AppCheckbox from '@components/base/AppCheckbox.vue'
import AppCard from '@components/base/AppCard.vue'
import AppModal from '@components/base/AppModal.vue'
import AppDrawer from '@components/base/AppDrawer.vue'
import AppToast from '@components/base/AppToast.vue'
import AppAvatar from '@components/base/AppAvatar.vue'
import AppBadge from '@components/base/AppBadge.vue'
import AppSkeleton from '@components/base/AppSkeleton.vue'
import AppEmptyState from '@components/base/AppEmptyState.vue'
import AppErrorState from '@components/base/AppErrorState.vue'
import AppProgress from '@components/base/AppProgress.vue'
import AppSearch from '@components/base/AppSearch.vue'
import AppTabs from '@components/base/AppTabs.vue'
import AppUpload from '@components/base/AppUpload.vue'
import AppPagination from '@components/base/AppPagination.vue'
import AppTopBar from '@components/base/AppTopBar.vue'
import CollapsibleSection from '@components/base/CollapsibleSection.vue'

import AppBottomNav from '@components/layout/AppBottomNav.vue'

export function installComponents(app: App) {
  const baseComponents = {
    AppButton,
    AppInput,
    AppTextarea,
    AppSelect,
    AppSwitch,
    AppCheckbox,
    AppCard,
    AppModal,
    AppDrawer,
    AppToast,
    AppAvatar,
    AppBadge,
    AppSkeleton,
    AppEmptyState,
    AppErrorState,
    AppProgress,
    AppSearch,
    AppTabs,
    AppUpload,
    AppPagination,
    AppTopBar,
    CollapsibleSection,
    AppBottomNav,
  }

  for (const [name, component] of Object.entries(baseComponents)) {
    app.component(name, component)
  }
}

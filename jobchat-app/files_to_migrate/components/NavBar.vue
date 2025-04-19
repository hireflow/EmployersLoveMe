<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import {
  mdiForwardburger,
  mdiBackburger,
  mdiClose,
  mdiDotsVertical,
  mdiMenu,
  mdiAccount,
  mdiCogOutline,
  mdiEmail,
  mdiLogout,
  mdiBriefcase,
} from "@mdi/js";
import NavBarItem from "@/components/NavBarItem.vue";
import NavBarItemLabel from "@/components/NavBarItemLabel.vue";
import NavBarMenu from "@/components/NavBarMenu.vue";
import Divider from "@/components/Divider.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import Icon from "@/components/Icon.vue";

const store = useStore();

const lightBorderStyle = computed(() => store.state.lightBorderStyle);

const isNavBarVisible = computed(() => !store.state.isFullScreen);

const isAsideMobileExpanded = computed(() => store.state.isAsideMobileExpanded);

const isAsideCollapsed = computed(() => store.state.isAsideCollapsed);

const userName = computed(() => store.state.userName);

const menuToggleMobileIcon = computed(() =>
  isAsideMobileExpanded.value ? mdiBackburger : mdiForwardburger
);

const organizations = computed(() => store.state.userOrganizations);
const selectedOrganization = computed(() => store.getters.selectedOrganization);

const selectOrganization = (org) => {
  store.commit("setSelectedOrganization", { id: org.id });
};

const currentPlan = computed(() => selectedOrganization.value?.currentPlan);
const currentPlanColor = computed(() => {
  if (currentPlan.value === "Free") return "text-green-500 font-bold m-4";
  if (currentPlan.value === "Pro") return "text-red-500 font-bold m-4";
  return "text-gray-500";
});

const menuToggleMobile = () => store.dispatch("asideMobileToggle");

const isMenuNavBarActive = ref(false);
const menuNavBarToggleIcon = computed(() =>
  isMenuNavBarActive.value ? mdiClose : mdiDotsVertical
);

const menuNavBarToggle = () => {
  isMenuNavBarActive.value = !isMenuNavBarActive.value;
};

const menuOpenLg = () => {
  store.dispatch("asideLgToggle", true);
};
</script>

<template>
  <nav
    v-show="isNavBarVisible"
    class="top-0 left-0 right-0 fixed flex bg-white h-14 border-b z-30 w-screen transition-all duration-300 ease-in-out dark:bg-gray-900 dark:border-gray-800"
    :class="[
      lightBorderStyle,
      { 'ml-60 lg:ml-0': isAsideMobileExpanded },
      { 'xl:pl-60': !isAsideCollapsed },
      { 'xl:pl-20': isAsideCollapsed },
    ]"
  >
    <div class="flex-1 items-stretch flex h-14">
      <nav-bar-item type="flex lg:hidden" @click.prevent="menuToggleMobile">
        <icon :path="menuToggleMobileIcon" size="24" />
      </nav-bar-item>
      <nav-bar-item type="hidden lg:flex xl:hidden" @click.prevent="menuOpenLg">
        <icon :path="mdiMenu" size="24" />
      </nav-bar-item>
    </div>
    <div class="flex-none items-stretch flex h-14 lg:hidden">
      <nav-bar-item @click.prevent="menuNavBarToggle">
        <icon :path="menuNavBarToggleIcon" size="24" />
      </nav-bar-item>
    </div>
    <div
      class="absolute w-screen top-14 left-0 bg-white shadow lg:w-auto lg:items-stretch lg:flex lg:grow lg:static lg:border-b-0 lg:overflow-visible lg:shadow-none dark:bg-gray-900"
      :class="[isMenuNavBarActive ? 'block' : 'hidden']"
    >
      <div
        class="max-h-screen-menu overflow-y-auto lg:overflow-visible lg:flex lg:items-stretch lg:justify-end lg:ml-auto"
      >
        <span class="flex items-center">
          <p>Current Plan:</p>
          <p :class="currentPlanColor">{{ currentPlan }}</p>
        </span>
        <nav-bar-menu has-divider>
          <nav-bar-item-label
            :icon="mdiBriefcase"
            :label="selectedOrganization.name || 'Select Organization'"
          />

          <template #dropdown>
            <nav-bar-item
              v-for="org in organizations"
              :key="org.id"
              @click="selectOrganization(org)"
            >
              <nav-bar-item-label
                :icon="mdiBriefcase"
                :label="org.name"
                :class="
                  selectedOrganization.id === org.id ? 'text-blue-600' : ''
                "
              />
            </nav-bar-item>
            <divider nav-bar />
            <nav-bar-item>
              <nav-bar-item-label
                :icon="mdiCogOutline"
                label="Manage Organizations"
              />
            </nav-bar-item>
          </template>
        </nav-bar-menu>
        <nav-bar-menu has-divider>
          <nav-bar-item-label :label="userName">
            <user-avatar class="w-6 h-6 mr-3 inline-flex" />
          </nav-bar-item-label>

          <template #dropdown>
            <nav-bar-item to="/profile">
              <nav-bar-item-label :icon="mdiAccount" label="My Profile" />
            </nav-bar-item>
            <nav-bar-item>
              <nav-bar-item-label :icon="mdiCogOutline" label="Settings" />
            </nav-bar-item>
            <nav-bar-item>
              <nav-bar-item-label :icon="mdiEmail" label="Messages" />
            </nav-bar-item>
            <divider nav-bar />
            <nav-bar-item>
              <nav-bar-item-label :icon="mdiLogout" label="Log Out" />
            </nav-bar-item>
          </template>
        </nav-bar-menu>
      </div>
    </div>
  </nav>
</template>

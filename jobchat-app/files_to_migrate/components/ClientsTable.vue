<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import { mdiEye, mdiTrashCan } from "@mdi/js";
import Level from "@/components/Level.vue";
import JbButtons from "@/components/JbButtons.vue";
import JbButton from "@/components/JbButton.vue";
import UserAvatar from "@/components/UserAvatar.vue";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});

const store = useStore();

const tableTrStyle = computed(() => store.state.tableTrStyle);
const tableTrOddStyle = computed(() => store.state.tableTrOddStyle);

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, "");
  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumber;
};

const perPage = ref(10);
const currentPage = ref(0);

const itemsPaginated = computed(
  () =>
    props.items?.slice(
      perPage.value * currentPage.value,
      perPage.value * (currentPage.value + 1)
    ) || []
);

const numPages = computed(() =>
  Math.ceil((props.items?.length || 0) / perPage.value)
);

const currentPageHuman = computed(() => currentPage.value + 1);

const pagesList = computed(() => {
  const pagesList = [];
  for (let i = 0; i < numPages.value; i++) {
    pagesList.push(i);
  }
  return pagesList;
});
</script>

<template>
  <div class="w-full">
    <table class="w-full">
      <thead>
        <tr>
          <th />
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Applied</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(application, index) in itemsPaginated"
          :key="application.id"
          :class="[tableTrStyle, index % 2 === 0 ? tableTrOddStyle : '']"
        >
          <td class="image-cell">
            <user-avatar :username="application.name" class="image" />
          </td>
          <td data-label="Name">
            {{ application.name }}
          </td>
          <td data-label="Email">
            {{ application.email }}
          </td>
          <td data-label="Phone">
            {{ formatPhoneNumber(application.phone) }}
          </td>
          <td data-label="Status">
            <span
              :class="{
                'px-2 py-1 rounded-full text-xs': true,
                'bg-blue-100 text-blue-800': application.status === 'Applied',
                'bg-yellow-100 text-yellow-800':
                  application.status === 'Reviewed',
                'bg-green-100 text-green-800':
                  application.status === 'Acted On',
              }"
            >
              {{ application.status }}
            </span>
          </td>
          <td data-label="Applied">
            <small class="text-gray-500 dark:text-gray-400">
              {{ application.applied_date }}
            </small>
          </td>
          <td class="actions-cell">
            <jb-buttons type="justify-start lg:justify-end" no-wrap>
              <jb-button
                :icon="mdiEye"
                small
                class="text-blue-500"
                @click="$emit('view', application)"
              />
              <jb-button
                :icon="mdiTrashCan"
                small
                class="text-red-500"
                @click="$emit('delete', application)"
              />
            </jb-buttons>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="p-3 lg:px-6 border-t border-gray-100 dark:border-gray-800">
      <level>
        <jb-buttons>
          <jb-button
            v-for="page in pagesList"
            :key="page"
            :active="page === currentPage"
            :label="page + 1"
            small
            @click="currentPage = page"
          />
        </jb-buttons>
        <small>Page {{ currentPageHuman }} of {{ numPages }}</small>
      </level>
    </div>
  </div>
</template>

import { createStore } from "vuex";
import * as styles from "@/styles.js";

export default createStore({
  state: {
    /* Styles */
    lightBorderStyle: styles.basic.lightBorder,
    lightBgStyle: styles.basic.lightBg,
    asideStyle: styles.basic.aside,
    asideBrandStyle: styles.basic.asideBrand,
    asideMenuCloseLgStyle: styles.basic.asideMenuCloseLg,
    asideMenuLabelStyle: styles.basic.asideMenuLabel,
    asideMenuItemStyle: styles.basic.asideMenuItem,
    asideMenuItemActiveStyle: styles.basic.asideMenuItemActive,
    asideMenuItemInactiveStyle: styles.basic.asideMenuItemInactive,
    asideSubmenuListStyle: styles.basic.asideSubmenuList,
    navBarItemLabelStyle: styles.basic.navBarItemLabel,
    navBarItemLabelHoverStyle: styles.basic.navBarItemLabelHover,
    navBarItemLabelActiveColorStyle: styles.basic.navBarItemLabelActiveColor,
    navBarMenuListUpperLabelStyle: styles.basic.navBarMenuListUpperLabel,
    tableTrStyle: styles.basic.tableTr,
    tableTrOddStyle: styles.basic.tableTrOdd,
    overlayStyle: styles.basic.overlay,

    /* User */
    userName: null,
    userEmail: null,
    userAvatar: null,

    /* organization */
    userOrganizations: [],
    selectedOrganizationIndex: 0,
    selectedOrganizationId: null,

    /* fullScreen - fullscreen form layout (e.g. login page) */
    isFullScreen: false,

    /* Aside */
    isAsideMobileExpanded: false,
    isAsideLgActive: false,
    isAsideCollapsed: false,

    /* Dark mode - hardcoded to true */
    darkMode: true,
  },
  getters: {
    selectedOrganization: (state) => {
      return state.userOrganizations.find(
        (org) => org.id === state.selectedOrganizationId
      );
    },
  },
  mutations: {
    /* A fit-them-all commit */
    basic(state, payload) {
      state[payload.key] = payload.value;
    },

    /* User */
    user(state, payload) {
      if (payload.name) {
        state.userName = payload.name;
      }
      if (payload.email) {
        state.userEmail = payload.email;
      }
      if (payload.avatar) {
        state.userAvatar = payload.avatar;
      }
    },

    setUserOrganizations(state, payload) {
      state.userOrganizations = payload.organizations;
      // Set first organization as selected if available
      if (payload.organizations && payload.organizations.length > 0) {
        state.selectedOrganizationId = payload.organizations[0].id;
        state.selectedOrganizationIndex = 0;
      } else {
        state.selectedOrganizationId = null;
        state.selectedOrganizationIndex = null;
      }
    },
    setSelectedOrganization(state, payload) {
      state.selectedOrganizationId = payload.id;
      state.selectedOrganizationIndex = payload.index;
    },
  },
  actions: {
    setStyle({ commit }) {
      // Apply basic style by default
      const style = styles.basic;
      document.body.className = style.body;
      document.documentElement.className = style.html;

      // Apply each style to state
      for (const key in style) {
        if (!["body", "html"].includes(key)) {
          commit("basic", {
            key: `${key}Style`,
            value: style[key],
          });
        }
      }
    },

    asideMobileToggle({ commit, state }, payload = null) {
      const isShow = payload !== null ? payload : !state.isAsideMobileExpanded;

      document
        .getElementById("app")
        .classList[isShow ? "add" : "remove"]("ml-60", "lg:ml-0");
      document.documentElement.classList[isShow ? "add" : "remove"](
        "m-clipped"
      );

      commit("basic", {
        key: "isAsideMobileExpanded",
        value: isShow,
      });
    },

    asideLgToggle({ commit, state }, payload = null) {
      commit("basic", {
        key: "isAsideLgActive",
        value: payload !== null ? payload : !state.isAsideLgActive,
      });
    },

    asideCollapseToggle({ commit, state }, payload = null) {
      const isCollapsed = payload !== null ? payload : !state.isAsideCollapsed;
      commit("basic", {
        key: "isAsideCollapsed",
        value: isCollapsed,
      });
    },

    fullScreenToggle({ commit }, value) {
      commit("basic", { key: "isFullScreen", value });
      document.documentElement.classList[value ? "add" : "remove"](
        "full-screen"
      );
    },

    darkMode({ commit }) {
      // Always true
      document.documentElement.classList.add("dark");
      commit("basic", {
        key: "darkMode",
        value: true,
      });
    },

    initializeOrganizations({ commit }) {
      // Mock data for organizations
      const mockOrganizations = [
        {
          id: 1,
          currentPlan: "Pro",
          name: "Organization 1",
          config_done: false,
          jobs: [
            {
              id: "swe-1ab2",
              name: "Software Engineer",
              applications: [
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 1,
                  name: "Frederick",
                  email: "frederick@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
                {
                  id: 2,
                  name: "John",
                  email: "john@gmail.com",
                  phone: "(123) 456-7890",
                  status: "Applied",
                  applied_date: "Apr 16, 2025",
                },
              ],
            },
          ],
        },
      ];
      commit("setUserOrganizations", { organizations: mockOrganizations });
    },
  },
});

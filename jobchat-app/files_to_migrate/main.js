import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./css/main.css";

/* Create app instance */
const app = createApp(App);

/* Default title tag */
const defaultDocumentTitle = "Admin One Vue 3 Tailwind";

/* Collapse mobile aside menu on route change */
router.beforeEach((to) => {
  store.dispatch("asideMobileToggle", false);
  store.dispatch("asideLgToggle", false);
});

router.afterEach((to) => {
  /* Set document title from route meta */
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} — ${defaultDocumentTitle}`;
  } else {
    document.title = defaultDocumentTitle;
  }

  /* Full screen mode */
  store.dispatch("fullScreenToggle", !!to.meta.fullScreen);
});

/* Initialize store data */
store.dispatch("setStyle", "basic");
store.dispatch("darkMode", true);
store.dispatch("initializeOrganizations");
store.dispatch("fetch", "clients");
store.dispatch("fetch", "history");

/* Mount app */
app.use(store).use(router).mount("#app");

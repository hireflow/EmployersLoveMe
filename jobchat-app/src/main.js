// src/main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import { motionPlugin } from "@oku-ui/motion";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(motionPlugin);
app.mount("#app");
// i need to add a comment here so that i can commit this file to the repo to triggle the build config to then revaluate the github secrets and then redeploy with the correct key because i fucking uploaded the key to publicly to github in a commit like an idiot
import { defineStore } from "pinia";
import { ref } from "vue";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase.config";
import { auth } from "../firebase.config";

export const useAuthStore = defineStore("auth", () => {
  const functions = getFunctions(app);
  const user = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const orgs = ref([]);
  const selectedOrg = ref(null);

  const setSelectedOrg = (org) => {
    selectedOrg.value = org;
  };

  const fetchUserOrgs = async () => {
    try {
      const fetchUserOrgs = httpsCallable(functions, "fetchUserOrgsByEmail");
      const result = await fetchUserOrgs({
        createdByEmail: user.value.email,
      });
      orgs.value = result.data.orgs;
      if (orgs.value.length > 0) {
        selectedOrg.value = orgs.value[0];
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const initialize = async () => {
    // Set persistence to LOCAL
    await setPersistence(auth, browserLocalPersistence);

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        user.value = firebaseUser;
        loading.value = false;
        if (user.value) {
          fetchUserOrgs();
        }
        resolve(unsubscribe);
      });
    });
  };

  const register = async (email, password, additionalData = {}) => {
    try {
      const registerUser = httpsCallable(functions, "registerUser");
      const result = await registerUser({ email, password, ...additionalData });
      // Automatically sign in the user after successful registration
      await signInWithEmailAndPassword(auth, email, password);
      return result.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      user.value = null;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    initialize,
    register,
    login,
    logout,
    orgs,
    selectedOrg,
    fetchUserOrgs,
    setSelectedOrg,
  };
});

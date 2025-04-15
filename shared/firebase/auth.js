import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
} from "firebase/auth";

import { app } from "./index";

export const auth = getAuth(app);

export const initAuthStateObserver = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export const signUpUserWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    throw {
      success: false,
      code: error.code,
      message: error.message,
      originalError: error,
    };
  }
};

export const signInUserWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    throw {
      success: false,
      code: error.code,
      message: error.message,
      originalError: error,
    };
  }
};

export const setUpRecaptcha = (containerId) => {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "normal",
  });

  return window.recaptchaVerifier;
};

export const startPhoneSignIn = async (phoneNumber, recaptchaContainer) => {
  try {
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    if (!window.recaptchaVerifier) {
      setUpRecaptcha(recaptchaContainer);
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      window.recaptchaVerifier
    );

    window.confirmationResult = confirmationResult;

    return { success: true, confirmationResult };
  } catch (error) {
    throw {
      success: false,
      code: error.code,
      message: error.message,
      originalError: error,
    };
  }
};

export const verifyPhoneCode = async (code) => {
  try {
    if (!window.confirmationResult) {
      throw new Error(
        "No confirmation result found. Please start a phone sign in first."
      );
    }

    const credential = await window.confirmationResult.confirm(code);
    return { success: true, user: credential.user };
  } catch (error) {
    throw {
      success: false,
      code: error.code,
      message: error.message,
    };
  }
};

export const signOutUser = () => auth.signOut();

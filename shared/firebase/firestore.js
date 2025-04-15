import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { app } from "./index";

export const db = getFirestore(app);
export const usersCollection = collection(db, "users");



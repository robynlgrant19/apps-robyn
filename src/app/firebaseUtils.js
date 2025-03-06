import { db } from "@/firebase"; // Ensure your Firebase config is properly set up
import { collection, addDoc } from "firebase/firestore";

export const uploadToFirebase = async (data) => {
  try {
    const docRef = await addDoc(collection(db, "excelData"), { data });
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

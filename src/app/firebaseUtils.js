import { db } from "./firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export const uploadToFirebase = async (data) => {
  try {
    const playersRef = collection(db, "players");

    for (const player of data) {
      const jerseyNumber = player["#"]; 

      if (!jerseyNumber) continue; 

      
      const q = query(playersRef, where("jerseyNumber", "==", jerseyNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        for (const docSnap of querySnapshot.docs) {
          const playerDocRef = doc(db, "players", docSnap.id);

          
          await updateDoc(playerDocRef, {
            stats: player, 
          });

          console.log(`Updated stats for player #${jerseyNumber}`);
        }
      } else {
        console.warn(`No player found with jersey number: ${jerseyNumber}`);
      }
    }

    console.log("All stats updated successfully.");
  } catch (error) {
    console.error("Error updating player stats:", error);
  }
};




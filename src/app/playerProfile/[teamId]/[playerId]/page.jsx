import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { redirect } from "next/navigation";

export default async function PlayerRouter({ params }) {
  const { teamId, playerId } = params;

  const teamSnap = await getDoc(doc(db, "teams", teamId));

  const teamType = teamSnap.exists() ? teamSnap.data().teamType : "college";

  if (teamType === "highschool") {
    return redirect(`/playerProfile/${teamId}/${playerId}/highschool`);
  }

  return redirect(`/playerProfile/${teamId}/${playerId}/college`);
}

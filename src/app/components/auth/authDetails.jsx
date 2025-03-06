"use client";

import React, { useEffect, useState } from 'react';
import { auth, db} from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from "next/navigation";

const AuthDetails = () => {
    const [authUser, setAuthUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const listen = onAuthStateChanged(auth, async (user)=> {
            if (user) {
                setAuthUser(user);
                
                const coachRef = doc(db, "coaches", user.uid);
                const coachSnap = await getDoc(coachRef);
                const playerRef = doc(db, "players", user.uid);
                const playerSnap = await getDoc(playerRef);
                if (coachSnap.exists()) {
                    router.replace("/../pages/homeCoach")
                } else if (playerSnap.exists()) {
                    router.replace("/../pages/homePlayer")
                } else {
                    router.replace("/../pages/admin")
                }
        } else {
                setAuthUser(null);
                //router.replace("/");
            }
        });

        return () => {
            listen();
        }
    }, [router]);

    const userSignOut = () => {
        signOut(auth).then(() => {
            router.replace("/");
        } 
        ).catch(error => console.log(error))
    }
    return (
        <div>{ authUser ? <><button onClick={userSignOut} > Sign Out </button></> : <p></p>}</div>
    )
}

export default AuthDetails;

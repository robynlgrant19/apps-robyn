"use client";

import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from "next/navigation";

const AuthDetails = () => {
    const [authUser, setAuthUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const listen = onAuthStateChanged(auth, (user)=> {
            if (user) {
                setAuthUser(user);
                router.replace("/../pages/home");
            } else{
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
            console.log('Sign out successful');
            router.replace("/");
        } 
        ).catch(error => console.log(error))
    }
    return (
        <div>{ authUser ? <><button onClick={userSignOut} > Sign Out </button></> : <p></p>}</div>
    )
}

export default AuthDetails;

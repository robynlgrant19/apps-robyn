import React, { useState, useEffect } from 'react';
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth"


const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');


    const signIn = (e) => {
        e.preventDefault();
        setErrorMessage('');

        signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            console.log(userCredential);
            setEmail('');
            setPassword('');
        }).catch((error) => {
            
            if (error.code === 'auth/wrong-password') {
                setErrorMessage('Incorrect password. Please try again.');
            } else if (error.code === 'auth/user-not-found') {
                setErrorMessage('No account found with this email.');
            } else {
                setErrorMessage('Something went wrong. Please try again later.');
            }
        });
        
        
    }

    return (
        <div className = 'sign-in-container'>
            <form onSubmit={signIn}>
                <h1> Log In</h1>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    ></input>
                <input 
                    type="password" 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    ></input>
                    <button type="submit"> Log In </button>
            </form>
        </div>
    )
}

export default SignIn
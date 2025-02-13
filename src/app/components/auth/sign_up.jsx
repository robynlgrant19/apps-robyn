import React, { useState, useEffect } from 'react';
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth"

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const signUp = (e) => {
        e.preventDefault();
        setErrorMessage('');

        createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
        console.log(userCredential);
        setEmail('');
        setPassword('');
        setErrorMessage(''); // Reset error message after successful sign-up
    }).catch((error) => {
        if (error.code === 'auth/weak-password') {
            setErrorMessage('Password not long enough. Must be at least 6 characters.');
        } else if (error.code === 'auth/email-already-in-use') {
            setErrorMessage('This email is already in use. Please try a different one.');
        } else {
            setErrorMessage('Something went wrong. Please try again later.');
        }
    });


    }

    return (
        <div className = 'sign-in-container'>
            <form onSubmit={signUp}>
                <h1> Create Account </h1>
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
                    <button type="submit"> Sign Up </button>
            </form>
        </div>
    )
}

export default SignUp

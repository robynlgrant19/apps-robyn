"use client";

import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";  // Correct imports

function App() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);

  const ref = collection(db, "schools");

  // Fetch data once using getDocs
  async function getSchools() {
    setLoading(true);
    const querySnapshot = await getDocs(ref);
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data());
    });
    setSchools(items);
    setLoading(false);
  }

  // Use onSnapshot for real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(ref, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      setSchools(items);
      setLoading(false);
    });

    return () => unsubscribe(); // Clean up the subscription on unmount
  }, []);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <div>
      <h1>Schools</h1>
      {schools.map((school, index) => (
        <div key={index}>
          <h2>{school.title}</h2>
          <p>{school.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default App;






/*
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
     
      
      <header className="bg-green-800 text-white py-6 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Athlete Performance Progression System</h1>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#features" className="hover:text-gray-300">Features</a></li>
              <li><a href="#profiles" className="hover:text-gray-300">Player Profiles</a></li>
              <li><a href="#contact" className="hover:text-gray-300">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      
      <section className="bg-green-50 py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-green-800 mb-4">Track. Analyze. Improve.</h2>
          <p className="text-lg text-green-700 mb-6">
            Empowering the Plymouth State Women’s Ice Hockey Team with data-driven insights to maximize performance.
          </p>
          <a
            href="#features"
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700"
          >
            Learn More
          </a>
        </div>
      </section>

      
      <section id="features" className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-green-800 mb-6">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-4">Data Collection</h4>
              <p className="text-gray-700">Seamlessly integrate Hudl Instat reports to collect detailed player statistics.</p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-4">Performance Analysis</h4>
              <p className="text-gray-700">Analyze player metrics and track improvements over time.</p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-4">Visual Insights</h4>
              <p className="text-gray-700">Generate interactive graphs and reports for actionable insights.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="profiles" className="bg-green-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-green-800 mb-6">Player Profiles</h3>
          <p className="text-gray-700 mb-8">
            Each profile provides a detailed overview of individual performance, helping players identify strengths and areas for growth.
          </p>
          <a
            href="#"
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700"
          >
            View Profiles
          </a>
        </div>
      </section>

     
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-green-800 mb-6">Get in Touch</h3>
          <p className="text-gray-700 mb-8">
            Have questions or need support? Contact us for more information.
          </p>
          <a
            href="#"
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700"
          >
            Contact Us
          </a>
        </div>
      </section>

      
      <footer className="bg-green-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 APPS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
*/







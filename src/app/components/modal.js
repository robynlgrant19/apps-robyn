import React from "react";

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        <button 
          className="absolute top-2 right-2 text-emerald-600 hover:text-emerald-900"
          onClick={onClose}
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
}

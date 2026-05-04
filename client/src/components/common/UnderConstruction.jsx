// src/components/common/UnderConstruction.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Construction } from "lucide-react";

const UnderConstruction = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <Construction className="w-20 h-20 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        🚧 Under Construction
      </h1>
      <p className="text-gray-600 mb-6">This page is currently being built.</p>
      <Link
        to="/dashboard"
        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default UnderConstruction;

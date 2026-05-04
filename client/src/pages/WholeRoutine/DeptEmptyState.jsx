import { Building2 } from "lucide-react";

export const DeptEmptyState = ({ department, type }) => {
  if (type === "no-department") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Enter your department name above to load the full routine.</p>
      </div>
    );
  }

  if (type === "no-classrooms") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
        <p>No classrooms found for department "{department}".</p>
        <p className="text-sm mt-1">
          Make sure classrooms have the correct department set.
        </p>
      </div>
    );
  }

  return null;
};

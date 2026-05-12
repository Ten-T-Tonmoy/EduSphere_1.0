import { Building2 } from "lucide-react";

const DeptHeader = ({ department, onSearch, deptInput, setDeptInput }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(deptInput.trim());
  };

  return (
    <div className="flex justify-center  sm:items-start sm:justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          Department Schedule
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Full routine across all years, batches and classrooms
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          placeholder="e.g. ICE, ICE, EEE"
          value={deptInput}
          onChange={(e) => setDeptInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Load
        </button>
      </form>
    </div>
  );
};

export default DeptHeader;

import React from 'react';

const TeacherSelector = ({ teachers, selectedTeacher, onSelect }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
      <select
        value={selectedTeacher?._id || ''}
        onChange={(e) => {
          const teacher = teachers.find(t => t._id === e.target.value);
          onSelect(teacher || null);
        }}
        className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">-- Choose a teacher --</option>
        {teachers.map(teacher => (
          <option key={teacher._id} value={teacher._id}>
            {teacher.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TeacherSelector;
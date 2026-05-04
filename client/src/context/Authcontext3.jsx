// import React, { createContext, useContext, useState, useEffect } from "react";
// import api from "../utils/Api";

// const AuthContext = createContext(null);

// export const dummyUser = {
//   _id: "642f1c8e5b6f2c0012345678",
//   name: "TNMT",
//   email: "johndoe@example.com",
//   role: "teacher", // can be 'student', 'class_rep', 'teacher', 'admin'
//   avatar: "https://i.pravatar.cc/150?img=3",
//   department: "Computer Science",
//   studentId: "CS2024001",
//   employeeId: "",
//   year: 2,
//   semester: 4,
//   classrooms: [
//     { _id: "641f2b8e5b6f2c0098765432", name: "Math 101" },
//     { _id: "641f2b8e5b6f2c0098765433", name: "Physics 201" },
//   ],
//   isActive: true,
//   createdAt: "2026-02-28T03:00:00.000Z",
//   updatedAt: "2026-02-28T03:30:00.000Z",
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(dummyUser);
//   const [loading, setLoading] = useState(false); // already ready

//   const login = async (email, password) => {
//     setUser(dummyUser); // simulate login
//     return dummyUser;
//   };

//   const register = async (data) => {
//     setUser(dummyUser); // simulate register
//     return dummyUser;
//   };

//   const logout = () => {
//     setUser(null);
//   };

//   const updateUser = (updatedUser) => setUser(updatedUser);

//   return (
//     <AuthContext.Provider
//       value={{ user, loading, login, register, logout, updateUser }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// };

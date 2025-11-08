import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. بيبحث عن التوكن في الـ localStorage
  // (اتأكد إنك بتخزن التوكن بنفس الاسم ده 'token' بعد اللوجن)
  const token = localStorage.getItem('token');

  // 2. لو مفيش توكن (اليوزر مش مسجل دخوله)
  if (!token) {
    // اعمل تحويل (redirect) لصفحة اللوجن
    // replace: بتبدل الصفحة دي في الـ history عشان اليوزر ميرجعش بالسهم
    return <Navigate to="/login" replace />;
  }

  // 3. لو في توكن، اعرض الصفحة اللي هو عايزها (اللي هي الـ children)
  return children;
};

export default ProtectedRoute;
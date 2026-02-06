"use client";
import React from 'react'
import { signInWithGoogle, logout } from "@/lib/userAuth";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from 'react';

const page = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  if (user) {
    return (
      <div>
        <img src={user.photoURL ?? ""} width={40} />
        <p>{user.displayName}</p>
        <button className='bg-amber-400 rounded-full p-3 m-2' onClick={logout}>Logout</button>
      </div>
    );
  }

  return <button className='bg-amber-400 rounded-full p-3 m-2' onClick={signInWithGoogle}>Sign in with Google</button>;
}

export default page

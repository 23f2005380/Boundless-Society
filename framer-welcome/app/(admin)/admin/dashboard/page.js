'use client';
import React from 'react'
import { signOut } from 'next-auth/react';

const page = () => {
    return (
        <section>
            <button onClick={() => signOut({ callbackUrl: "/admin" })}
                className="bg-gradient-to-r from-amber-200 to-orange-200 hover:from-amber-300 hover:to-orange-300 text-amber-900 px-8 py-3 rounded-xl font-medium duration-700 transition-colors whitespace-nowrap cursor-pointer">
                Logout
            </button>
        </section>
    )
}

export default page

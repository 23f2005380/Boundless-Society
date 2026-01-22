"use client";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { table } from "console";

export default async function UsersPage() {
  const snapshot = await getDocs(collection(db, "users"));
  const users = snapshot.docs.map(doc => doc.data());

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Registered Users</h1>
      <table className="w-full text-center">
        <thead>
          <tr >
            <th>Profile</th>
            <th>Name</th>
            <th>Email ID</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.uid}>
              <td><img src={user.photoURL} width={50} /></td>
              <td><p>{user.name}</p></td>
              <td><p>{user.email}</p></td>
            </tr>
          ))}
          </tbody>
      </table>
    </div>
  );
}

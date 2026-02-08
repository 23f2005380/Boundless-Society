"use client";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseEnabled } from "@/lib/firebase";
import { table } from "console";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!isFirebaseEnabled || !db) {
          setError("Firebase is not configured");
          setLoading(false);
          return;
        }

        const snapshot = await getDocs(collection(db, "users"));
        setUsers(snapshot.docs.map(doc => doc.data()));
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch users");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

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

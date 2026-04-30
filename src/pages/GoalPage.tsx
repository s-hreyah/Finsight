import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc
} from "firebase/firestore";

type Goal = {
  id: string;
  title: string;
  target: number;
  saved: number;
};

export default function GoalsPage() {
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  // store per goal input values
  const [addAmounts, setAddAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "goals"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setGoals(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })) as Goal[]
      );
    });

    return () => unsub();
  }, [user]);

  // ADD GOAL
  const addGoal = async () => {
    if (!user || !title || !target) return;

    await addDoc(collection(db, "goals"), {
      title,
      target: Number(target),
      saved: 0,
      userId: user.uid,
      createdAt: new Date()
    });

    setTitle("");
    setTarget("");
  };

  // DELETE
  const deleteGoal = async (id: string) => {
    await deleteDoc(doc(db, "goals", id));
  };

  // UPDATE SAVED (dynamic amount)
  const addSavedAmount = async (goal: Goal) => {
    const amount = addAmounts[goal.id] || 0;

    if (!amount || amount <= 0) return;

    await updateDoc(doc(db, "goals", goal.id), {
      saved: goal.saved + amount
    });

    setAddAmounts((prev) => ({ ...prev, [goal.id]: 0 }));
  };

  return (
    <div className="p-5 text-white">

      <h1 className="text-xl font-bold mb-4">Your Goals 🎯</h1>

      {/* CREATE GOAL */}
      <div className="bg-gray-900 p-3 rounded mb-4 flex flex-col gap-2">
        <input
          placeholder="Goal title (e.g. MacBook 💻)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-black p-2 text-xs rounded"
        />

        <input
          placeholder="Target amount (e.g. 100000)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="bg-black p-2 text-xs rounded"
        />

        <button
          onClick={addGoal}
          className="bg-emerald-500 text-xs py-2 rounded"
        >
          Add Goal
        </button>
      </div>

      {/* GOAL CARDS */}
      <div className="space-y-3">

        {goals.map((g) => {
          const progress = Math.min((g.saved / g.target) * 100, 100);

          return (
            <div key={g.id} className="bg-gray-800 p-4 rounded-xl">

              {/* TITLE */}
              <h2 className="font-bold">{g.title}</h2>

              {/* AMOUNT */}
              <p className="text-xs text-gray-400">
                {g.saved} / {g.target}
              </p>

              {/* PROGRESS BAR */}
              <div className="w-full bg-gray-700 h-2 rounded mt-2">
                <div
                  className="bg-emerald-500 h-2 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* INPUT TO ADD MONEY */}
              <div className="flex gap-2 mt-3">
                <input
                  type="number"
                  placeholder="Add amount"
                  value={addAmounts[g.id] || ""}
                  onChange={(e) =>
                    setAddAmounts({
                      ...addAmounts,
                      [g.id]: Number(e.target.value)
                    })
                  }
                  className="flex-1 bg-black p-2 text-xs rounded"
                />

                <button
                  onClick={() => addSavedAmount(g)}
                  className="text-xs bg-emerald-500 px-3 rounded"
                >
                  Add
                </button>
              </div>

              {/* DELETE */}
              <button
                onClick={() => deleteGoal(g.id)}
                className="text-xs text-red-400 mt-2"
              >
                Delete
              </button>

            </div>
          );
        })}

      </div>

    </div>
  );
}
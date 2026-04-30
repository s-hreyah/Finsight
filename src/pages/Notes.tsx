import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Note = {
  id: string;
  title: string;
  content: string;
  userId: string;
};

export default function NotesPage() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // FETCH NOTES
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notes"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotes(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })) as Note[]
      );
    });

    return () => unsub();
  }, [user]);

  // OPEN NOTE (like mobile app)
  const openNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  // CLOSE NOTE
  const closeNote = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
  };

  // SAVE (auto update)
  const saveNote = async () => {
    if (!selectedNote) return;

    await updateDoc(doc(db, "notes", selectedNote.id), {
      title,
      content
    });

    closeNote();
  };

  // CREATE NEW NOTE (optional quick add)
  const createNote = async () => {
    if (!user) return;

    const docRef = await addDoc(collection(db, "notes"), {
      title: "New Note",
      content: "",
      userId: user.uid,
      createdAt: new Date()
    });

    const newNote = {
      id: docRef.id,
      title: "New Note",
      content: "",
      userId: user.uid
    };

    openNote(newNote);
  };

  /* =========================
     EDIT SCREEN (LIKE MOBILE)
     ========================= */
  if (selectedNote) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col">

        {/* TOP BAR */}
        <div className="p-4 flex justify-between items-center border-b border-gray-800">
          <button onClick={closeNote} className="text-gray-400 text-sm">
            ← Back
          </button>

          <button
            onClick={saveNote}
            className="text-green-400 text-sm font-medium"
          >
            Save
          </button>
        </div>

        {/* EDIT AREA */}
        <div className="p-4 flex flex-col gap-3">

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold bg-transparent outline-none"
            placeholder="Title"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-300 resize-none"
            placeholder="Write your note..."
          />

        </div>
      </div>
    );
  }

  /* =========================
     HOME SCREEN (CARD LIST)
     ========================= */
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col">

      {/* HEADER */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold">Notes</h1>
        <p className="text-xs text-gray-400">Tap to open</p>
      </div>

      {/* LIST */}
      <div className="p-3 space-y-3">

        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => openNote(note)}
            className="bg-[#161622] rounded-2xl p-4 active:scale-[0.98] transition cursor-pointer"
          >
            <h2 className="text-sm font-semibold">
              {note.title || "Untitled"}
            </h2>

            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {note.content || "No content"}
            </p>
          </div>
        ))}

      </div>

      {/* FLOATING BUTTON */}
      <button
        onClick={createNote}
        className="fixed bottom-5 right-5 bg-green-500 w-12 h-12 rounded-full text-xl flex items-center justify-center shadow-lg"
      >
        +
      </button>

    </div>
  );
}
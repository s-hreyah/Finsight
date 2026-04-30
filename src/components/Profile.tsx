import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { motion, AnimatePresence } from "motion/react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
const ProfilePage = () => {
    const user = auth.currentUser;

    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState("");

    const [profile, setProfile] = useState({
        fullname: "",
        email: "",
        phone: "",
        photoURL: ""
    });

    // FETCH PROFILE
    const fetchProfile = async () => {
        if (!user) return;

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            console.log("snap doc: ", snap.data())
            setProfile({
                fullname: snap.data().fullname || "",
                email: snap.data().email || "",
                phone: snap.data().phone || "",
                photoURL: snap.data().photoURL || ""
            });
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e: any) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };
    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setProfile((prev) => ({
                ...prev,
                photoURL: reader.result
            }));
        };

        reader.readAsDataURL(file);
        const base64 = await convertToBase64(file);
        await updateDoc(doc(db, "users", user?.uid ?? ""), {
            photoURL: base64
        });
    };
    const handleSave = async () => {
        if (!user) return;

        await updateDoc(doc(db, "users", user.uid), {
            fullname: profile.fullname,
            phone: profile.phone,
            photoURL: profile.photoURL, // base64 image
        });

        setIsOpen(false);
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Loading profile...
            </div>
        );
    }
    console.log("profile: ", profile)
    return (
        <div className="max-w-3xl mx-auto text-gray-300 relative">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-white text-xl font-bold">My Profile</h2>

                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                    Set Profile
                </button>
            </div>

            {/* PROFILE CARD */}
            <div className="bg-[#0F1115] border border-gray-800 rounded-xl p-6">

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                        {profile.photoURL ? (
                            <img src={profile.photoURL} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-lg">
                                {profile.fullname?.[0] || "U"}
                            </span>
                        )}
                    </div>

                    <div>
                        <p className="text-white font-semibold">
                            {profile.fullname || "No name set"}
                        </p>
                        <p className="text-gray-500 text-sm">
                            {profile.email || "No email"}
                        </p>
                    </div>
                </div>

                {/* INFO */}
                <div className="space-y-4">

                    <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-white">
                            {profile.fullname || "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-white">
                            {profile.email || "-"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-white">
                            {profile.phone || "-"}
                        </p>
                    </div>

                </div>
            </div>

            {/* MODAL */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="w-full max-w-md bg-[#0F1115] border border-gray-800 rounded-xl p-6"
                        >

                            <h3 className="text-white text-lg font-bold mb-4">
                                Edit Profile
                            </h3>

                            <div className="space-y-3">

                                <input
                                    name="fullname"
                                    value={profile.fullname}
                                    onChange={handleChange}
                                    placeholder="Full Name"
                                    className="w-full bg-[#0A0B0D] border border-gray-700 px-3 py-2 rounded-lg text-white"
                                />

                                <input
                                    name="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-gray-400"
                                />

                                <input
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    placeholder="Phone"
                                    className="w-full bg-[#0A0B0D] border border-gray-700 px-3 py-2 rounded-lg text-white"
                                />

                                <div className="space-y-2">
                                    <p className="text-xs text-gray-400">Profile Image</p>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="w-full text-sm text-gray-300"
                                    />

                                    {/* preview */}
                                    {(preview || profile.photoURL) && (
                                        <img
                                            src={preview || profile.photoURL}
                                            className="w-20 h-20 rounded-full object-cover border border-gray-700"
                                        />
                                    )}
                                </div>

                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg"
                                >
                                    Save
                                </button>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 bg-gray-800 text-white py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ProfilePage;
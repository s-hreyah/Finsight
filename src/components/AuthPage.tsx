import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { LogIn, UserPlus, Github, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, setDoc } from "firebase/firestore";


export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullname, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phonenumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };





  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);

      } else {
        console.log("creating user");

        const res = await createUserWithEmailAndPassword(auth, email, password);

        const user = res.user;


        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: new Date(),
          fullname: fullname,
          uid: user.uid,
          phonenumber: phonenumber
        });

        console.log("User saved in Firestore");
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0F1115] border border-gray-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">FINSIGHT</h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Predictive Financial Engine</p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-2.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Continue with Google
          </button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span className="bg-[#0F1115] px-4 text-gray-500">Or via Email</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {
            !isLogin && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullname}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="your name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phonenumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="your phone number"
                  />
                </div>
              </>
            )}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A0B0D] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A0B0D] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{error}</p>}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
          >
            {isLogin ? 'Initialize Session' : 'Create Profile'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Create Profile" : "Already have a profile? Initialize Session"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

import { motion } from "motion/react";
import { Award, ShieldAlert, Sparkles, Navigation } from "lucide-react";

interface SplashProps {
  onDismiss: () => void;
}

export default function Splash({ onDismiss }: SplashProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-between p-8 z-50 text-white">
      {/* Decorative top background elements */}
      <div className="absolute top-0 inset-x-0 h-40 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />

      {/* Top Tagline */}
      <div className="mt-8 flex items-center gap-2 text-sky-200 font-medium tracking-widest text-xs uppercase">
        <Sparkles className="w-4 h-4 animate-pulse text-sky-200" />
        Andhra Pradesh Skill Initiative
      </div>

      {/* Center Brand */}
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl mb-6"
        >
          <Award className="w-14 h-14 text-white" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-extrabold font-display tracking-tight text-white mb-2"
        >
          AI Skill Bridge
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-sky-100 text-sm max-w-sm"
        >
          Connecting talent, students, companies, and locations through real-time AI skill ecosystem matching.
        </motion.p>
      </div>

      {/* Bottom Launch Button & Footer */}
      <div className="w-full max-w-xs flex flex-col items-center gap-6 mb-8">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          onClick={onDismiss}
          className="w-full py-4 bg-white text-blue-700 hover:bg-sky-50 font-bold text-base rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
        >
          Launch Ecosystem
          <Navigation className="w-4 h-4 rotate-90" />
        </motion.button>

        <div className="text-center text-sky-200/60 text-xs">
          Built with Material 3 Design Guidelines
        </div>
      </div>
    </div>
  );
}

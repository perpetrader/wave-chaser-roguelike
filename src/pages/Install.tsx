import { Link } from "react-router-dom";
import { ArrowLeft, Download, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Games
      </Link>

      <div className="max-w-md mx-auto text-center space-y-8">
        <img
          src="/pwa-192x192.png"
          alt="App Icon"
          className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
        />

        <div>
          <h1 className="text-3xl font-display text-cyan-400 mb-2">
            Install Dan's Arcade
          </h1>
          <p className="text-white/70">
            Add to your home screen for the best experience — play offline and launch instantly!
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6">
            <p className="text-green-400 font-semibold text-lg">✓ App Installed!</p>
            <p className="text-white/70 text-sm mt-2">
              You can now find the app on your home screen.
            </p>
          </div>
        ) : deferredPrompt ? (
          <Button
            onClick={handleInstallClick}
            size="lg"
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 text-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Install App
          </Button>
        ) : isIOS ? (
          <div className="bg-slate-800/50 rounded-xl p-6 text-left space-y-4">
            <p className="text-white/90 font-semibold text-center mb-4">
              To install on iOS:
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Share className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-white/70">
                Tap the <span className="text-cyan-400 font-semibold">Share</span> button in Safari
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-white/70">
                Select <span className="text-cyan-400 font-semibold">"Add to Home Screen"</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-6 text-left space-y-4">
            <p className="text-white/90 font-semibold text-center mb-4">
              To install on Android:
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <MoreVertical className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-white/70">
                Tap the <span className="text-cyan-400 font-semibold">menu</span> (⋮) in Chrome
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-white/70">
                Select <span className="text-cyan-400 font-semibold">"Install app"</span> or <span className="text-cyan-400 font-semibold">"Add to Home screen"</span>
              </p>
            </div>
          </div>
        )}

        <p className="text-white/50 text-sm">
          Works offline • No app store needed • Always up to date
        </p>
      </div>
    </div>
  );
};

export default Install;

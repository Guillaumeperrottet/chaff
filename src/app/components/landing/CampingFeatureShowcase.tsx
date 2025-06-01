import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Maximize, X } from "lucide-react";

interface FeatureProps {
  title: string;
  description: string;
  videoSrc: string;
  poster?: string;
  alignRight?: boolean;
}

const SimpleVideoFeature: React.FC<FeatureProps> = ({
  title,
  description,
  videoSrc,
  poster,
  alignRight = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (fullscreenVideoRef.current && isFullscreen) {
          fullscreenVideoRef.current.pause();
        }
      } else {
        videoRef.current.play().catch((e) => {
          console.error("Erreur lors de la lecture de la vidéo:", e);
          setIsPlaying(false);
        });
        if (fullscreenVideoRef.current && isFullscreen) {
          fullscreenVideoRef.current.play().catch((e) => console.error(e));
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    // Synchroniser l'état de lecture
    if (isPlaying && fullscreenVideoRef.current) {
      setTimeout(() => {
        if (fullscreenVideoRef.current) {
          fullscreenVideoRef.current.play().catch((e) => console.error(e));
        }
      }, 100);
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  // Réinitialiser l'état de lecture lorsque la vidéo se termine
  useEffect(() => {
    const videoElement = videoRef.current;
    const fullscreenVideoElement = fullscreenVideoRef.current;

    const handleEnded = () => setIsPlaying(false);

    if (videoElement) {
      videoElement.addEventListener("ended", handleEnded);
    }

    if (fullscreenVideoElement) {
      fullscreenVideoElement.addEventListener("ended", handleEnded);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("ended", handleEnded);
      }
      if (fullscreenVideoElement) {
        fullscreenVideoElement.removeEventListener("ended", handleEnded);
      }
    };
  }, []);

  // Synchroniser la position des vidéos
  useEffect(() => {
    if (isFullscreen && videoRef.current && fullscreenVideoRef.current) {
      fullscreenVideoRef.current.currentTime = videoRef.current.currentTime;
    }
  }, [isFullscreen]);

  // Désactiver le défilement lorsque en plein écran
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  return (
    <>
      <div
        className={`flex flex-col ${
          alignRight ? "md:flex-row-reverse" : "md:flex-row"
        } items-center gap-8 my-16`}
      >
        {/* Partie texte */}
        <motion.div
          className="w-full md:w-1/2 p-6"
          initial={{ opacity: 0, x: alignRight ? 50 : -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#141313]">
            {title}
          </h3>
          <p className="text-[#62605d] text-lg">{description}</p>
        </motion.div>

        {/* Partie vidéo */}
        <motion.div
          className="w-full md:w-1/2 relative rounded-2xl overflow-hidden shadow-xl border-4 border-white"
          initial={{ opacity: 0, x: alignRight ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Overlay pour effet visuel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />

          {/* Vidéo */}
          <video
            ref={videoRef}
            src={videoSrc}
            poster={poster}
            className="w-full h-full object-cover aspect-video"
            playsInline
            muted
            loop
          />

          {/* Contrôles vidéo */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between">
            {/* Bouton play/pause */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-[#d9840d]/90 text-white flex items-center justify-center hover:bg-[#d9840d] transition-colors shadow-lg backdrop-blur-sm"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? (
                <Pause size={20} />
              ) : (
                <Play size={20} className="ml-1" />
              )}
            </motion.button>

            {/* Bouton plein écran */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={openFullscreen}
              className="w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/40 transition-colors shadow-lg backdrop-blur-sm"
              aria-label="Plein écran"
            >
              <Maximize size={16} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Modal de la vidéo en plein écran */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          >
            {/* En-tête avec titre et bouton de fermeture */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-medium">{title}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} className="ml-0.5" />
                  )}
                </button>
                <button
                  onClick={closeFullscreen}
                  className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Vidéo en plein écran */}
            <div className="relative w-full max-w-6xl h-full max-h-[80vh] rounded-xl overflow-hidden">
              <video
                ref={fullscreenVideoRef}
                src={videoSrc}
                poster={poster}
                className="w-full h-full object-contain"
                playsInline
                muted
                loop
                autoPlay={isPlaying}
                onClick={togglePlayPause}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Composant principal qui assemble les 3 sections de fonctionnalités
const CampingFeatureShowcase = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Première fonctionnalité - Texte à gauche, vidéo à droite */}
      <SimpleVideoFeature
        title="Visualisation interactive"
        description="Permet de naviguer virtuellement dans votre camping, hôtel, appartement. Visualisez tous vos emplacements, animations et équipements en quelques clics. Et ce, même sur mobile !"
        videoSrc="/videos/feature-camping-map.mp4"
        poster="/images/features/camping-map-poster.jpg"
      />

      {/* Seconde fonctionnalité - Texte à droite, vidéo à gauche */}
      <SimpleVideoFeature
        title="Gestion des tâches simplifiée"
        description="Centralisez toutes vos tâches et notifications dans un seul endroit. Assurez-vous que rien n'est oublié."
        videoSrc="/videos/feature-task.mp4"
        poster="/images/features/feature-task.jpg"
        alignRight={true}
      />

      {/* Troisième fonctionnalité - Texte à gauche, vidéo à droite */}
      <SimpleVideoFeature
        title="Communication facilitée"
        description="Assignez des tâches à vos équipes, soyez notifié, garder un historique, et imprimer vos tâches en un clic."
        videoSrc="/videos/feature-communication.mp4"
        poster="/images/features/communication-poster.jpg"
      />
    </div>
  );
};

export default CampingFeatureShowcase;

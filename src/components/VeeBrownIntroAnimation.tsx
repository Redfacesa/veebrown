'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import VeeBrownLogo from '@/components/VeeBrownLogo';

/** Splash / loader with VV Brown Fragrances logo */
export default function VeeBrownIntroAnimation({ onDone }: { onDone?: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2200);
    return () => window.clearTimeout(hide);
  }, [onDone]);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-vbrown-charcoal"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.7, duration: 0.5 }}
    >
      <motion.div
        animate={{ scale: [1, 1.02, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="mb-6"
      >
        <VeeBrownLogo href="" size="hero" />
      </motion.div>
      <p className="text-xs tracking-[0.3em] uppercase text-vbrown-cream/50">VV Brown Fragrances</p>
    </motion.div>
  );
}

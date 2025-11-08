import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaWhatsapp, FaLinkedin, FaInstagram } from 'react-icons/fa';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="w-full py-12 flex flex-col items-center justify-center"
    >
      <p className="text-slate-400 text-sm">{t('footer.designedBy')}</p>
      <div className="flex flex-row gap-6 mt-4">
        <motion.a
          href="https://wa.me/201050586075"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-slate-400 text-2xl hover:text-emerald-400 transition-all duration-300"
        >
          <FaWhatsapp />
        </motion.a>
        <motion.a
          href="https://www.linkedin.com/in/mohammed-maklad-469557381/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-slate-400 text-2xl hover:text-emerald-400 transition-all duration-300"
        >
          <FaLinkedin />
        </motion.a>
        <motion.a
          href="https://www.instagram.com/mv7amed_maklad/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-slate-400 text-2xl hover:text-emerald-400 transition-all duration-300"
        >
          <FaInstagram />
        </motion.a>
      </div>
    </motion.footer>
  );
}


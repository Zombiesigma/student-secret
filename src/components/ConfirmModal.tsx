/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass rounded-[2rem] p-8 border border-glass-border shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-purple-500/10 text-purple-500'}`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-bold">{title}</h3>
            </div>

            <p className="text-muted mb-8 leading-relaxed">
              {message}
            </p>

            <div className="flex items-center gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-text/5 hover:bg-text/10 transition-all text-muted hover:text-text"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-lg text-white ${
                  variant === 'danger' 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' 
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

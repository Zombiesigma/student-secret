/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  ClipboardList, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  Ghost
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Survey, SurveyResponse } from '../types';

export default function SurveyUserView() {
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simplified query to avoid composite index requirement
    const q = query(
      collection(db, 'surveys'), 
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSurveys = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Survey[];
      // Filter active surveys in memory
      setActiveSurveys(allSurveys.filter(s => s.active === true));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!selectedSurvey || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const responseData = {
        surveyId: selectedSurvey.id,
        answers,
        timestamp: Date.now()
      };
      await addDoc(collection(db, 'survey_responses'), responseData);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedSurvey(null);
        setAnswers({});
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;
  if (activeSurveys.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-purple-500" />
        </div>
        <h2 className="text-xl font-display font-bold">Active Surveys</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeSurveys.map((survey) => (
          <motion.button
            key={survey.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedSurvey(survey)}
            className="glass p-6 rounded-3xl border border-glass-border text-left group transition-all hover:border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">{survey.title}</h3>
              <ChevronRight className="w-5 h-5 text-muted group-hover:text-purple-500 transition-all group-hover:translate-x-1" />
            </div>
            <p className="text-sm text-muted line-clamp-2">{survey.description}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedSurvey && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setSelectedSurvey(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              {isSuccess ? (
                <div className="py-20 text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-2xl font-display font-bold mb-2">Thank You!</h3>
                  <p className="text-muted">Your anonymous response has been recorded.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-display font-bold">{selectedSurvey.title}</h2>
                      <p className="text-muted text-sm mt-1">{selectedSurvey.description}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedSurvey(null)}
                      disabled={isSubmitting}
                      className="p-2 hover:bg-text/10 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-8 mb-10">
                    {selectedSurvey.questions.map((q, idx) => (
                      <div key={q.id} className="space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-purple-500 mt-1">Q{idx + 1}</span>
                          <h4 className="text-lg font-medium">{q.question}</h4>
                        </div>

                        {q.type === 'multiple-choice' ? (
                          <div className="grid grid-cols-1 gap-2 pl-7">
                            {q.options?.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${answers[q.id] === opt ? 'bg-purple-600/20 border-purple-500 text-text' : 'bg-text/5 border-glass-border text-muted hover:bg-text/10'}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea 
                            placeholder="Your answer..."
                            className="w-full bg-text/5 border border-glass-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-32 pl-7"
                            value={answers[q.id] || ''}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || Object.keys(answers).length < selectedSurvey.questions.length}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-900/40"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                    Submit Anonymously
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

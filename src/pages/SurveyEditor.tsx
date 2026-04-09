/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  ListTodo, 
  AlignLeft, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { SurveyQuestion, SurveyQuestionType } from '../types';
import ConfirmModal from '../components/ConfirmModal';

export default function SurveyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Partial<SurveyQuestion>[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchSurvey = async () => {
        try {
          const snap = await getDoc(doc(db, 'surveys', id));
          if (snap.exists()) {
            const data = snap.data();
            setTitle(data.title);
            setDescription(data.description);
            setQuestions(data.questions);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchSurvey();
    }
  }, [id]);

  const addQuestion = (type: SurveyQuestionType) => {
    setQuestions([...questions, { 
      id: Math.random().toString(36).substr(2, 9), 
      type, 
      question: '', 
      options: type === 'multiple-choice' ? ['', ''] : undefined 
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = [...(newQuestions[qIndex].options || []), ''];
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options) {
      newQuestions[qIndex].options![oIndex] = value;
    }
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!title || questions.length === 0) {
      alert('Please provide a title and at least one question.');
      return;
    }
    setIsSubmitting(true);

    try {
      const surveyData = {
        title,
        description,
        questions,
        active: true,
        timestamp: Date.now()
      };

      if (id) {
        await updateDoc(doc(db, 'surveys', id), surveyData);
      } else {
        await addDoc(collection(db, 'surveys'), surveyData);
      }
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert('Failed to save survey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text pb-20">
      <nav className="glass border-b border-glass-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-2 text-text/40 hover:text-text transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Admin
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {id ? 'Update Survey' : 'Publish Survey'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="space-y-8">
          <div className="glass rounded-[2.5rem] p-8 space-y-6 border-white/5">
            <input 
              type="text" 
              placeholder="Survey Title"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-3xl font-display font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea 
              placeholder="Add a description or instructions for respondents..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Questions</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => addQuestion('multiple-choice')}
                  className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-bold"
                >
                  <ListTodo className="w-4 h-4 text-blue-500" />
                  Multiple Choice
                </button>
                <button 
                  onClick={() => addQuestion('essay')}
                  className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-bold"
                >
                  <AlignLeft className="w-4 h-4 text-purple-500" />
                  Essay Question
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <motion.div 
                  key={q.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-[2rem] p-8 border border-white/5 relative group"
                >
                  <button 
                    onClick={() => removeQuestion(idx)}
                    className="absolute top-6 right-6 p-2 text-white/20 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/20">
                      {q.type?.replace('-', ' ')}
                    </span>
                  </div>

                  <input 
                    type="text" 
                    placeholder="Enter your question..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 mb-6"
                    value={q.question}
                    onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                  />

                  {q.type === 'multiple-choice' && (
                    <div className="space-y-3 pl-6 border-l-2 border-white/5">
                      {q.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full border-2 border-white/20" />
                          <input 
                            type="text" 
                            placeholder={`Option ${oIdx + 1}`}
                            className="flex-1 bg-transparent border-b border-white/5 py-2 text-base focus:border-purple-500 outline-none transition-colors"
                            value={opt}
                            onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                          />
                          {q.options!.length > 2 && (
                            <button 
                              onClick={() => {
                                const newOpts = q.options!.filter((_, i) => i !== oIdx);
                                updateQuestion(idx, 'options', newOpts);
                              }}
                              className="text-white/20 hover:text-rose-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button 
                        onClick={() => addOption(idx)}
                        className="text-sm font-bold text-purple-500 hover:text-purple-400 mt-4 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}

              {questions.length === 0 && (
                <div className="py-20 text-center glass rounded-[2.5rem] border-dashed border-2 border-white/5">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 font-display">Start by adding a question above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ConfirmModal 
        isOpen={showExitConfirm}
        title="Discard Changes?"
        message="Are you sure you want to leave? Any unsaved changes to this survey will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="danger"
        onConfirm={() => navigate('/admin')}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}

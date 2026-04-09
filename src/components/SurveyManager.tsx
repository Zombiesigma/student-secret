/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  Edit2
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Survey, SurveyQuestion, SurveyQuestionType, SurveyResponse } from '../types';
import ConfirmModal from './ConfirmModal';

export default function SurveyManager() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  useEffect(() => {
    const q = query(collection(db, 'surveys'), orderBy('timestamp', 'desc'));
    const unsubSurveys = onSnapshot(q, (snapshot) => {
      setSurveys(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Survey[]);
      setLoading(false);
    });

    const unsubResponses = onSnapshot(collection(db, 'survey_responses'), (snapshot) => {
      setResponses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as SurveyResponse[]);
    });

    return () => {
      unsubSurveys();
      unsubResponses();
    };
  }, []);

  const handleDeleteSurvey = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Survey',
      message: 'Are you sure you want to delete this survey and all its responses? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'surveys', id));
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const toggleSurveyStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'surveys', id), { active: !currentStatus });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Surveys</h2>
          <p className="text-muted text-sm">Create and manage anonymous surveys</p>
        </div>
        <button 
          onClick={() => navigate('/admin/survey/new')}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
        >
          <Plus className="w-5 h-5" />
          New Survey
        </button>
      </div>

      {/* Survey List */}
      <div className="grid grid-cols-1 gap-6">
        {surveys.map((survey) => {
          const surveyResponses = responses.filter(r => r.surveyId === survey.id);
          return (
            <motion.div 
              key={survey.id}
              layout
              className="glass rounded-[2rem] p-6 sm:p-8 border border-glass-border hover:border-text/10 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{survey.title}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${survey.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-text/5 text-muted'}`}>
                      {survey.active ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-muted text-sm line-clamp-2">{survey.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(`/admin/survey/edit/${survey.id}`)}
                    className="p-3 bg-text/5 hover:bg-text/10 rounded-xl transition-all text-muted hover:text-text"
                    title="Edit Survey"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => toggleSurveyStatus(survey.id, survey.active)}
                    className="p-3 bg-text/5 hover:bg-text/10 rounded-xl transition-all text-muted hover:text-text"
                    title={survey.active ? 'Deactivate' : 'Activate'}
                  >
                    {survey.active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => handleDeleteSurvey(survey.id)}
                    className="p-3 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all text-muted hover:text-rose-500"
                    title="Delete Survey"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-text/5 rounded-2xl p-4">
                  <p className="text-muted text-[10px] uppercase font-bold mb-1">Questions</p>
                  <p className="text-xl font-bold">{survey.questions.length}</p>
                </div>
                <div className="bg-text/5 rounded-2xl p-4">
                  <p className="text-muted text-[10px] uppercase font-bold mb-1">Responses</p>
                  <p className="text-xl font-bold">{surveyResponses.length}</p>
                </div>
                <div className="bg-text/5 rounded-2xl p-4">
                  <p className="text-muted text-[10px] uppercase font-bold mb-1">Created</p>
                  <p className="text-sm font-bold">{new Date(survey.timestamp).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => navigate(`/admin/survey/results/${survey.id}`)}
                  className="bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center justify-center transition-all group"
                >
                  <BarChart3 className="w-5 h-5 text-purple-500 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] uppercase font-bold text-purple-400">View Results</span>
                </button>
              </div>
            </motion.div>
          );
        })}

        {surveys.length === 0 && (
          <div className="py-20 text-center glass rounded-[2.5rem] border-glass-border">
            <div className="w-16 h-16 bg-text/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted" />
            </div>
            <p className="text-muted font-display">No surveys created yet.</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

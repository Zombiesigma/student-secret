/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  BarChart3, 
  Users, 
  Clock,
  ChevronRight,
  PieChart as PieChartIcon,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Survey, SurveyResponse } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function SurveyResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const surveySnap = await getDoc(doc(db, 'surveys', id));
        if (surveySnap.exists()) {
          setSurvey({ id: surveySnap.id, ...surveySnap.data() } as Survey);
        }

        const responsesQuery = query(collection(db, 'survey_responses'), where('surveyId', '==', id));
        const responsesSnap = await getDocs(responsesQuery);
        setResponses(responsesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SurveyResponse[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const stats = useMemo(() => {
    if (!survey || responses.length === 0) return [];

    return survey.questions.map(q => {
      if (q.type === 'multiple-choice') {
        const counts: Record<string, number> = {};
        q.options?.forEach(opt => counts[opt] = 0);
        responses.forEach(r => {
          const answer = r.answers[q.id];
          if (typeof answer === 'string' && counts[answer] !== undefined) {
            counts[answer]++;
          }
        });
        return {
          question: q.question,
          type: q.type,
          data: Object.entries(counts).map(([name, value]) => ({ name, value }))
        };
      } else {
        return {
          question: q.question,
          type: q.type,
          answers: responses.map(r => r.answers[q.id]).filter(Boolean)
        };
      }
    });
  }, [survey, responses]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!survey || responses.length === 0) return;

    const headers = ['Timestamp', ...survey.questions.map(q => q.question)];
    const rows = responses.map(r => [
      new Date(r.timestamp).toLocaleString(),
      ...survey.questions.map(q => {
        const ans = r.answers[q.id];
        return Array.isArray(ans) ? ans.join('; ') : ans;
      })
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `survey_results_${survey.title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-text">
        <p className="text-xl font-display mb-4">Survey not found.</p>
        <button onClick={() => navigate('/admin')} className="text-purple-500 font-bold">Back to Admin</button>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-bg text-text pb-20 print:bg-white print:text-black">
      <nav className="glass border-b border-glass-border px-6 py-4 sticky top-0 z-50 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-text/40 hover:text-text transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Admin
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={handleDownloadCSV}
              className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">{survey.title}</h1>
              <p className="text-white/40">{survey.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <div className="glass rounded-3xl p-6 border-white/5">
              <div className="flex items-center gap-3 text-purple-500 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Total Responses</span>
              </div>
              <p className="text-4xl font-display font-bold">{responses.length}</p>
            </div>
            <div className="glass rounded-3xl p-6 border-white/5">
              <div className="flex items-center gap-3 text-blue-500 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Questions</span>
              </div>
              <p className="text-4xl font-display font-bold">{survey.questions.length}</p>
            </div>
            <div className="glass rounded-3xl p-6 border-white/5">
              <div className="flex items-center gap-3 text-emerald-500 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Status</span>
              </div>
              <p className="text-2xl font-display font-bold">{survey.active ? 'Active' : 'Closed'}</p>
            </div>
          </div>
        </header>

        <div className="space-y-12">
          {stats.map((stat, idx) => (
            <section key={idx} className="glass rounded-[2.5rem] p-8 border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-white/40">
                  {idx + 1}
                </span>
                <h3 className="text-xl font-bold">{stat.question}</h3>
              </div>

              {stat.type === 'multiple-choice' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stat.data} layout="vertical" margin={{ left: 40, right: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100} 
                          stroke="#ffffff40" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#ffffff05' }}
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {stat.data?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stat.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stat.data?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                  {(stat.answers as any[])?.map((ans, aIdx) => (
                    <div key={aIdx} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-sm text-white/80 italic">"{ans}"</p>
                    </div>
                  ))}
                  {(!stat.answers || stat.answers.length === 0) && (
                    <p className="text-white/20 text-center py-8">No responses yet.</p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

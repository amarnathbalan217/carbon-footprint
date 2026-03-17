import React, { useEffect, useState } from 'react';
import { Lightbulb, Leaf, Sparkles, TrendingDown, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleGenAI } from '@google/genai';

interface Recommendation {
  id: number | string;
  title: string;
  description: string;
  impact: string;
  difficulty: string;
  category: string;
  color: string;
  bg: string;
  longDescription?: string;
}

interface InsightsData {
  recommendations: Recommendation[];
  impact: {
    totalSaved: number;
    trees: number;
    km: number;
    meatlessDays: number;
  };
  topSource?: string;
  totalEmissions?: number;
}

interface InsightsProps {
  onSwitchTab?: (tab: string) => void;
}

export const Insights: React.FC<InsightsProps> = ({ onSwitchTab }) => {
  const { language, t: globalT } = useLanguage();
  const t = globalT.insights;
  
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const apiKey = localStorage.getItem('gemini_api_key');

  const getLocalAnalysis = (activities: any[], travel: any[]): InsightsData => {
    const manualTotal = activities.reduce((acc: number, curr: any) => acc + (Number(curr.emissions) || 0), 0);
    const travelTotal = travel.reduce((acc: number, curr: any) => acc + (Number(curr.emissions) || 0), 0);
    const total = manualTotal + travelTotal;
    
    const catTotals: Record<string, number> = { transport: travelTotal, energy: 0, food: 0, lpg: 0 };
    activities.forEach(a => {
        if (a.category && catTotals.hasOwnProperty(a.category)) {
            catTotals[a.category] = (catTotals[a.category] || 0) + (Number(a.emissions) || 0);
        }
    });

    const categoriesWithData = Object.entries(catTotals).filter(([_, val]) => val > 0.000001);
    const topCat = categoriesWithData.length > 0 ? categoriesWithData.sort((a, b) => b[1] - a[1])[0][0] : 'general';
    
    const recommendations: Recommendation[] = [];
    const recLibrary: Record<string, Recommendation[]> = {
        transport: [{
            id: 'tr1', title: language === 'ml' ? 'യാത്രകൾ പുനഃക്രമീകരിക്കുക' : 'Optimize Your Travels',
            description: language === 'ml' ? 'യാത്രകളിൽ നിന്നുള്ള കാർബൺ അളവ് കുറയ്ക്കൂ.' : 'Reduce your commuting footprint.',
            longDescription: language === 'ml' ? 'കാർപൂളിംഗ് അല്ലെങ്കിൽ പൊതുഗതാഗതം പരീക്ഷിക്കുന്നത് വഴി പ്രതിവർഷം 0.5 ടൺ കാർബൺ വരെ കുറയ്ക്കാം.' : 'Your transport logs show high reliance on cars. Transitioning to carpooling or public transit just twice a week can slash your footprint.',
            impact: '0.5 tons/yr', difficulty: 'Medium', category: 'Transport', color: 'text-blue-600', bg: 'bg-blue-100'
        }],
        energy: [{
            id: 'en1', title: language === 'ml' ? 'വൈദ്യുതി ഉപയോഗം കുറയ്ക്കുക' : 'Eco-Energy Mode',
            description: language === 'ml' ? 'വീട്ടിലെ വൈദ്യുതി ലാഭിക്കാനുള്ള വഴികൾ.' : 'Simple home hacks to lower electricity consumption.',
            longDescription: language === 'ml' ? 'പകൽ സമയങ്ങളിൽ ജനലുകൾ തുറന്നിടുക, അനാവശ്യമായി പ്രവർത്തിക്കുന്ന ലൈറ്റുകൾ ഒഴിവാക്കുക.' : 'Switching to LED lighting and ensuring appliances aren\'t left on standby mode can reduce emissions by up to 15%.',
            impact: '0.3 tons/yr', difficulty: 'Easy', category: 'Energy', color: 'text-amber-600', bg: 'bg-amber-100'
        }],
        food: [{
            id: 'fo1', title: language === 'ml' ? 'ഭക്ഷണരീതി മാറ്റുക' : 'Sustainable Diet',
            description: language === 'ml' ? 'ഭക്ഷണത്തിലൂടെ കാർബൺ അളവ് കുറയ്ക്കാം.' : 'Shift your diet to protect the planet slowly.',
            longDescription: language === 'ml' ? 'സസ്യാഹാരം ശീലമാക്കുന്നത് കാർബൺ അളവ് കുറയ്ക്കാൻ സഹായിക്കും.' : 'Animal agriculture is a major emission source. Increasing plant-based meals significantly reduces your overhang.',
            impact: '0.2 tons/yr', difficulty: 'Easy', category: 'Food', color: 'text-green-600', bg: 'bg-green-100'
        }],
        lpg: [{
            id: 'lp1', title: language === 'ml' ? 'പാചക വാതകം ശ്രദ്ധിക്കൂ' : 'Fuel Efficiency',
            description: language === 'ml' ? 'ഗ്യാസ് ലാഭിക്കാനുള്ള നിർദ്ദേശങ്ങൾ.' : 'Save fuel and gas during your daily cooking.',
            longDescription: language === 'ml' ? 'പാചകത്തിനിടെ പാത്രങ്ങൾ അടച്ചുവെക്കുന്നതും പ്രഷർ കുക്കർ ഉപയോഗിക്കുന്നതും ഗ്യാസ് ലാഭിക്കാൻ സഹായിക്കും.' : 'Using lids and pressure cookers can save up to 20% of your LPG fuel.',
            impact: '0.1 tons/yr', difficulty: 'Easy', category: 'LPG', color: 'text-orange-600', bg: 'bg-orange-100'
        }],
        general: [{
            id: 'gen1', title: language === 'ml' ? 'മരം നട്ടുപിടിപ്പിക്കുക' : 'Plant a Sapling',
            description: language === 'ml' ? 'പ്രകൃതിയെ സംരക്ഷിക്കാനുള്ള മാർഗ്ഗം.' : 'The ultimate way to offset your footprint.',
            longDescription: language === 'ml' ? 'ഒരു മരം നട്ടുപിടിപ്പിക്കുന്നത് വായു ശുദ്ധീകരിക്കാനും കാർബൺ അളവ് കുറയ്ക്കാനും സഹായിക്കും.' : 'A mature tree absorbs nearly 22kg of CO2 per year. Planting local trees is the most tangible way to help.',
            impact: 'Offsetting', difficulty: 'Medium', category: 'Nature', color: 'text-emerald-600', bg: 'bg-emerald-100'
        }]
    };

    if (topCat !== 'general' && recLibrary[topCat]) recommendations.push(...recLibrary[topCat]);
    Object.keys(recLibrary).forEach(cat => { if (cat !== topCat && cat !== 'general' && catTotals[cat] > 0.0001) recommendations.push(recLibrary[cat][0]); });
    recommendations.push(...recLibrary.general);

    return {
        recommendations: recommendations.slice(0, 8),
        impact: {
            totalSaved: 0,
            trees: total > 0 ? Math.max(1, Math.ceil(total * 45)) : 0,
            km: Math.round(travel.filter((t: any) => t.transport_mode !== 'car' && t.transport_mode !== 'motorcycle').reduce((acc: number, t: any) => acc + (t.distance || 0), 0) + activities.filter((a: any) => a.category === 'transport' && (a.subcategory === 'bus' || a.subcategory === 'train')).reduce((acc: number, a: any) => acc + (Number(a.value) || 0), 0)),
            meatlessDays: activities.filter((a: any) => a.category === 'food' && (a.subcategory === 'vegetarian' || a.subcategory === 'vegan')).length + Math.floor(activities.filter((a: any) => a.category === 'food' && (a.subcategory === 'fish' || a.subcategory === 'chicken')).length * 0.5)
        },
        topSource: topCat === 'general' ? undefined : topCat,
        totalEmissions: total
    };
  };

  const runAnalysis = async (forceAi = true) => {
    setLoading(true);
    try {
      const [activities, travel] = await Promise.all([api.activities.list(), api.travel.list()]);
      const total = activities.reduce((acc: number, curr: any) => acc + (Number(curr.emissions) || 0), 0) + travel.reduce((acc: number, curr: any) => acc + (Number(curr.emissions) || 0), 0);

      setHasRealData(total > 0.000001);
      if (total <= 0.000001) {
          setData(null);
          setLoading(false);
          return;
      }

      const localInsights = getLocalAnalysis(activities, travel);
      setData(localInsights);
      setLoading(false); // SHOW LOCAL DATA NOW

      if (apiKey && forceAi) {
          setIsAiLoading(true);
          try {
              const ai = new GoogleGenAI({ apiKey });
              const prompt = `ACT AS A SUSTAINABILITY EXPERT. Provide 6-8 hyper-personalized tips based on these logs: ${JSON.stringify(activities.slice(0, 20))}. Return JSON: {"recommendations": [{"title":"...", "description":"...", "longDescription":"...", "impact":"...", "difficulty":"...", "category":"...", "color":"text-emerald-600", "bg":"bg-emerald-100"}]}. Use ${language === 'ml' ? 'Malayalam' : 'English'}.`;
              
              const result = await (ai as any).models.generateContent({
                  model: 'gemini-2.5-flash-lite',
                  contents: [{ role: 'user', parts: [{ text: prompt }] }]
              });

              if (result && result.text) {
                  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                      const aiData = JSON.parse(jsonMatch[0]);
                      if (aiData.recommendations) {
                          setData(prev => prev ? { ...prev, recommendations: aiData.recommendations } : prev);
                      }
                  }
              }
          } catch (aiErr) { console.error('AI Error:', aiErr); }
          finally { setIsAiLoading(false); }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDeepClear = async () => {
    if (!window.confirm(language === 'ml' ? 'വിവരങ്ങൾ നീക്കം ചെയ്യണോ?' : 'Clear all data?')) return;
    setData(null);
    setHasRealData(false);
    try {
        await api.activities.clear();
    } catch (err) {
        console.error('Failed to clear database:', err);
        runAnalysis(false);
    }
  };

  useEffect(() => { runAnalysis(true); }, [language]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-8 animate-pulse">
        <div className="h-20 w-20 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-emerald-600 font-black uppercase tracking-widest text-[10px]">Syncing Insights...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-16 px-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-emerald-200">
                {isAiLoading ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3" />}
                <span>{isAiLoading ? 'AI Thinking' : 'Live Sync'}</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter">
                {t.title}
            </h2>
          </div>
          <div className="flex space-x-3">
              <button 
                onClick={handleDeepClear} 
                className="p-5 bg-white dark:bg-gray-800 rounded-3xl text-red-500 shadow-xl border border-red-50 hover:bg-red-500 hover:text-white transition-all transform active:scale-90"
              >
                <X className="h-6 w-6" />
              </button>
              <button 
                onClick={() => runAnalysis(true)} 
                className="p-5 bg-emerald-600 text-white rounded-3xl shadow-xl hover:bg-emerald-700 transition-all transform active:scale-95"
              >
                <RefreshCw className="h-6 w-6" />
              </button>
          </div>
      </div>

      {!hasRealData ? (
          <div className="max-w-2xl mx-auto py-20 px-10 bg-white dark:bg-gray-900 rounded-[3rem] border-4 border-dashed border-gray-100 text-center shadow-2xl">
              <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-8 animate-bounce" />
              <h3 className="text-3xl font-black mb-4">{language === 'ml' ? 'വിവരങ്ങൾ നീക്കം ചെയ്തു' : 'History Cleared'}</h3>
              <p className="text-gray-500 font-bold mb-10">{language === 'ml' ? 'പുതിയ വിവരങ്ങൾ രേഖപ്പെടുത്താം.' : 'Your history is empty. Start journey for fresh insights.'}</p>
              <button onClick={() => onSwitchTab?.('logger')} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                  {language === 'ml' ? 'തുടങ്ങാം' : 'Start Fresh'}
              </button>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 border border-gray-50 shadow-xl flex items-center justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest">MAJOR SOURCE</p>
                        <h4 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                            {data?.topSource === 'transport' ? (language === 'ml' ? 'യാത്രകൾ' : 'Transport') 
                            : data?.topSource === 'energy' ? (language === 'ml' ? 'ഊർജ്ജം' : 'Energy')
                            : data?.topSource === 'food' ? (language === 'ml' ? 'ഭക്ഷണം' : 'Food')
                            : data?.topSource === 'lpg' ? (language === 'ml' ? 'എൽ.പി.ജി' : 'LPG')
                            : (language === 'ml' ? 'ജനറൽ' : 'General')}
                        </h4>
                    </div>
                </div>
                <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white shadow-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-emerald-100 mb-2 uppercase tracking-widest">TOTAL EMISSIONS</p>
                        <h4 className="text-5xl font-black tracking-tighter">{data?.totalEmissions?.toFixed(3)} <span className="text-lg opacity-60">tons</span></h4>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-gray-50 p-10 relative">
                    <h3 className="text-2xl font-black mb-10 flex items-center tracking-tight">
                        <Lightbulb className="h-7 w-7 text-yellow-500 mr-4" />
                        {t.recommendations}
                    </h3>
                    <div className="space-y-6">
                        {data?.recommendations.map((rec, idx) => (
                            <div key={idx} onClick={() => setSelectedRec(rec)} className="group bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 hover:bg-emerald-50 transition-all cursor-pointer border-2 border-transparent hover:border-emerald-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className={`px-4 py-1.5 ${rec.bg} ${rec.color} rounded-xl text-[9px] font-black uppercase tracking-widest`}>{rec.category}</span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{rec.difficulty}</span>
                                </div>
                                <h4 className="text-2xl font-black mb-3 group-hover:text-emerald-700">{rec.title}</h4>
                                <p className="text-sm text-gray-500 font-bold mb-6 truncate">{rec.description}</p>
                                <div className="flex items-center text-emerald-600 font-black text-xs uppercase tracking-widest">
                                    <TrendingDown className="h-4 w-4 mr-2" />
                                    <span>Reduction: {rec.impact}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-emerald-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden text-center">
                    <h3 className="text-xl font-black mb-8 flex items-center justify-center"><Leaf className="h-6 w-6 mr-3 text-emerald-200" />Eco-Impact</h3>
                    <div className="bg-black/10 rounded-[2.5rem] p-10 mb-8 border border-white/10">
                        <div className="text-7xl font-black mb-2 tracking-tighter">{data?.impact.trees}</div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">TREES REQUIRED</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
                            <div className="text-3xl font-black mb-1">{data?.impact.km}</div>
                            <p className="text-[8px] font-black uppercase opacity-60">SAVED KM</p>
                        </div>
                        <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
                            <div className="text-3xl font-black mb-1">{data?.impact.meatlessDays}</div>
                            <p className="text-[8px] font-black uppercase opacity-60">PLANT MEALS</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {selectedRec && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setSelectedRec(null)} />
              <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 overflow-hidden animate-in zoom-in-95 duration-200">
                  <button onClick={() => setSelectedRec(null)} className="absolute top-6 right-6 p-3 bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all"><X className="h-5 w-5" /></button>
                  <span className={`inline-block px-5 py-2 ${selectedRec.bg} ${selectedRec.color} rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] mb-8`}>{selectedRec.category}</span>
                  <h3 className="text-4xl font-black mb-6 tracking-tight leading-none">{selectedRec.title}</h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 mb-8 border border-gray-100">
                      <p className="text-lg text-gray-600 dark:text-gray-300 font-bold leading-relaxed italic">"{selectedRec.longDescription || selectedRec.description}"</p>
                  </div>
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-3">
                          <div className="p-3 bg-emerald-50 rounded-2xl"><TrendingDown className="h-6 w-6 text-emerald-600" /></div>
                          <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact</p><p className="text-xl font-black text-emerald-600">{selectedRec.impact}</p></div>
                      </div>
                  </div>
                  <button onClick={() => setSelectedRec(null)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02] transition-all">Got it</button>
              </div>
          </div>
      )}
    </div>
  );
};
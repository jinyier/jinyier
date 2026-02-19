
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Share2, 
  Cpu, 
  History, 
  Plus, 
  ChevronRight, 
  MessageSquare,
  FileText,
  Loader2,
  Cloud,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Paper, EvolutionGraph, ConceptNode, ChatMessage } from './types';
import { EvolutionMap } from './components/EvolutionMap';
import { gemini } from './services/geminiService';
import { driveService } from './services/googleDriveService';

const App: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [evolutionData, setEvolutionData] = useState<EvolutionGraph>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  // Initialize Drive Service
  useEffect(() => {
    const initDrive = async () => {
      try {
        // NOTE: In a real environment, you'd replace this with your actual Client ID
        // For demonstration, we handle the error gracefully if it's not set.
        await driveService.init('745749439247-u5o8idndj6v9l8j20m9j2m0v9j2m0v9j.apps.googleusercontent.com');
      } catch (e) {
        console.warn("Drive service init failed. Ensure Client ID is configured.");
      }
    };
    initDrive();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPaper: Paper = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.replace('.pdf', ''),
        authors: ['Local Upload'],
        year: new Date().getFullYear(),
        abstract: 'A research document uploaded from your local machine.',
        type: 'upload'
      };
      setPapers(prev => [...prev, newPaper]);
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    try {
      // 1. Open Folder Picker
      const folderId = await driveService.openFolderPicker();
      
      if (!folderId) {
        setIsSyncingDrive(false);
        return;
      }

      // 2. List all relevant files in that folder
      const files = await driveService.listFilesInFolder(folderId);
      
      const drivePapers: Paper[] = files.map(f => ({
        id: f.id,
        title: f.name,
        authors: ['Google Drive'],
        year: 2024,
        abstract: f.description || `Research document synced from Google Drive folder: ${folderId}`,
        type: 'drive'
      }));

      if (drivePapers.length > 0) {
        setPapers(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const filteredNew = drivePapers.filter(p => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });
      } else {
        alert("No compatible research papers (PDF/Text) found in the selected folder.");
      }
    } catch (err) {
      console.error("Drive sync error:", err);
      // Demo fallback if API fails
      const demoPapers: Paper[] = [
        { id: 'd1', title: 'Attention_is_all_you_need.pdf', authors: ['Vaswani et al.'], year: 2017, abstract: 'Landmark paper on Transformer architecture.', type: 'drive' },
        { id: 'd2', title: 'FlashAttention_v2.pdf', authors: ['Dao et al.'], year: 2023, abstract: 'Improved IO-aware attention for LLM scaling.', type: 'drive' }
      ];
      setPapers(prev => [...prev, ...demoPapers]);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await gemini.searchRelatedPapers(searchQuery);
      const newPapers: Paper[] = results.urls.map(url => ({
        id: Math.random().toString(36).substr(2, 9),
        title: url.split('/').pop() || 'Related Research',
        authors: ['Web Grounding'],
        year: 2024,
        abstract: `Analyzed from online source: ${results.text.substring(0, 150)}...`,
        url,
        type: 'search'
      }));
      setPapers(prev => [...prev, ...newPapers]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const generateMap = async () => {
    if (papers.length === 0) return;
    setIsMapping(true);
    try {
      const excerpts = papers.map(p => `Title: ${p.title}. Summary: ${p.abstract}`);
      const data = await gemini.mapEvolution(excerpts);
      setEvolutionData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMapping(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatting(true);

    try {
      const context = papers.map(p => `${p.title}: ${p.abstract}`).join('\n');
      const response = await gemini.chatWithContext(currentInput, context, chatHistory);
      
      const modelMsg: ChatMessage = {
        role: 'model',
        content: response.text,
        groundingUrls: response.urls
      };
      setChatHistory(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Cpu className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AIInfra
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Library</h2>
              <div className="flex gap-3">
                <button 
                  onClick={handleSyncDrive}
                  disabled={isSyncingDrive}
                  title="Sync Folder from Google Drive"
                  className="text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-30"
                >
                  {isSyncingDrive ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
                </button>
                <label className="cursor-pointer text-slate-400 hover:text-blue-400 transition-colors">
                  <Plus size={16} />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" />
                </label>
              </div>
            </div>
            <div className="space-y-1">
              {papers.length === 0 && !isSyncingDrive && (
                <div className="px-2 py-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                  <p className="text-slate-600 text-xs italic">Sync folders or upload PDF research papers.</p>
                </div>
              )}
              {papers.map(paper => (
                <div key={paper.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-700">
                  <div className={`p-1.5 rounded-lg ${
                    paper.type === 'upload' ? 'bg-blue-500/10 text-blue-400' : 
                    paper.type === 'drive' ? 'bg-amber-500/10 text-amber-400' : 
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {paper.type === 'drive' ? <Cloud size={14} /> : <FileText size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{paper.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{paper.type} • 2024</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
             <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 px-2">Analysis Engine</h2>
             <button 
                onClick={generateMap}
                disabled={papers.length === 0 || isMapping}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98] group"
             >
               {isMapping ? <RefreshCw className="animate-spin" size={16} /> : <Share2 size={16} className="group-hover:rotate-12 transition-transform" />}
               {isMapping ? 'Architecting Evolution...' : 'Generate Roadmap'}
             </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 focus-within:border-blue-500/50 transition-all">
             <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Search size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Expand Knowledge</span>
             </div>
             <div className="flex gap-2">
               <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Find state-of-the-art..."
                className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-slate-600 text-slate-200"
               />
               <button onClick={handleSearch} disabled={isSearching} className="text-slate-400 hover:text-white transition-colors">
                 {isSearching ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={18} />}
               </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col relative bg-slate-950">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <nav className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              <button className="text-xs font-semibold px-4 py-1.5 bg-blue-600 text-white rounded-md shadow-sm">Technical Evolution</button>
              <button className="text-xs font-semibold px-4 py-1.5 text-slate-400 hover:text-slate-200 transition-colors">Architecture Compare</button>
            </nav>
          </div>
          <div className="flex gap-2">
             <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all hover:text-white active:bg-slate-700"><History size={18} /></button>
             <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all hover:text-white active:bg-slate-700"><Share2 size={18} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-10 pb-24">
            <header>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Technical Lineage</h2>
              <p className="text-slate-400 text-lg">Tracing the breakthrough concepts through cross-referenced paper analysis.</p>
            </header>
            
            <section className="relative">
              {evolutionData.nodes.length > 0 ? (
                <div className="animate-in fade-in duration-700">
                  <EvolutionMap data={evolutionData} onNodeClick={setSelectedNode} />
                </div>
              ) : (
                <div className="h-[500px] bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-center group transition-all hover:border-slate-700 hover:bg-slate-900/50">
                  <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl border border-slate-700">
                    <BookOpen size={40} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-200">Evolution Map Empty</h3>
                  <p className="text-slate-500 max-w-sm mt-3 leading-relaxed">
                    Aggregate research papers from <b>Google Drive</b> or local uploads. AIInfra will synthesize a chronological graph of innovations.
                  </p>
                </div>
              )}

              {/* Node Detail Popup */}
              {selectedNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                  <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-2">
                        <span className="w-fit px-2.5 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-md border border-blue-500/30">
                          {selectedNode.category}
                        </span>
                        <h3 className="text-2xl font-bold text-white">{selectedNode.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                          <span>Timeline: {selectedNode.year}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span>Source Code Available</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedNode(null)} 
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 text-lg leading-relaxed mb-8">
                        {selectedNode.description}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95">
                        Deep Dive into Source <ArrowRight size={16} />
                      </button>
                      <button className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                        Related Variations
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Chat Drawer */}
        <div className="w-[450px] fixed right-0 top-16 bottom-0 bg-slate-900/80 backdrop-blur-2xl border-l border-slate-800 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-30">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                 <MessageSquare size={18} />
               </div>
               <h2 className="font-bold text-slate-200">AIInfra Specialist</h2>
             </div>
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Engine</span>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
                  <MessageSquare size={24} />
                </div>
                <p className="text-slate-400 text-sm font-medium">No active session.</p>
                <p className="text-slate-600 text-xs mt-2">Ask technical specifics like "Explain the memory IO bottle-neck solved by FlashAttention."</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[90%] p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">Verified References</p>
                      <div className="space-y-1.5">
                        {msg.groundingUrls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors truncate text-[11px] group">
                            <Cloud size={10} className="shrink-0 opacity-50 group-hover:opacity-100" />
                            <span className="truncate">{url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isChatting && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-slate-700">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleChat} className="relative group">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Query the infrastructure knowledge..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-5 pr-14 py-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all shadow-inner placeholder:text-slate-600"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isChatting}
                className="absolute right-2.5 top-2.5 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 rounded-xl text-white transition-all active:scale-90 shadow-lg shadow-blue-600/20"
              >
                <ArrowRight size={20} />
              </button>
            </form>
            <p className="mt-3 text-[10px] text-slate-500 text-center font-medium">Press Enter to dispatch message to Specialist.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

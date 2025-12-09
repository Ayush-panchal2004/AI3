import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Mic, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Cpu, 
  Search, 
  PenTool, 
  Plus, 
  X, 
  Menu, 
  Play, 
  Save, 
  Bot, 
  Sparkles,
  LayoutTemplate,
  Code2,
  Share2,
  Settings,
  Grid3X3,
  Download,
  Eraser,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  File,
  MonitorPlay,
  StickyNote,
  Presentation,
  Table,
  Globe,
  Binary,
  Variable,
  Box
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---

type FileType = 'chat' | 'code' | 'doc' | 'whiteboard' | 'sheet' | 'slide' | 'note' | 'search';

interface VirtualFile {
  id: string;
  name: string;
  type: FileType;
  subtype?: 'python' | 'cpp' | 'matlab';
  content: string; 
}

interface Message {
  role: 'user' | 'model';
  text: string;
  specialist?: string;
  timestamp: number;
}

interface TerminalOutput {
  id: string;
  type: 'info' | 'error' | 'success' | 'output';
  content: string;
  timestamp: number;
}

// --- Constants ---

const SYSTEM_INSTRUCTION = `
You are the intelligence engine for "OmniScience", a unified research workspace.
You are NOT a chatbot. You are a collection of 51 Specialized AI Agents working in unison.
Your Primary Persona is **Specialist #0: The Liaison**.

**CORE PROTOCOLS:**
1.  **DEEP SYNC**: You have full access to the user's workspace. You can READ all open files and WRITE to them.
2.  **ACTION OVER CHAT**: If the user asks for a summary, paper, or code, DO NOT just dump it in the chat. CREATE A FILE or UPDATE THE ACTIVE FILE.
3.  **SPECIALIST DELEGATION**: Explicitly state which specialist is acting.

**FILE MANIPULATION COMMANDS:**
To perform actions, you must include a JSON block at the END of your response.
Format:
\`\`\`json
{
  "action": "create_file" | "update_file" | "switch_tab",
  "file_id": "optional_id_if_update",
  "file_type": "doc" | "code" | "sheet" | "whiteboard" | "slide",
  "file_name": "filename.ext",
  "content": "The actual content..."
}
\`\`\`

**BEHAVIOR:**
- Be concise, professional, and dense. No fluff.
- If the user clicks "RUN" on code, act as the Interpreter and output the result.
- Use Markdown tables for structured data in chat.
`;

// --- Components ---

const SidebarItem = ({ icon: Icon, label, onClick, active, fileType, subIcon }: any) => (
  <div 
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors group relative cursor-pointer select-none ${active ? 'bg-[#37373d] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}`}
    onClick={onClick}
  >
    <div className="relative">
      <Icon size={14} className={
          fileType === 'chat' ? 'text-indigo-400' :
          fileType === 'code' ? 'text-yellow-400' :
          fileType === 'sheet' ? 'text-green-500' :
          fileType === 'doc' ? 'text-blue-500' :
          fileType === 'slide' ? 'text-orange-500' :
          fileType === 'search' ? 'text-blue-300' :
          fileType === 'note' ? 'text-yellow-300' :
          'text-slate-400'
      } />
      {subIcon && <div className="absolute -bottom-1 -right-1 text-[8px] bg-[#1e1e1e] rounded-full">{subIcon}</div>}
    </div>
    <span className="truncate flex-1">{label}</span>
  </div>
);

const Tab = ({ file, active, onClick, onClose }: any) => (
  <div 
    onClick={onClick}
    className={`group flex items-center gap-2 px-3 py-2 border-r border-[#252526] min-w-[120px] max-w-[200px] cursor-pointer select-none h-full ${active ? 'bg-[#1e1e1e] text-indigo-400 border-t-2 border-t-indigo-500' : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#1e1e1e]'}`}
  >
    {file.type === 'chat' && <Bot size={14} />}
    {file.type === 'code' && <Code2 size={14} />}
    {file.type === 'doc' && <FileText size={14} />}
    {file.type === 'whiteboard' && <PenTool size={14} />}
    {file.type === 'sheet' && <Grid3X3 size={14} />}
    {file.type === 'slide' && <Presentation size={14} />}
    {file.type === 'note' && <StickyNote size={14} />}
    {file.type === 'search' && <Search size={14} />}
    <span className="truncate text-xs flex-1">{file.name}</span>
    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-400">
      <X size={12} />
    </button>
  </div>
);

// --- Editors ---

const CodeEditor = ({ file, onChange, onRun }: any) => (
  <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between p-2 bg-[#1e1e1e] border-b border-[#333] text-xs text-slate-400">
          <span className="font-mono text-indigo-400 flex items-center gap-2">
            <Code2 size={12}/> {file.name} 
            {file.subtype && <span className="bg-[#333] px-1 rounded text-[10px] text-slate-300 uppercase">{file.subtype}</span>}
          </span>
          <button onClick={onRun} className="flex items-center gap-1 px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded-sm transition-colors font-semibold">
            <Play size={10} fill="currentColor"/> Run
          </button>
      </div>
      <div className="flex-1 relative">
        <textarea 
            value={file.content}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 resize-none focus:outline-none leading-6"
            spellCheck={false}
        />
      </div>
  </div>
);

// High-Fidelity Google Docs Clone
const DocEditor = ({ file, onChange }: any) => (
  <div className="flex flex-col h-full bg-[#F9FBFD] overflow-y-auto items-center relative">
       {/* Toolbar Simulator */}
       <div className="w-full bg-[#EDF2FA] border-b border-[#dadce0] px-4 py-2 flex gap-4 text-slate-700 sticky top-0 z-10 shadow-sm">
           <div className="flex gap-2 items-center text-sm font-medium">
               <span className="hover:bg-[rgba(26,115,232,0.1)] px-2 py-1 rounded cursor-pointer">File</span>
               <span className="hover:bg-[rgba(26,115,232,0.1)] px-2 py-1 rounded cursor-pointer">Edit</span>
               <span className="hover:bg-[rgba(26,115,232,0.1)] px-2 py-1 rounded cursor-pointer">View</span>
               <span className="hover:bg-[rgba(26,115,232,0.1)] px-2 py-1 rounded cursor-pointer">Insert</span>
               <span className="hover:bg-[rgba(26,115,232,0.1)] px-2 py-1 rounded cursor-pointer">Format</span>
           </div>
       </div>
       
       {/* Paper */}
       <div className="w-[816px] min-h-[1056px] bg-white shadow-lg my-8 p-[96px] text-black">
           <input 
              value={file.name.replace(/\.(doc|txt)$/, '')}
              onChange={(e) => { /* Rename logic could go here */ }}
              className="text-3xl font-bold w-full outline-none placeholder-slate-300 font-sans mb-4 text-black bg-transparent"
              placeholder="Untitled Document"
           />
           <textarea 
              value={file.content}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-full min-h-[800px] text-[11pt] resize-none focus:outline-none font-sans leading-relaxed text-black placeholder-slate-400"
              placeholder="Type @ to insert"
           />
       </div>
  </div>
);

// High-Fidelity Google Slides Clone
const SlideEditor = ({ file, onChange }: any) => (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
        {/* Toolbar */}
        <div className="w-full bg-white border-b border-[#dadce0] px-4 py-2 flex gap-2 items-center text-slate-600">
           <Plus size={18} className="cursor-pointer hover:bg-slate-100 p-1 rounded box-content"/>
           <div className="h-4 w-px bg-slate-300 mx-2"></div>
           <span className="text-xs">Background</span>
           <span className="text-xs">Layout</span>
           <span className="text-xs">Theme</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
             {/* Filmstrip */}
             <div className="w-48 bg-white border-r border-[#dadce0] flex flex-col p-4 gap-4 overflow-y-auto">
                 {[1].map(i => (
                     <div key={i} className="aspect-[16/9] bg-white border-2 border-[#Fbbc04] shadow-sm flex items-center justify-center text-[10px] text-slate-400 cursor-pointer">
                         1
                     </div>
                 ))}
             </div>

             {/* Canvas */}
             <div className="flex-1 bg-[#F8F9FA] flex items-center justify-center p-8 overflow-auto">
                <div className="w-[960px] h-[540px] bg-white shadow-lg flex flex-col p-16 border border-[#dadce0] relative">
                    <input 
                       className="text-5xl font-sans font-bold mb-8 outline-none placeholder-[#dadce0] text-black bg-transparent text-center mt-20" 
                       placeholder="Click to add title"
                       value={file.content.split('\n')[0] || ''}
                       onChange={(e) => {
                           const lines = file.content.split('\n');
                           lines[0] = e.target.value;
                           onChange(lines.join('\n'));
                       }}
                    />
                    <textarea 
                        className="flex-1 text-2xl font-sans resize-none outline-none placeholder-[#dadce0] text-black bg-transparent text-center"
                        placeholder="Click to add subtitle"
                        value={file.content.split('\n').slice(1).join('\n')}
                        onChange={(e) => {
                            const lines = file.content.split('\n');
                            const rest = e.target.value;
                            onChange(lines[0] + '\n' + rest);
                        }}
                    />
                </div>
             </div>
        </div>
    </div>
);

// High-Fidelity Google Sheets Clone
const SheetEditor = ({ file, onChange }: any) => {
  const rows = file.content.split('\n').map((row: string) => row.split(','));
  const ensureGrid = () => {
    while(rows.length < 40) rows.push(new Array(10).fill(''));
    rows.forEach((r: any[]) => { while(r.length < 15) r.push(''); });
    return rows;
  };
  const grid = ensureGrid();

  const handleCellChange = (r: number, c: number, val: string) => {
    const newGrid = [...grid];
    newGrid[r][c] = val;
    onChange(newGrid.map((row: any[]) => row.join(',')).join('\n'));
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans text-xs">
        <div className="w-full bg-[#f8f9fa] border-b border-[#c0c0c0] px-4 py-1 flex gap-4 text-slate-700 items-center h-8">
            <span className="font-bold text-[#107c41] flex items-center gap-1"><Table size={14}/> Sheets</span>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex gap-2">
                <span className="font-bold">B</span>
                <span className="italic font-serif">I</span>
                <span className="line-through">S</span>
                <span className="text-[#1a73e8]">A</span>
            </div>
        </div>
        <div className="flex items-center h-6 bg-[#f8f9fa] border-b border-[#c0c0c0]">
             <div className="w-10 bg-[#f8f9fa] border-r border-[#c0c0c0]"></div>
             <div className="flex-1 flex overflow-hidden">
                {grid[0].map((_: any, i: number) => (
                   <div key={i} className="min-w-[100px] bg-[#f8f9fa] border-r border-[#c0c0c0] text-center font-bold text-slate-600 py-1 flex items-center justify-center">
                     {String.fromCharCode(65 + i)}
                   </div>
                ))}
             </div>
        </div>
        <div className="flex-1 overflow-auto">
          {grid.map((row: any[], r: number) => (
            <div key={r} className="flex h-6 border-b border-[#e0e0e0]">
               <div className="w-10 min-w-[40px] bg-[#f8f9fa] border-r border-[#c0c0c0] text-center text-slate-500 flex items-center justify-center font-semibold">{r + 1}</div>
               {row.map((cell: string, c: number) => (
                  <input 
                    key={`${r}-${c}`}
                    value={cell}
                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                    className="min-w-[100px] border-r border-[#e0e0e0] px-1 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8] text-black z-0 focus:z-10"
                  />
               ))}
            </div>
          ))}
        </div>
    </div>
  );
};

const WhiteboardEditor = ({ file, onChange }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    if (file.content && file.content.startsWith('data:image')) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = file.content;
    }
  }, []);

  const save = () => {
     if(canvasRef.current) onChange(canvasRef.current.toDataURL());
  };

  const startDrawing = (e: any) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    save();
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative">
        <div className="absolute top-4 left-4 bg-white shadow rounded-lg p-2 flex gap-2 z-10 border">
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600"><PenTool size={16}/></button>
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600"><Eraser size={16}/></button>
             <div className="w-px bg-slate-200"></div>
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600" onClick={() => {
                 const ctx = canvasRef.current?.getContext('2d');
                 if(ctx) { ctx.fillStyle="#fff"; ctx.fillRect(0,0,2000,2000); save(); }
             }}>Clear</button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
           <canvas 
              ref={canvasRef}
              width={1600}
              height={1200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="bg-white shadow-xl cursor-crosshair"
           />
        </div>
    </div>
  );
};

const SearchEditor = ({ file, onChange, apiKey }: any) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<string>(file.content || '');
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if(!query || !apiKey) return;
        setSearching(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Search query: ${query}`,
                config: { tools: [{googleSearch: {}}] }
            });
            const text = response.text || "No results found.";
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            let formatted = `## Search Results for: "${query}"\n\n${text}\n\n### Sources:\n`;
            chunks.forEach((chunk: any, i: number) => {
                if(chunk.web?.uri) {
                    formatted += `${i+1}. [${chunk.web.title}](${chunk.web.uri})\n`;
                }
            });

            setResults(formatted);
            onChange(formatted);
        } catch(e: any) {
            setResults(`Error: ${e.message}`);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Globe size={24}/></div>
                    <h1 className="text-2xl font-bold text-slate-800">Deep Search Grounding</h1>
                </div>
                
                <div className="flex gap-2 mb-8">
                    <input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search for research papers, topics, or data..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm text-black"
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>

                <div className="prose prose-slate max-w-none">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{results}</ReactMarkdown>
                </div>
            </div>
        </div>
    )
}


// --- Main App ---

export default function App() {
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [files, setFiles] = useState<VirtualFile[]>([
    { id: '1', name: 'MWI_Chat', type: 'chat', content: JSON.stringify([]) },
  ]);
  const [openTabIds, setOpenTabIds] = useState<string[]>(['1']);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGoogleMenuOpen, setIsGoogleMenuOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSpecialist, setCurrentSpecialist] = useState("The Liaison");
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [projectFolderOpen, setProjectFolderOpen] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeFile = files.find(f => f.id === activeTabId);

  // -- Helpers --

  const addTerminalLog = (content: string, type: 'info' | 'error' | 'success' | 'output' = 'info') => {
    setTerminalOutput(prev => [...prev, { id: Math.random().toString(), content, type, timestamp: Date.now() }]);
  };

  const createNewFile = (type: FileType, subtype?: 'python' | 'cpp' | 'matlab', name?: string, content: string = '') => {
    const newId = Math.random().toString(36).substr(2, 9);
    const extensions: Record<string, string> = { 
        code: subtype === 'python' ? 'py' : subtype === 'cpp' ? 'cpp' : subtype === 'matlab' ? 'm' : 'code', 
        doc: 'doc', 
        sheet: 'csv', 
        whiteboard: 'board', 
        chat: 'chat', 
        slide: 'slide', 
        note: 'txt',
        search: 'search'
    };
    const fileName = name || `Untitled.${extensions[type]}`;
    
    const initialContent = content || (
        type === 'sheet' ? 'Header 1,Header 2,Header 3\nData 1,Data 2,Data 3' : 
        type === 'chat' ? '[]' : 
        type === 'code' ? (subtype === 'python' ? '# Python Script\nprint("Hello World")' : subtype === 'cpp' ? '// C++ Source\n#include <iostream>\n' : '% MATLAB Script\n') : 
        type === 'slide' ? 'Title Slide\nSubtitle goes here' : ''
    );

    const newFile: VirtualFile = {
      id: newId,
      name: fileName,
      type,
      subtype,
      content: initialContent
    };
    setFiles(prev => [...prev, newFile]);
    setOpenTabIds(prev => [...prev, newId]);
    setActiveTabId(newId);
    setIsGoogleMenuOpen(false); // Close menu if open
    setIsDevMenuOpen(false);
    return newId;
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
  };

  const runCode = async (code: string, fileName: string) => {
    addTerminalLog(`> Executing ${fileName}...`, 'info');
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `ACT AS A PYTHON INTERPRETER. Execute:\n${code}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      addTerminalLog(response.text || "No output", 'output');
    } catch (error: any) {
      addTerminalLog(`Execution failed: ${error.message}`, 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !apiKey) return;
    const activeChatFile = activeFile;
    if (!activeChatFile || activeChatFile.type !== 'chat') return;

    const userMsg: Message = { role: 'user', text: chatInput, timestamp: Date.now() };
    const history: Message[] = JSON.parse(activeChatFile.content);
    const newHistory = [...history, userMsg];
    
    updateFileContent(activeChatFile.id, JSON.stringify(newHistory));
    setChatInput("");
    setIsProcessing(true);

    const workspaceContext = files.map(f => `
      --- FILE: ${f.name} (ID: ${f.id}, TYPE: ${f.type}) ---
      ${f.content.substring(0, 3000)}...
    `).join('\n');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: newHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nWORKSPACE:\n${workspaceContext}`,
          thinkingConfig: { thinkingBudget: 4096 }
        }
      });

      const fullText = response.text || "";
      const specMatch = fullText.match(/^\*\*(.*?)\*\*/);
      const specialistName = specMatch ? specMatch[1].replace(':', '') : "The Liaison";
      setCurrentSpecialist(specialistName);

      // Extract JSON actions
      let displayResponse = fullText;
      const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```$/;
      const match = fullText.match(jsonBlockRegex);
      
      if (match) {
        try {
          const actionData = JSON.parse(match[1]);
          displayResponse = fullText.replace(jsonBlockRegex, '').trim();
          if (actionData.action === 'create_file') {
            createNewFile(actionData.file_type, undefined, actionData.file_name, actionData.content);
          } else if (actionData.action === 'update_file') {
             const target = files.find(f => f.name === actionData.file_name || f.id === actionData.file_id);
             if (target) updateFileContent(target.id, actionData.content);
          }
        } catch (e) { console.error(e); }
      }

      const modelMsg: Message = { role: 'model', text: displayResponse, specialist: specialistName, timestamp: Date.now() };
      updateFileContent(activeChatFile.id, JSON.stringify([...newHistory, modelMsg]));

    } catch (error: any) {
      const errorMsg: Message = { role: 'model', text: `**System Error:** ${error.message}`, timestamp: Date.now() };
      updateFileContent(activeChatFile.id, JSON.stringify([...newHistory, errorMsg]));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderChat = (file: VirtualFile) => {
    const history: Message[] = JSON.parse(file.content);
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e]">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {history.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-32 text-[#444]">
                    <Bot size={72} strokeWidth={1} />
                    <h2 className="text-2xl font-light tracking-widest mt-6 uppercase">OmniScience v2.2</h2>
                    <p className="text-sm mt-2">Ready for inquiry.</p>
                </div>
            )}
            {history.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#2d2d2d] text-emerald-500'}`}>
                        {msg.role === 'user' ? 'USR' : 'AI'}
                    </div>
                    <div className={`max-w-[85%] text-sm leading-7 ${msg.role === 'user' ? 'bg-[#2b2b2b] p-3 rounded-lg text-slate-200' : 'text-slate-300'}`}>
                        {msg.specialist && msg.role === 'model' && (
                            <div className="text-[11px] font-bold text-emerald-500 mb-1 uppercase tracking-wider">
                                {msg.specialist}
                            </div>
                        )}
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                table: ({node, ...props}) => <table className="border-collapse border border-slate-700 my-4 text-xs w-full bg-[#252526]" {...props} />,
                                th: ({node, ...props}) => <th className="border border-slate-600 bg-[#333] p-2 text-left text-white font-semibold" {...props} />,
                                td: ({node, ...props}) => <td className="border border-slate-600 p-2 text-slate-300" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                code: ({node, ...props}) => <code className="bg-[#121212] px-1 rounded text-orange-300 font-mono text-xs" {...props} />,
                                pre: ({node, ...props}) => <pre className="bg-[#121212] p-3 rounded my-2 overflow-x-auto border border-[#333]" {...props} />,
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    </div>
                </div>
            ))}
            {isProcessing && (
                 <div className="flex gap-4">
                     <div className="w-8 h-8 rounded bg-[#2d2d2d] flex items-center justify-center animate-pulse"><Bot size={14} className="text-emerald-500" /></div>
                     <div className="text-slate-500 text-xs italic py-2">Deep thought process active...</div>
                 </div>
            )}
            <div ref={chatEndRef} />
        </div>
        <div className="p-4 bg-[#1e1e1e] border-t border-[#333]">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Input Command..."
                    className="flex-1 bg-[#252526] border border-[#333] rounded-sm px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    autoFocus
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isProcessing}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white px-6 rounded-sm font-medium disabled:opacity-50"
                >
                    {isProcessing ? <LayoutTemplate className="animate-spin" size={18}/> : "RUN"}
                </button>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden">
      
      {/* Sidebar - VS Code Style */}
      <div className={`${isSidebarOpen ? 'w-[300px]' : 'w-12'} flex-shrink-0 bg-[#252526] flex flex-col transition-all duration-300 border-r border-[#1e1e1e]`}>
         {/* Sidebar Header */}
         <div className="h-9 flex items-center justify-between px-4 text-[11px] text-[#bbbbbb] tracking-wide select-none">
             {isSidebarOpen && <span>EXPLORER</span>}
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-[#333] rounded">
                 <MoreHorizontal size={16} />
             </button>
         </div>
         
         {isSidebarOpen && (
             <div className="flex-1 overflow-y-auto">
                 {/* Project Folder */}
                 <div className="select-none">
                     <div 
                        className="flex items-center gap-1 px-1 py-1 cursor-pointer hover:bg-[#2a2d2e] text-[#cccccc] font-bold text-xs"
                        onClick={() => setProjectFolderOpen(!projectFolderOpen)}
                     >
                         {projectFolderOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                         <span>MWI_RESEARCH</span>
                     </div>
                     
                     {projectFolderOpen && (
                         <div className="pl-3">
                             {files.map(f => (
                                 <SidebarItem 
                                     key={f.id} 
                                     icon={
                                         f.type === 'chat' ? Bot : 
                                         f.type === 'code' ? Code2 : 
                                         f.type === 'doc' ? FileText : 
                                         f.type === 'whiteboard' ? PenTool : 
                                         f.type === 'sheet' ? Table : 
                                         f.type === 'slide' ? Presentation : 
                                         f.type === 'search' ? Globe : StickyNote
                                     } 
                                     fileType={f.type}
                                     label={f.name} 
                                     active={activeTabId === f.id}
                                     onClick={() => {
                                         if (!openTabIds.includes(f.id)) setOpenTabIds([...openTabIds, f.id]);
                                         setActiveTabId(f.id);
                                     }}
                                 />
                             ))}
                         </div>
                     )}
                 </div>

                 {/* Google Workspace Menu */}
                 <div className="mt-6 px-3">
                     <button 
                        onClick={() => setIsGoogleMenuOpen(!isGoogleMenuOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#0F9D58] hover:bg-[#0b8046] text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
                     >
                         <span className="flex items-center gap-2"><Grid3X3 size={14}/> Google Workspace</span>
                         {isGoogleMenuOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                     </button>
                     
                     {isGoogleMenuOpen && (
                         <div className="mt-2 grid grid-cols-2 gap-2 pl-2 border-l border-[#333] ml-2">
                             <button onClick={() => createNewFile('doc')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-blue-400">
                                 <FileText size={20}/> Docs
                             </button>
                             <button onClick={() => createNewFile('sheet')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-green-400">
                                 <Table size={20}/> Sheets
                             </button>
                             <button onClick={() => createNewFile('slide')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-orange-400">
                                 <Presentation size={20}/> Slides
                             </button>
                             <button onClick={() => createNewFile('whiteboard')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-orange-500">
                                 <PenTool size={20}/> Jamboard
                             </button>
                             <button onClick={() => createNewFile('note')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-yellow-400">
                                 <StickyNote size={20}/> Keep
                             </button>
                         </div>
                     )}
                 </div>

                 {/* Development Menu */}
                 <div className="mt-2 px-3">
                     <button 
                        onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#007acc] hover:bg-[#0062a3] text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
                     >
                         <span className="flex items-center gap-2"><Binary size={14}/> Development</span>
                         {isDevMenuOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                     </button>
                     
                     {isDevMenuOpen && (
                         <div className="mt-2 grid grid-cols-3 gap-2 pl-2 border-l border-[#333] ml-2">
                             <button onClick={() => createNewFile('code', 'python')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-yellow-300">
                                 <Box size={16}/> Python
                             </button>
                             <button onClick={() => createNewFile('code', 'cpp')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-blue-500">
                                 <Cpu size={16}/> C++
                             </button>
                             <button onClick={() => createNewFile('code', 'matlab')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-orange-600">
                                 <Variable size={16}/> MATLAB
                             </button>
                         </div>
                     )}
                 </div>
                 
                 {/* Google Search Button */}
                 <div className="mt-4 px-3">
                     <button 
                        onClick={() => createNewFile('search', undefined, 'Google Search')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
                     >
                         <Search size={14}/> Deep Search
                     </button>
                 </div>

             </div>
         )}
         
         <div className="p-2 bg-[#252526] border-t border-[#1e1e1e]">
             <div className="flex items-center gap-2 px-2 py-1 text-xs text-[#cccccc]">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 {isSidebarOpen && <span>{currentSpecialist}</span>}
             </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          
          {/* Tabs */}
          <div className="flex items-center bg-[#252526] overflow-x-auto hide-scrollbar h-9 border-b border-[#1e1e1e]">
              {openTabIds.map(id => {
                  const file = files.find(f => f.id === id);
                  if (!file) return null;
                  return (
                      <Tab 
                        key={id} 
                        file={file} 
                        active={activeTabId === id} 
                        onClick={() => setActiveTabId(id)} 
                        onClose={() => {
                          const newOpen = openTabIds.filter(tid => tid !== id);
                          setOpenTabIds(newOpen);
                          if(activeTabId === id) setActiveTabId(newOpen[newOpen.length-1] || '');
                        }}
                      />
                  );
              })}
          </div>

          {/* Editor Surface */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
              <div className="flex-1 overflow-hidden relative">
                  {activeFile ? (
                      <>
                        {activeFile.type === 'chat' && renderChat(activeFile)}
                        {activeFile.type === 'code' && (
                            <CodeEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)} 
                                onRun={() => runCode(activeFile.content, activeFile.name)}
                            />
                        )}
                        {(activeFile.type === 'doc' || activeFile.type === 'note') && (
                            <DocEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                            />
                        )}
                        {activeFile.type === 'sheet' && (
                            <SheetEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                            />
                        )}
                        {activeFile.type === 'whiteboard' && (
                            <WhiteboardEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                            />
                        )}
                         {activeFile.type === 'slide' && (
                            <SlideEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                            />
                        )}
                        {activeFile.type === 'search' && (
                            <SearchEditor
                                file={activeFile}
                                apiKey={apiKey}
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                            />
                        )}
                      </>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#333]">
                          <FolderOpen size={64} strokeWidth={1}/>
                          <p className="mt-4 text-sm font-mono">No Active File</p>
                      </div>
                  )}
              </div>

              {/* Conditional Terminal: Only for Code Files */}
              {activeFile?.type === 'code' && (
                  <div className="h-48 bg-[#1e1e1e] border-t border-[#333] flex flex-col">
                      <div className="flex items-center justify-between px-4 py-1 bg-[#1e1e1e] border-b border-[#333]">
                          <div className="flex gap-4 text-[10px] font-bold text-[#969696] uppercase tracking-wide">
                              <span className="cursor-pointer border-b border-white text-white">Terminal</span>
                              <span className="hover:text-white cursor-pointer">Output</span>
                              <span className="hover:text-white cursor-pointer">Debug Console</span>
                          </div>
                          <button onClick={() => setTerminalOutput([])} className="text-xs text-slate-500 hover:text-white"><Eraser size={12}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
                          {terminalOutput.length === 0 && <div className="text-slate-600 italic">Ready for input...</div>}
                          {terminalOutput.map((log) => (
                              <div key={log.id} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'output' ? 'text-indigo-300' : 'text-slate-400'}`}>
                                  <span className="opacity-40 mr-2 select-none">❯</span>
                                  {log.content}
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
          
          {/* Status Bar */}
          <div className="bg-[#007acc] text-white text-[11px] flex justify-between items-center px-2 select-none h-6">
              <div className="flex gap-4 items-center">
                  <span className="font-semibold flex items-center gap-1"><MonitorPlay size={10}/> OMNISCIENCE REMOTE</span>
                  <span>{activeFile?.name || 'Empty Workspace'}</span>
              </div>
              <div className="flex gap-4 opacity-90">
                   <span>UTF-8</span>
                   <span>Gemini 3 Pro</span>
              </div>
          </div>
      </div>
    </div>
  );
}
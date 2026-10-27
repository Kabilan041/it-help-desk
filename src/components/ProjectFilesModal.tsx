import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Folder, 
  FolderOpen, 
  FileCode, 
  Terminal, 
  FileCheck, 
  Laptop, 
  PackageCheck,
  Search
} from 'lucide-react';
import { ALL_PROJECT_FILES, ProjectFile } from '../projectFileContents';

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({ isOpen, onClose }) => {
  const [selectedPath, setSelectedPath] = useState<string>('database/schema.sql');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('All');

  if (!isOpen) return null;

  const currentFile: ProjectFile = ALL_PROJECT_FILES.find(f => f.path === selectedPath) || ALL_PROJECT_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder('it-support-help-desk');

      ALL_PROJECT_FILES.forEach(file => {
        rootFolder?.file(file.path, file.content);
      });

      // Add uploads/.gitkeep
      rootFolder?.folder('uploads')?.file('.gitkeep', '# Keep uploads folder in version control\n');

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'it-support-help-desk-paramount.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Could not generate ZIP bundle. Please copy files individually.');
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = ALL_PROJECT_FILES.filter(f => {
    if (activeFolderFilter !== 'All' && !f.path.startsWith(activeFolderFilter)) return false;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      return f.path.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              PTM
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>IT SUPPORT HELP DESK — Full Code & Folder Explorer</span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  PostgreSQL & Node.js 24 LTS
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Paramount Textile Mills (P) Ltd &bull; Inspect full code folder-by-folder or download the complete ZIP archive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              title="Download entire project with all folders and files"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Generating ZIP...' : 'Download Project (ZIP)'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Tree & Viewer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Folder & File Explorer */}
          <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter project files..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
                {['All', 'database', 'backend', 'frontend'].map(folder => (
                  <button
                    key={folder}
                    onClick={() => setActiveFolderFilter(folder)}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      activeFolderFilter === folder
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {folder}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                Project Files ({filteredFiles.length})
              </span>
              {filteredFiles.map(file => (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                    selectedPath === file.path
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${selectedPath === file.path ? 'text-white' : 'text-blue-600'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ml-1 ${
                    selectedPath === file.path ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {file.language}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-blue-50/60 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-blue-900 block flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-blue-700" /> Windows Terminal Command:
              </span>
              <p className="font-mono text-[10px] bg-white p-1.5 rounded border border-blue-200 text-slate-800">
                npm start &rarr; http://localhost:3000
              </p>
            </div>
          </div>

          {/* Right: Code Viewer */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Action Bar */}
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-blue-800">
                    /{currentFile.path}
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                    {currentFile.language.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{currentFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Full Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 p-4 bg-slate-950 overflow-auto">
              <pre className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre font-normal selection:bg-blue-600 selection:text-white">
                {currentFile.content}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-slate-100 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>
            Folder structure matches: <code className="font-mono font-semibold text-slate-800">it-support-help-desk/</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

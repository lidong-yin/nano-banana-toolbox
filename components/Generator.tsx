
import React, { useState, useRef, useEffect } from 'react';
import { Wand2, ImagePlus, ChevronDown, ChevronUp, RefreshCw, X, Sparkles, Languages, Maximize, Upload, Image as ImageIcon, Share2, Loader2, AlertTriangle } from 'lucide-react';
import { AspectRatio, GenerationConfig, ImageResolution, OutputFormat, User } from '../types';
import { generateOrEditImage, optimizePrompt, translatePrompt } from '../services/geminiService';

const EXAMPLE_PROMPTS = [
  "Future Tech City, Cyberpunk style",
  "Traditional Chinese ink wash painting",
  "Snowcapped mountains in morning mist",
  "Retro synthwave filter"
];

const ASPECT_RATIOS: AspectRatio[] = [
    'auto', '1:1', '2:3', '3:4', '4:5', '9:16',
    '16:9', '3:2', '4:3', '5:4', '21:9'
];

interface GeneratorProps {
  currentUser: User | null;
  onGenerateComplete: (imageUrl: string, prompt: string, isPublic: boolean) => void;
  initialState?: {
      prompt: string;
      sourceImage?: string;
  } | null;
  onClearInitialState: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const Generator: React.FC<GeneratorProps> = ({ currentUser, onGenerateComplete, initialState, onClearInitialState, showToast }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [format, setFormat] = useState<OutputFormat>('JPEG');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [isPublic, setIsPublic] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_PROMPT_COUNT = 1000;

  // Load initial state if provided (for Remix/Second Creation)
  useEffect(() => {
    if (initialState) {
        setPrompt(initialState.prompt);
        if (initialState.sourceImage) {
            setSourceImage(initialState.sourceImage);
        }
        setGeneratedImage(null);
        // Clean up parent state so it doesn't reset on every render
        onClearInitialState();
    }
  }, [initialState, onClearInitialState]);

  // Helper to count "words" (English words + Chinese characters)
  const getPromptCount = (text: string) => {
    // Count CJK characters (Chinese, Japanese, Korean)
    const cjkMatches = text.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g);
    const cjkCount = cjkMatches ? cjkMatches.length : 0;
    
    // Replace CJK characters with space to isolate English/other words
    const nonCjkText = text.replace(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g, ' ');
    
    // Count standard words separated by whitespace
    const wordMatches = nonCjkText.trim().split(/\s+/);
    const wordCount = nonCjkText.trim().length > 0 ? wordMatches.length : 0;
    
    return cjkCount + wordCount;
  };

  const promptCount = getPromptCount(prompt);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("Image too large. Max 10MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        showToast("Reference image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptimize = async () => {
    if (!prompt.trim()) return;
    setIsOptimizing(true);
    try {
      const optimized = await optimizePrompt(prompt);
      setPrompt(optimized);
      showToast("Prompt optimized successfully!");
    } catch (err) {
      console.error("Optimization failed", err);
      showToast("Failed to optimize prompt", "error");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleTranslate = async () => {
    if (!prompt.trim()) return;
    setIsTranslating(true);
    try {
      const translated = await translatePrompt(prompt);
      setPrompt(translated);
      showToast("Prompt translated successfully!");
    } catch (err) {
      console.error("Translation failed", err);
      showToast("Translation failed", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerate = async () => {
    if (!currentUser) {
        showToast("Please login to generate images.", "error");
        return;
    }

    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      showToast("Please enter a prompt", "error");
      return;
    }

    if (promptCount > MAX_PROMPT_COUNT) {
        setError(`Prompt exceeds the limit of ${MAX_PROMPT_COUNT} words.`);
        showToast("Prompt too long", "error");
        return;
    }

    // Check for High Res API Key requirement
    const isHighRes = resolution === '2K' || resolution === '4K';
    if (isHighRes && (window as any).aistudio) {
        try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                 showToast("High resolution requires a personal API Key. Please select one.", "info");
                 const success = await (window as any).aistudio.openSelectKey();
                 if (!success) {
                     return; // User cancelled or failed
                 }
            }
        } catch (e) {
            console.error("API Key selection check failed", e);
        }
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    showToast("Generating image...", "info");

    const config: GenerationConfig = {
      prompt,
      sourceImage: sourceImage || undefined,
      aspectRatio,
      resolution,
      format
    };

    try {
      const result = await generateOrEditImage(config);
      setGeneratedImage(result);
      
      // Auto-save to history via parent
      onGenerateComplete(result, prompt, isPublic);

    } catch (err: any) {
      console.error("Generation error:", err);
      
      // Handle Permission Denied / API Key issues
      const errorMessage = err.message || "";
      if (errorMessage.includes('Requested entity was not found') || errorMessage.includes('403') || err.status === 403) {
          setError("Permission denied. High-resolution models require a valid API key.");
          showToast("Permission denied. Please select a valid API Key.", "error");
          
          if ((window as any).aistudio) {
              // Reset and prompt again
              try {
                  await (window as any).aistudio.openSelectKey();
              } catch (e) {
                  console.error("Failed to open key selector", e);
              }
          }
      } else {
          setError(errorMessage || "Failed to generate image. Please try again.");
          showToast(errorMessage || "Generation failed", "error");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setSourceImage(null);
    setGeneratedImage(null);
    setError(null);
    setIsPublic(false);
    setAspectRatio('auto');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast("Settings reset");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="w-full lg:w-1/3 flex flex-col gap-5 overflow-y-auto pr-2 pb-20 scrollbar-hide">
          
          {/* Prompt Input */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-800">Prompt</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleOptimize}
                  disabled={isOptimizing || !prompt.trim()}
                  className={`text-xs flex items-center gap-1 font-medium px-2 py-1 rounded transition-colors
                    ${isOptimizing ? 'bg-purple-50 text-purple-400 cursor-not-allowed' : 'text-purple-600 hover:bg-purple-50'}`}
                >
                  {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI Optimize
                </button>
                <button 
                  onClick={handleTranslate}
                  disabled={isTranslating || !prompt.trim()}
                  className={`text-xs flex items-center gap-1 font-medium px-2 py-1 rounded transition-colors
                    ${isTranslating ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                  Translate
                </button>
              </div>
            </div>
            
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none bg-gray-50"
              placeholder="Enter your prompt here to generate or edit content..."
            />
            
            <div className="mt-2 flex justify-between items-center">
              <span className={`text-xs transition-colors ${promptCount > MAX_PROMPT_COUNT ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {promptCount}/{MAX_PROMPT_COUNT} words
              </span>
              {promptCount > MAX_PROMPT_COUNT && (
                  <span className="text-xs text-red-500">Limit exceeded</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button 
                  key={i} 
                  onClick={() => setPrompt(p)}
                  className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md hover:bg-purple-100 transition-colors truncate max-w-[150px]"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Reference Image Upload */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3">Image Input (Optional)</h2>
            
            {!sourceImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-200 bg-purple-50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors">
                    <ImagePlus size={20} />
                </div>
                <span className="text-sm font-semibold text-purple-700">Add Image</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Upload for editing (add objects, filters, etc.)<br/>Max 10MB</span>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img src={sourceImage} alt="Source" className="w-full h-48 object-cover" />
                <button 
                  onClick={() => { setSourceImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2">
                    Reference Image
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
          </div>

          {/* Settings */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
             <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full mb-2"
             >
                <h2 className="font-bold text-gray-800">Additional Settings</h2>
                {showAdvanced ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
             </button>

             {showAdvanced && (
               <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Aspect Ratio */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-2 block">Aspect Ratio</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {ASPECT_RATIOS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setAspectRatio(r)}
                          className={`text-xs py-1.5 rounded-md border transition-all truncate
                            ${aspectRatio === r 
                              ? 'bg-purple-600 text-white border-purple-600' 
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300'}`}
                          title={r}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-2 block">Format</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                        {(['JPEG', 'PNG'] as OutputFormat[]).map(f => (
                           <button
                           key={f}
                           onClick={() => setFormat(f)}
                           className={`text-xs py-1.5 rounded-md transition-all font-medium
                             ${format === f
                               ? 'bg-purple-600 text-white shadow-sm' 
                               : 'text-gray-500 hover:bg-gray-200'}`}
                         >
                           {f}
                         </button>
                        ))}
                    </div>
                  </div>

                  {/* Resolution */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                         <label className="text-xs font-semibold text-gray-500 block">Resolution</label>
                         {(resolution === '2K' || resolution === '4K') && (
                             <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                 <AlertTriangle size={10} /> Requires API Key
                             </span>
                         )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1">
                        {(['1K', '2K', '4K'] as ImageResolution[]).map(res => (
                            <button
                                key={res}
                                onClick={() => setResolution(res)}
                                className={`text-xs py-1.5 rounded-md border transition-all flex flex-col items-center justify-center
                                ${resolution === res
                                    ? 'bg-purple-600 text-white border-purple-600' 
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300'}`}
                            >
                                <span className="font-bold">{res}</span>
                                <span className="text-[9px] opacity-70">
                                    {res === '1K' ? 'Standard' : 'High Res'}
                                </span>
                            </button>
                        ))}
                    </div>
                  </div>
                  
                  {/* Publish Setting */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700 font-medium">Publish to Gallery</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                        If checked, your creation will be visible to everyone in the Painting Gallery.
                    </p>
                  </div>
               </div>
             )}
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-auto">
             <button 
               onClick={handleReset}
               className="py-3 rounded-xl font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
               disabled={isGenerating}
             >
               Reset
             </button>
             <button 
               onClick={handleGenerate}
               disabled={isGenerating || promptCount > MAX_PROMPT_COUNT}
               className={`py-3 rounded-xl font-semibold text-white shadow-lg shadow-purple-200 flex items-center justify-center gap-2
                 ${(isGenerating || promptCount > MAX_PROMPT_COUNT) ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 transition-colors'}`}
             >
               {isGenerating ? <RefreshCw className="animate-spin" size={20}/> : <Wand2 size={20}/>}
               {isGenerating ? 'Generating...' : 'Generate'}
             </button>
          </div>

        </div>

        {/* RIGHT COLUMN: RESULT */}
        <div className="w-full lg:w-2/3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Result</h2>
            
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 relative overflow-hidden group">
                {generatedImage ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black/5">
                         <img 
                           src={generatedImage} 
                           alt="Generated result" 
                           className="max-w-full max-h-full object-contain shadow-xl" 
                         />
                         <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <a 
                               href={generatedImage} 
                               download={`nano-banana-${Date.now()}.png`}
                               className="bg-white text-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-50"
                               title="Download"
                               onClick={() => showToast("Downloading image...")}
                             >
                                 <Upload size={20} />
                             </a>
                             <button className="bg-white text-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-50" title="Full Screen">
                                 <Maximize size={20} />
                             </button>
                         </div>
                         {isPublic && (
                             <div className="absolute bottom-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                                 <Share2 size={12} /> Published
                             </div>
                         )}
                    </div>
                ) : (
                    <div className="text-center p-10">
                        {isGenerating ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                                <p className="text-gray-500 font-medium animate-pulse">Creating your masterpiece...</p>
                            </div>
                        ) : error ? (
                             <div className="flex flex-col items-center gap-3 max-w-md">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                                    <X size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Generation Failed</h3>
                                <p className="text-gray-500 text-sm text-center">{error}</p>
                                {error.includes("Permission denied") && (
                                    <button 
                                        onClick={() => (window as any).aistudio?.openSelectKey()}
                                        className="mt-2 text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
                                    >
                                        Select API Key
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-2">
                                    <ImageIcon size={40} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Ready to Generate</h3>
                                <p className="text-gray-500 text-sm max-w-xs text-center">
                                    Upload an image and type a prompt to edit, or just type a prompt to create from scratch.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="mt-4 flex justify-center text-xs text-gray-400">
               Powered by Gemini 2.5 Flash Image & Pro
            </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;

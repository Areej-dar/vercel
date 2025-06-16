import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { SearchSection, SearchResult, GoogleAPIItem, GeminiAPIItem } from './components/SearchSection';
import { FileUploadSection } from './components/FileUploadSection';
import { ReportSection } from './components/ReportSection';
import { Terminal } from './components/Terminal';

function App() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'google' | 'gemini'>('google');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{
    riskReport: string | null;
    cleanedFile: string | null;
  } | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    addToTerminal(`Searching for: ${query}`);

    try {
      const endpoint = activeTab === 'google' ? 'search_google' : 'search_openai';
      //const res = await fetch(`http://localhost:8000/${endpoint}?q=${encodeURIComponent(query)}`);
      const res = await fetch(`http://18.118.197.33:8000/${endpoint}?q=${encodeURIComponent(query)}`);
      //const res = await fetch(`https://hereby-shoes-indonesian-obviously.trycloudflare.com/${endpoint}?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      const mapped: SearchResult[] =
        activeTab === 'google'
          ? (data.items || []).slice(0, 3).map((item: GoogleAPIItem, index: number) => ({
              id: index,
              title: item.title,
              description: item.snippet,
              source: 'google',
              link: item.link
            }))
          : (data.results || []).map((item: GeminiAPIItem, index: number) => ({
              id: index,
              title: item.title || `Result ${index + 1}`,
              description: item.description || item.content || '',
              source: 'gemini',
            }));

      setSearchResults(mapped);
      addToTerminal(`Found ${mapped.length} results`);
    } catch (error) {
      console.error('Search failed:', error);
      addToTerminal('Error during search');
    } finally {
      setIsSearching(false);
    }
  };

  const addToTerminal = (msg: string) => {
    const excludePatterns = [
      /^searching for:/i,
      /results found/i,
      /found \d+ results/i,
    ];
  
    const shouldExclude = excludePatterns.some((pattern) => pattern.test(msg));
    if (!shouldExclude) {
      setTerminalOutput(prev => [...prev, msg]);
    }
  };
  
  return (
    <Layout>
      <SearchSection
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        results={searchResults}
        isSearching={isSearching}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <FileUploadSection
        uploadedFile={uploadedFile}
        onFileUpload={setUploadedFile}
        isProcessing={isProcessing}
        onTerminalOutput={(msg) => addToTerminal(msg)}
        onBackendResponse={(res) => setGeneratedReport({
          riskReport: res.risk_report,
          cleanedFile: res.clean_file
        })}
      />

      <ReportSection
        generatedReport={generatedReport}
        isProcessing={isProcessing}
      />

      <Terminal output={terminalOutput} />
    </Layout>
  );
}

export default App;
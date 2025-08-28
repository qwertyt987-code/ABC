import React, { useState, useRef } from 'react';
import Canvas, { type CanvasRef } from './components/Canvas';
import Toolbar from './components/Toolbar';
import { GithubIcon } from './components/icons';

const App: React.FC = () => {
  const [color, setColor] = useState<string>('#000000');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [wordFile, setWordFile] = useState<File | null>(null);
  const canvasRef = useRef<CanvasRef>(null);

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleSave = () => {
    if (!wordFile) {
      alert("Vui lòng chọn một file Word trước khi lưu.");
      return;
    }
    canvasRef.current?.saveToWord(wordFile);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans">
      <header className="w-full max-w-5xl mb-4">
        <h1 className="text-3xl font-bold text-slate-800 text-center">Chèn ảnh vẽ vào File Word có sẵn</h1>
        <p className="text-center text-slate-600 mt-1">Chọn một file .docx, vẽ, và thêm tác phẩm của bạn vào tài liệu đó.</p>
      </header>
      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-4">
        <Toolbar
          color={color}
          setColor={setColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          onClear={handleClear}
          onSave={handleSave}
          wordFile={wordFile}
          setWordFile={setWordFile}
        />
        <div className="flex-grow h-[60vh] lg:h-auto bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
          <Canvas ref={canvasRef} color={color} lineWidth={lineWidth} />
        </div>
      </main>
      <footer className="w-full max-w-5xl mt-6 text-center text-slate-500 text-sm">
        <p>Phát triển bởi AI, được thiết kế cho sự sáng tạo.</p>
        <a href="https://github.com/google/genai-frontend-apps" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 hover:text-blue-600 transition-colors">
          <GithubIcon className="w-4 h-4" />
          Xem mã nguồn
        </a>
      </footer>
    </div>
  );
};

export default App;
import React from 'react';
import { WordIcon, TrashIcon } from './icons';

interface ToolbarProps {
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  onClear: () => void;
  onSave: () => void;
  wordFile: File | null;
  setWordFile: (file: File | null) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ color, setColor, lineWidth, setLineWidth, onClear, onSave, wordFile, setWordFile }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.docx'))) {
      setWordFile(file);
    } else {
      setWordFile(null);
      if (file) {
        alert("Vui lòng chỉ chọn file có định dạng .docx");
      }
    }
  };
  
  return (
    <div className="w-full lg:w-72 bg-white p-4 rounded-lg shadow-lg flex flex-col gap-6 border border-slate-200">
      <div className="space-y-2">
        <label htmlFor="colorPicker" className="font-semibold text-slate-700">Màu sắc</label>
        <div className="relative w-full h-10 rounded-md overflow-hidden border border-slate-300">
          <input
            id="colorPicker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute -top-2 -left-2 w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="lineWidth" className="font-semibold text-slate-700">Kích thước bút</label>
        <div className="flex items-center gap-2">
          <input
            id="lineWidth"
            type="range"
            min="1"
            max="50"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-8 text-center font-mono text-sm text-slate-600">{lineWidth}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
        <div className="space-y-2">
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer w-full text-center bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 block"
            >
              Mở File Word
            </label>
            <input id="file-upload" type="file" className="hidden" accept=".docx" onChange={handleFileChange} />
            {wordFile && <p className="text-xs text-slate-600 text-center truncate" title={wordFile.name}>Đã chọn: {wordFile.name}</p>}
        </div>

        <button
          onClick={onSave}
          disabled={!wordFile}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          <WordIcon className="w-5 h-5" />
          Thêm ảnh vào Word
        </button>

        <button
          onClick={onClear}
          className="flex items-center justify-center gap-2 w-full bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-md hover:bg-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
        >
          <TrashIcon className="w-5 h-5" />
          Xóa bản vẽ
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
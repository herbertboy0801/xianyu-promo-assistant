
import React, { useRef, useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const NewsGenerator: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Updated defaults based on user screenshot
  const [title, setTitle] = useState('恭喜@Jacky.');
  const [content, setContent] = useState('在生日当天出单了，之前一直偷懒，出单之后看到了希望，虽然不多，好过没有，加油，爆单爆单！！！\n\n这是最好的生日礼物！');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Security Check: Only Admin can access
  useEffect(() => {
    if (!user) {
      navigate('/settings');
      return;
    }
    if (user.role !== 'admin') {
      // alert("只有管理员可以制作喜报");
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    generateCanvas();
  }, [title, content, user]);

  const generateCanvas = async () => {
    if (!canvasRef.current || !user) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup dimensions
    const width = 750;
    const height = 1334;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Red Background (Scroll Style)
    // Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#D32F2F');
    gradient.addColorStop(1, '#B71C1C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative Border (Gold)
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    
    // Inner Container (Light Yellow/Cream)
    ctx.fillStyle = '#FFF8E1';
    ctx.fillRect(60, 250, width - 120, height - 380); // Adjusted top/bottom padding

    // 2. Header Text (Main "XI BAO")
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.font = 'bold 100px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillText("喜   报", width / 2, 140);
    ctx.shadowColor = 'transparent'; // Reset

    // 3. Sub Header (Specific to Screenshot)
    const subHeaderY = 320;
    ctx.fillStyle = '#B71C1C';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("闲鱼爆款选品库会员报喜", width / 2, subHeaderY);
    
    // Sub Header Decoration Lines
    ctx.beginPath();
    ctx.moveTo(100, subHeaderY + 20);
    ctx.lineTo(width - 100, subHeaderY + 20);
    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Content
    // Title (e.g., Congratulating specific user)
    ctx.fillStyle = '#333';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 100, 420);

    // Main Body (Text Wrapping)
    ctx.fillStyle = '#444';
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'left';
    const maxWidth = width - 200;
    const lineHeight = 56;
    const startX = 100;
    const startY = 500;
    
    wrapText(ctx, content, startX, startY, maxWidth, lineHeight);

    // 5. Footer / Signature
    const footerY = height - 220;
    ctx.fillStyle = '#333';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'right';
    
    // Fixed Signature based on screenshot req, fallback to nickname if needed
    const signature = "张老板IP合伙人团队"; 
    ctx.fillText(signature, width - 80, footerY);
    
    const date = new Date();
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(dateStr, width - 80, footerY + 50);

    // Output
    setGeneratedImage(canvas.toDataURL('image/png'));
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    // Handle manual line breaks first
    const paragraphs = text.split('\n');
    let currentY = y;

    paragraphs.forEach(paragraph => {
        const words = paragraph.split(''); // Split by char for Chinese
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        currentY += lineHeight; // Add space after paragraph
    });
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.download = `success-news-${Date.now()}.png`;
      link.href = generatedImage;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
       {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <h2 className="font-bold text-lg text-gray-800">制作成交喜报</h2>
        <input 
          className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入对象 (如: 恭喜@Jacky.)"
          maxLength={20}
        />
        <textarea 
          className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500 h-40"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入报喜详情..."
        />
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center pb-20">
        <canvas ref={canvasRef} className="hidden" />
        {generatedImage && (
          <div className="relative shadow-xl rounded-lg overflow-hidden max-w-[280px] border-4 border-red-900">
            <img src={generatedImage} alt="News Preview" className="w-full h-auto" />
          </div>
        )}
        
        <button 
          onClick={downloadImage}
          className="mt-6 w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg active:bg-red-700 transition-colors flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l3-3m-3 3h7.5" />
          </svg>
          保存喜报图片
        </button>
      </div>
    </div>
  );
};

export default NewsGenerator;


import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useSelection } from '../context/SelectionContext';
import { useNavigate, Link } from 'react-router-dom';
import { generateCopy } from '../services/geminiService';
import { SelectionItem, CopyStyle } from '../types';

const TaskCard: React.FC<{ task: SelectionItem }> = ({ task }) => {
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [activeTab, setActiveTab] = useState<'original' | 'xhs' | 'pyq'>('original');
  const [loadingAi, setLoadingAi] = useState<CopyStyle | null>(null);

  // Determine what to show based on tab
  const getDisplayContent = () => {
    if (activeTab === 'xhs') {
      if (task.xhsCopy && !generatedCopy) return task.xhsCopy;
      return generatedCopy;
    }
    if (activeTab === 'pyq') {
      if (task.pyqCopy && !generatedCopy) return task.pyqCopy;
      return generatedCopy;
    }
    return task.originalCopy;
  };

  const handleGenerateCopy = async (style: CopyStyle) => {
    if (style === 'xiaohongshu' && task.xhsCopy) {
      setActiveTab('xhs');
      setGeneratedCopy('');
      return;
    }
    if (style === 'wechat' && task.pyqCopy) {
      setActiveTab('pyq');
      setGeneratedCopy('');
      return;
    }

    setLoadingAi(style);
    setActiveTab(style === 'xiaohongshu' ? 'xhs' : 'pyq');
    setGeneratedCopy("正在思考创意文案...");

    const result = await generateCopy(style, task.originalCopy);
    setGeneratedCopy(result);
    setLoadingAi(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getDisplayContent());
    alert("文案已复制！");
  };

  const handleDownloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-${task.id}-${index}.png`;
    link.click();
  };

  // Determine images to show: use new 'images' array or fallback to legacy 'imageUrl'
  const displayImages = task.images && task.images.length > 0 ? task.images : (task.imageUrl ? [task.imageUrl] : []);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
      {/* Header: Title & Price */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{task.title}</h3>
          {task.benchmarkShopName && (
            <p className="text-sm text-gray-500 mt-1">
              闲鱼店：<span className="text-gray-800 font-medium">{task.benchmarkShopName}</span>
            </p>
          )}
        </div>
        {task.price && <span className="text-red-500 font-bold text-lg">¥{task.price}</span>}
      </div>

      {/* Uploader Info */}
      <div className="flex items-center gap-2 mb-3 text-[10px] text-gray-400">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">发布者: {task.uploaderName || '管理员'}</span>
        <span>{new Date(task.timestamp).toLocaleString()}</span>
      </div>

      {/* Recommendation Reason */}
      {task.recommendationReason && (
        <div className="mb-4 text-sm text-gray-700">
          <span className="font-bold text-gray-900">推荐理由：</span>
          {task.recommendationReason}
        </div>
      )}

      {/* Image Grid */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">图1产品图，图2闲鱼对标店铺，图3货源店铺推荐</p>
        <div className="grid grid-cols-3 gap-2">
          {displayImages.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100 group">
              <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleDownloadImage(img, idx)}
                className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l3-3m-3 3h7.5" />
                </svg>
              </button>
              {/* Labels */}
              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                {idx === 0 ? '产品图' : (idx === 1 ? '对标店铺' : '货源店铺')}
              </div>
            </div>
          ))}
          {displayImages.length === 0 && (
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 text-xs border border-dashed">
              暂无图片
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {task.tags.map((tag, idx) => (
            <span key={idx} className="text-blue-500 text-sm">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      {(task.benchmarkShopUrl || task.sourceShopUrl) && (
        <div className="flex gap-3 mb-4">
          {task.benchmarkShopUrl && (
            <a href={task.benchmarkShopUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
              🔗 对标店铺链接
            </a>
          )}
          {task.sourceShopUrl && (
            <a href={task.sourceShopUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
              🔗 货源店铺链接
            </a>
          )}
        </div>
      )}

      {/* Copy Tools */}
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400">推广文案:</p>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('original')}
              className={`text-[10px] px-2 py-1 rounded ${activeTab === 'original' ? 'bg-white shadow font-bold' : 'text-gray-500'}`}
            >
              基础
            </button>
            <button
              onClick={() => setActiveTab('xhs')}
              className={`text-[10px] px-2 py-1 rounded ${activeTab === 'xhs' ? 'bg-white shadow font-bold' : 'text-gray-500'}`}
            >
              {task.xhsCopy ? '📕 官方' : '📕 AI'}
            </button>
            <button
              onClick={() => setActiveTab('pyq')}
              className={`text-[10px] px-2 py-1 rounded ${activeTab === 'pyq' ? 'bg-white shadow font-bold' : 'text-gray-500'}`}
            >
              {task.pyqCopy ? '💚 官方' : '💚 AI'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-3 min-h-[100px] whitespace-pre-wrap relative group border border-gray-200">
          {getDisplayContent()}
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 bg-white p-1 rounded shadow-sm group-hover:opacity-100 transition-opacity hover:bg-gray-100"
            title="复制"
          >
            📋
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={() => handleGenerateCopy('xiaohongshu')}
            disabled={loadingAi !== null}
            className={`py-2 px-3 rounded-lg text-sm font-bold text-white transition-all ${loadingAi === 'xiaohongshu' ? 'bg-pink-300' : 'bg-pink-500 hover:bg-pink-600 active:scale-95'}`}
          >
            {loadingAi === 'xiaohongshu' ? '...' : (task.xhsCopy ? '使用小红书文案' : '✨ AI 生成小红书')}
          </button>
          <button
            onClick={() => handleGenerateCopy('wechat')}
            disabled={loadingAi !== null}
            className={`py-2 px-3 rounded-lg text-sm font-bold text-white transition-all ${loadingAi === 'wechat' ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700 active:scale-95'}`}
          >
            {loadingAi === 'wechat' ? '...' : (task.pyqCopy ? '使用朋友圈文案' : '✨ AI 生成朋友圈')}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, hasRole, globalConfig } = useUser();
  const { items } = useSelection();

  if (!user) return null;

  const isPaidMember = hasRole('member') || hasRole('admin');
  const hasMasterTemplate = user.masterTemplate || globalConfig?.masterTemplate;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900">你好, {user.nickname} 👋</h1>
          <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPaidMember ? 'bg-xianyu-yellow text-black' : 'bg-gray-200 text-gray-600'}`}>
              {hasRole('admin') ? '管理员' : (isPaidMember ? '星球会员 (已付费)' : '推广者 (免费)')}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          {hasRole('admin') && (
            <Link to="/admin" className="flex flex-col items-center justify-center text-xs text-gray-400 hover:text-xianyu-black">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                ➕
              </div>
              发布
            </Link>
          )}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
            {user.qrCode ? (
              <img src={user.qrCode} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">无</div>
            )}
          </div>
        </div>
      </div>

      {/* Promotion Poster Entry - Available to EVERYONE */}
      <div className="bg-gradient-to-r from-xianyu-yellow to-yellow-300 rounded-xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-bold text-gray-800 text-lg">📣 推广素材中心</h3>
          <p className="text-xs text-gray-800 mt-1 opacity-80">
            {isPaidMember ? '招募更多会员，赚取佣金' : '免费领取海报与文案，开启副业'}
          </p>
        </div>
        <Link to="/master-poster" className="relative z-10 bg-black text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg active:scale-95 transition-transform">
          进入推广
        </Link>
        {/* Decorative Element */}
        <div className="absolute right-[-10px] bottom-[-20px] text-[80px] opacity-10 rotate-12">🚀</div>
      </div>

      {!hasMasterTemplate && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>💡 尚未设置通用推广底图，去设置？</span>
          <Link to="/settings" className="font-bold underline">去设置</Link>
        </div>
      )}

      {/* Product List - PERMISSION GATED */}
      <div>
        <div className="flex items-center justify-between mb-4 ml-1">
          <h2 className="font-bold text-gray-800">📦 今日爆款推荐 (上架闲鱼)</h2>
          {!isPaidMember && <span className="text-[10px] bg-gray-200 px-2 py-1 rounded text-gray-500">🔒 会员专享</span>}
        </div>

        {isPaidMember ? (
          /* PAID VIEW: Show Products */
          <>
            {(!items || items.length === 0) ? (
              <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
                暂无选品，{user.role === 'admin' ? '请点击右上角发布' : '请等待爆品选品官发布'}
              </div>
            ) : (
              items.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </>
        ) : (
          /* FREE VIEW: Show Locked State */
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-full shadow-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">此区域为「星球会员」专享</h3>
              <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed mb-6">
                加入付费星球会员，即可查看每日爆款选品，直接复制上架闲鱼赚钱。
              </p>
              <button
                onClick={() => alert("请联系管理员开通会员权限")}
                className="bg-xianyu-yellow text-black font-bold px-6 py-2.5 rounded-full text-sm shadow-md active:scale-95 transition-transform"
              >
                联系加入会员
              </button>
            </div>
            {/* Fake Background Items to make it look "full" behind the blur */}
            <div className="opacity-20 pointer-events-none blur-sm select-none">
              <div className="bg-gray-200 h-32 rounded-lg mb-4 w-full"></div>
              <div className="bg-gray-200 h-32 rounded-lg mb-4 w-full"></div>
              <div className="bg-gray-200 h-32 rounded-lg mb-4 w-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

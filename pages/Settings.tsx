
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { QrConfig } from '../types';

const Settings: React.FC = () => {
  const { user, updateUser, globalConfig, updateGlobalConfig, hasRole } = useUser();
  const [nickname, setNickname] = useState('');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [templateImage, setTemplateImage] = useState<string | null>(null);

  // QR Config State
  const [qrConfig, setQrConfig] = useState<QrConfig>({
    x: 50,
    y: 1100,
    size: 180,
    zoom: 1,
    cropX: 0,
    cropY: 0
  });

  // Preview scaling state
  const [imgAspectRatio, setImgAspectRatio] = useState<number>(1.77); // Default 16:9 approx
  const PREVIEW_WIDTH = 300;

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      setQrImage(user.qrCode);

      // Use Global Template if user doesn't have one, or if they are admin viewing it
      if (user.masterTemplate) {
        setTemplateImage(user.masterTemplate);
      } else if (globalConfig.masterTemplate) {
        setTemplateImage(globalConfig.masterTemplate);
      }

      if (user.qrConfig) {
        setQrConfig({
          ...user.qrConfig,
          zoom: user.qrConfig.zoom || 1,
          cropX: user.qrConfig.cropX || 0,
          cropY: user.qrConfig.cropY || 0
        });
      }
    }
  }, [user, globalConfig]);

  // Load image to get aspect ratio when template changes
  useEffect(() => {
    if (templateImage) {
      const img = new Image();
      img.onload = () => {
        if (img.width > 0) {
          setImgAspectRatio(img.height / img.width);
        }
      };
      img.src = templateImage;
    }
  }, [templateImage]);

  const handleFileChange = (setter: (val: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateUpload = handleFileChange(setTemplateImage);

  const handleConfigChange = (key: keyof QrConfig, value: number) => {
    setQrConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!nickname) {
      alert("请填写昵称");
      return;
    }

    // Save User Profile
    updateUser({
      nickname,
      qrCode: qrImage || '',
      // If user is NOT admin, they don't save masterTemplate to their profile anymore, 
      // they just use global. UNLESS we want to allow override. 
      // For simplicity and per user request "User sees this as initial", let's say they can't override for now, 
      // or if they do, it saves to their profile.
      // Let's allow override but default is global.
      masterTemplate: templateImage || undefined,
      qrConfig
    });

    // If Admin, ALSO save as Global Default
    if (hasRole('admin') && templateImage) {
      if (confirm("是否将此底图设为「全局默认底图」？(所有新用户将默认看到此图)")) {
        await updateGlobalConfig({
          masterTemplate: templateImage,
          qrConfig: qrConfig // Also save the current QR config as global default
        });
      }
    }

    alert("设定已保存！");
    navigate('/');
  };

  // The base width for coordinates is 750px (standard mobile design width)
  const scaleFactor = PREVIEW_WIDTH / 750;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mt-4 animate-fade-in pb-20">
      <h2 className="text-xl font-bold mb-6 border-l-4 border-xianyu-yellow pl-3">
        {hasRole('admin') ? '管理员设定' : '个人设定'}
      </h2>

      <div className="space-y-8">

        {/* 1. User Identity */}
        <section className="space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">1. 个人身份信息</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              微信昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-xianyu-yellow outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              微信二维码 (一张图，双用途)
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                {qrImage ? (
                  <img src={qrImage} alt="QR" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">上传</span>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange(setQrImage)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="text-xs text-gray-500 flex-1 space-y-1">
                <p>请上传完整的个人名片二维码。</p>
                <ul className="list-disc pl-3 text-gray-400">
                  <li>海报上：使用下方的校准工具进行剪裁。</li>
                  <li>素材库：系统会作为完整名片让您下载。</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Global Template (Admin Only) */}
        {hasRole('admin') && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 border-b pb-2">2. 全局推广底图 (长图)</h3>

            <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200 text-center">
              {templateImage ? (
                <div className="relative">
                  <img src={templateImage} alt="Template" className="max-h-60 mx-auto rounded shadow-sm" />
                  <button
                    onClick={() => setTemplateImage(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block py-8">
                  <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">上传一张「长海报」底图，系统会自动在指定位置贴上你的二维码。</span>
                  <input type="file" accept="image/*" onChange={handleTemplateUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Calibration (Admin Only) */}
        {hasRole('admin') && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 border-b pb-2">3. 二维码位置校准</h3>

            <div className="bg-orange-50 p-3 rounded-lg text-xs text-orange-800 flex items-start gap-2">
              <span>👇</span>
              <span>下方是预览图，请拖动滑块将红框移至底图的二维码位置</span>
            </div>

            {/* Preview Area */}
            <div
              className="relative w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner"
              style={{ aspectRatio: `${1 / imgAspectRatio}` }}
            >
              {/* Background */}
              {templateImage && <img src={templateImage} className="absolute inset-0 w-full h-full object-cover" />}

              {/* QR Code Placeholder/Actual */}
              <div
                className="absolute border-2 border-red-500 bg-red-500/20 flex items-center justify-center text-red-500 font-bold text-[10px] z-10"
                style={{
                  left: `${(qrConfig.x / 750) * 100}%`,
                  top: `${(qrConfig.y / (750 * imgAspectRatio)) * 100}%`,
                  width: `${(qrConfig.size / 750) * 100}%`,
                  height: `${(qrConfig.size / (750 * imgAspectRatio)) * 100}%`
                }}
              >
                {qrImage && (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img
                      src={qrImage}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${qrConfig.zoom}) translate(${qrConfig.cropX}%, ${qrConfig.cropY}%)`,
                        transformOrigin: 'center center'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-6">

              <div className="space-y-3">
                <h4 className="font-bold text-xs text-gray-500">1. 海报位置校准 (红框在哪)</h4>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-12 font-bold">水平 X:</span>
                  <input type="range" min="0" max="750" value={qrConfig.x} onChange={e => handleConfigChange('x', Number(e.target.value))} className="flex-1 accent-black" />
                  <span className="text-xs w-8 text-right font-mono">{qrConfig.x}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-12 font-bold">垂直 Y:</span>
                  <input type="range" min="0" max={Math.ceil(750 * imgAspectRatio)} value={qrConfig.y} onChange={e => handleConfigChange('y', Number(e.target.value))} className="flex-1 accent-black" />
                  <span className="text-xs w-8 text-right font-mono">{qrConfig.y}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-12 font-bold">大小:</span>
                  <input type="range" min="50" max="500" value={qrConfig.size} onChange={e => handleConfigChange('size', Number(e.target.value))} className="flex-1 accent-black" />
                  <span className="text-xs w-8 text-right font-mono">{qrConfig.size}</span>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-bold text-xs text-red-500">2. 二维码内容剪裁 (去除名片杂质)</h4>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-12 font-bold text-red-500">缩放:</span>
                  <input type="range" min="1" max="3" step="0.1" value={qrConfig.zoom} onChange={e => handleConfigChange('zoom', Number(e.target.value))} className="flex-1 accent-red-500" />
                  <span className="text-xs w-8 text-right font-mono">{qrConfig.zoom}x</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-12 font-bold text-red-500">左/右:</span>
                  <input type="range" min="-50" max="50" value={qrConfig.cropX} onChange={e => handleConfigChange('cropX', Number(e.target.value))} className="flex-1 accent-red-500" />
                  <span className="text-xs w-8 text-right font-mono">{qrConfig.cropX}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-12 font-bold text-red-500">上/下:</span>
                  <input type="range" min="-50" max="50" value={qrConfig.cropY} onChange={e => handleConfigChange('cropY', Number(e.target.value))} className="flex-1 accent-red-500" />
                  <span className="text-xs w-8 text-right font-mono">{qrConfig.cropY}%</span>
                </div>
                <p className="text-[10px] text-gray-400">💡 先「缩放」放大图片，再调整「左/右」「上/下」将二维码移到红框正中间。</p>
              </div>

            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full bg-xianyu-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          保存所有设定
        </button>
      </div>
    </div>
  );
};

export default Settings;

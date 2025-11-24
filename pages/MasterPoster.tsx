import React, { useState, useEffect } from 'react';
import PosterGenerator from '../components/PosterGenerator';
import { useUser } from '../context/UserContext';
import { useSelection } from '../context/SelectionContext';
import { Link } from 'react-router-dom';

const MasterPoster: React.FC = () => {
    const { user, globalConfig } = useUser();
    const { promoItems } = useSelection();
    const [posterBase64, setPosterBase64] = useState<string | null>(null);

    // Determine effective template and config
    const effectiveTemplate = user.masterTemplate || globalConfig.masterTemplate;
    // If using global template, prefer global config. If user has their own template, use their config (which is handled by PosterGenerator default if we pass undefined, but here we want to be explicit).
    // Actually, if user.masterTemplate is set, we assume user.qrConfig is correct.
    // If user.masterTemplate is NOT set, we use globalConfig.masterTemplate AND globalConfig.qrConfig.
    const effectiveQrConfig = user.masterTemplate ? undefined : globalConfig.qrConfig;

    const filteredItems = promoItems;

    const getAggregatedImages = (promoImages?: string[]) => {
        const images = [...(promoImages || [])];
        // Always add Master Poster if generated
        if (posterBase64) images.push(posterBase64);
        // Always add User QR Code if available
        if (user.qrCode) images.push(user.qrCode);
        return images;
    };

    const downloadImage = (base64: string, filename: string) => {
        const link = document.createElement('a');
        link.href = base64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleBatchDownload = (content: string, images: string[], id: string) => {
        // Copy text
        copyText(content);

        // Download all images
        images.forEach((img, idx) => {
            setTimeout(() => {
                downloadImage(img, `promo-${id}-${idx}.png`);
            }, idx * 500); // Stagger downloads
        });

        alert('文案已复制，图片开始下载...');
    };

    return (
        <div className="animate-fade-in pb-20">

            {/* Hidden Generator just to create the asset */}
            <div className="fixed opacity-0 pointer-events-none -z-50">
                {/* Pass effective template to generator if needed, but generator currently reads from user context. 
            We might need to update PosterGenerator to accept template prop or read globalConfig.
            Let's assume PosterGenerator needs update or we rely on user context having it.
            Actually, Settings saves to user profile, so user.masterTemplate might be set.
            But if user relies on global, user.masterTemplate is undefined.
            So we need to pass effectiveTemplate to PosterGenerator.
        */}
                <PosterGenerator
                    isMaster={true}
                    onImageGenerated={setPosterBase64}
                    templateOverride={effectiveTemplate}
                    qrConfigOverride={effectiveQrConfig}
                />
            </div>

            <div className="bg-white sticky top-14 z-20 shadow-sm pt-2 pb-0 px-2 mb-4">
                {/* ... (Header) */}
            </div>

            <div className="space-y-6 px-4">
                {/* Missing Template Warning */}
                {!effectiveTemplate && (
                    <div className="bg-orange-50 p-3 rounded-lg flex items-center gap-2 text-xs text-orange-700 border border-orange-100">
                        <span>⚠️</span>
                        <span>你还没有设置“长海报”底图，素材将不完整。</span>
                        <Link to="/settings" className="underline font-bold">去设置</Link>
                    </div>
                )}

                {(!filteredItems || filteredItems.length === 0) ? (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <p className="text-gray-400 text-sm">
                            暂无推广素材
                        </p>
                    </div>
                ) : (
                    filteredItems.map((item) => {
                        const displayImages = getAggregatedImages(item.images);

                        return (
                            <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-xianyu-yellow/20 text-xianyu-black text-[10px] font-bold px-2 py-1 rounded">
                                            {new Date(item.timestamp).getMonth() + 1}月{new Date(item.timestamp).getDate()}日
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="mb-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {item.content}
                                </div>

                                {/* Image Grid (Like Moments/Xiaohongshu) */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {displayImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50 group">
                                            <img src={img} className="w-full h-full object-cover" alt="material" />

                                            {/* Labels for context */}
                                            {img === posterBase64 && <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] text-center py-0.5">你的长海报</div>}
                                            {img === user.qrCode && <div className="absolute bottom-0 inset-x-0 bg-green-500 text-white text-[8px] text-center py-0.5">你的名片</div>}

                                            <button
                                                onClick={() => downloadImage(img, `img-${idx}.png`)}
                                                className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Bar */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { copyText(item.content); alert('文案已复制'); }}
                                        className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center gap-1 active:bg-gray-50"
                                    >
                                        仅复制文案
                                    </button>
                                    <button
                                        onClick={() => handleBatchDownload(item.content, displayImages, item.id)}
                                        className="flex-1 py-2.5 rounded-lg bg-xianyu-yellow text-black text-sm font-bold flex items-center justify-center gap-1 shadow-md active:scale-95 transition-transform"
                                    >
                                        🚀 一键备料 (文案+图)
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

        </div>
    );
};

export default MasterPoster;
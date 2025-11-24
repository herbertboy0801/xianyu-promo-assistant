import React, { useState } from 'react';
import { useSelection } from '../context/SelectionContext';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const AdminSelection: React.FC = () => {
    const { items, promoItems, addItem, updateItem, addPromoItem, updatePromoItem, deleteItem, deletePromoItem } = useSelection();
    const { allUsers, toggleUserRole, deleteUser, hasRole, user, isLoading } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'product' | 'promo' | 'members'>('product');
    const [productView, setProductView] = useState<'create' | 'list'>('create');
    const [promoView, setPromoView] = useState<'create' | 'list'>('create');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

    // Product State
    const [title, setTitle] = useState('');
    const [originalCopy, setOriginalCopy] = useState('');
    const [price, setPrice] = useState('');

    // New Fields State
    const [benchmarkShopName, setBenchmarkShopName] = useState('');
    const [recommendationReason, setRecommendationReason] = useState('');
    const [tags, setTags] = useState(''); // Comma separated
    const [benchmarkShopUrl, setBenchmarkShopUrl] = useState('');
    const [sourceShopUrl, setSourceShopUrl] = useState('');

    // Images: [Product, Benchmark, Source]
    const [productImage, setProductImage] = useState('');
    const [benchmarkImage, setBenchmarkImage] = useState('');
    const [sourceImage, setSourceImage] = useState('');

    // Promo State
    const [promoContent, setPromoContent] = useState('');
    const [promoImages, setPromoImages] = useState<string[]>([]);

    // Loading State
    if (isLoading) {
        return <div className="p-10 text-center text-gray-500">加载中...</div>;
    }

    // Permissions
    const canManageProducts = hasRole('product_selector');
    const canManagePromos = hasRole('promo_ambassador');
    const canManageMembers = hasRole('admin');

    // Redirect if no permissions
    if (!canManageProducts && !canManagePromos && !canManageMembers) {
        return <div className="p-10 text-center">您没有权限访问此页面</div>;
    }

    // Auto-switch tab if current tab is not allowed
    // Note: This logic runs on every render, so we need to be careful not to cause infinite loops.
    // However, since we only switch if the current activeTab is invalid, it should settle.
    if (activeTab === 'product' && !canManageProducts) {
        if (canManagePromos) setActiveTab('promo');
        else if (canManageMembers) setActiveTab('members');
    }

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingItemId) {
            // Edit mode
            await handleUpdateProduct(e);
        } else {
            // Create mode
            if (!title) return alert('标题必填');

            const imageList = [productImage, benchmarkImage, sourceImage].filter(Boolean);

            await addItem({
                title,
                originalCopy,
                xhsCopy: '',
                pyqCopy: '',
                imageUrl: productImage,
                images: imageList,
                price,
                benchmarkShopName,
                recommendationReason,
                tags: tags.split(/[,，\s]+/).filter(Boolean),
                benchmarkShopUrl,
                sourceShopUrl
            });

            alert('发布成功！会员可在工作台看到此选品。');
            // Reset form
            setTitle(''); setOriginalCopy(''); setPrice('');
            setProductImage(''); setBenchmarkImage(''); setSourceImage('');
            setBenchmarkShopName(''); setRecommendationReason(''); setTags('');
            setBenchmarkShopUrl(''); setSourceShopUrl('');
            setProductView('list');
        }
    };

    const handlePromoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingPromoId) {
            // Edit mode
            await handleUpdatePromo(e);
        } else {
            // Create mode
            if (!promoContent) return alert('推广文案必填');

            await addPromoItem({
                content: promoContent,
                images: promoImages
            });

            alert('推广素材发布成功！');
            setPromoContent(''); setPromoImages([]);
            setPromoView('list');
        }
    }

    // Edit and Delete handlers for Products
    const handleEditProduct = (item: any) => {
        setEditingItemId(item.id);
        setTitle(item.title);
        setOriginalCopy(item.originalCopy || '');
        setPrice(item.price || '');
        setProductImage(item.images?.[0] || '');
        setBenchmarkImage(item.images?.[1] || '');
        setSourceImage(item.images?.[2] || '');
        setBenchmarkShopName(item.benchmarkShopName || '');
        setRecommendationReason(item.recommendationReason || '');
        setTags(item.tags?.join(', ') || '');
        setBenchmarkShopUrl(item.benchmarkShopUrl || '');
        setSourceShopUrl(item.sourceShopUrl || '');
        setProductView('create');
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItemId || !title) return alert('标题必填');

        const imageList = [productImage, benchmarkImage, sourceImage].filter(Boolean);

        await updateItem(editingItemId, {
            title,
            originalCopy,
            imageUrl: productImage,
            images: imageList,
            price,
            benchmarkShopName,
            recommendationReason,
            tags: tags.split(/[,，\s]+/).filter(Boolean),
            benchmarkShopUrl,
            sourceShopUrl
        });

        alert('更新成功！');
        // Reset form
        setEditingItemId(null);
        setTitle(''); setOriginalCopy(''); setPrice('');
        setProductImage(''); setBenchmarkImage(''); setSourceImage('');
        setBenchmarkShopName(''); setRecommendationReason(''); setTags('');
        setBenchmarkShopUrl(''); setSourceShopUrl('');
        setProductView('list');
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('确定要删除这个选品吗？')) return;
        await deleteItem(id);
        alert('删除成功！');
    };

    // Edit and Delete handlers for Promo Items  
    const handleEditPromo = (item: any) => {
        setEditingPromoId(item.id);
        setPromoContent(item.content);
        setPromoImages(item.images || []);
        setPromoView('create');
    };

    const handleUpdatePromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPromoId || !promoContent) return alert('推广文案必填');

        await updatePromoItem(editingPromoId, {
            content: promoContent,
            images: promoImages
        });

        alert('更新成功！');
        setEditingPromoId(null);
        setPromoContent(''); setPromoImages([]);
        setPromoView('list');
    };

    const handleDeletePromo = async (id: string) => {
        if (!confirm('确定要删除这个推广素材吗？')) return;
        await deletePromoItem(id);
        alert('删除成功！');
    };

    const cancelEdit = () => {
        setEditingItemId(null);
        setEditingPromoId(null);
        setTitle(''); setOriginalCopy(''); setPrice('');
        setProductImage(''); setBenchmarkImage(''); setSourceImage('');
        setBenchmarkShopName(''); setRecommendationReason(''); setTags('');
        setBenchmarkShopUrl(''); setSourceShopUrl('');
        setPromoContent(''); setPromoImages([]);
    };

    // Helper for image compression
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG with 0.7 quality
                };
            };
        });
    };

    // Helper for image upload
    const handleImageUpload = (setter: (val: string) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setter(compressed);
            } catch (error) {
                console.error("Image compression failed", error);
                alert("图片处理失败，请重试");
            }
        }
    };

    const handlePromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setPromoImages([...promoImages, compressed]);
            } catch (error) {
                console.error("Image compression failed", error);
                alert("图片处理失败，请重试");
            }
        }
    }

    // Filter out admins from member list (optional, or show all)
    const memberList = allUsers.filter(u => u.nickname !== '管理员');

    return (
        <div className="pb-20 animate-fade-in">
            <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {hasRole('admin') ? '超级管理员后台' : '工作台'}
                </h2>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                    {canManageProducts && (
                        <button
                            onClick={() => setActiveTab('product')}
                            className={`flex-shrink-0 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'product' ? 'border-xianyu-yellow text-black' : 'border-transparent text-gray-400'}`}
                        >
                            我是爆品选品官
                        </button>
                    )}
                    {canManagePromos && (
                        <button
                            onClick={() => setActiveTab('promo')}
                            className={`flex-shrink-0 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'promo' ? 'border-xianyu-yellow text-black' : 'border-transparent text-gray-400'}`}
                        >
                            我是咸鱼推广大使
                        </button>
                    )}
                    {canManageMembers && (
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex-shrink-0 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'members' ? 'border-xianyu-yellow text-black' : 'border-transparent text-gray-400'}`}
                        >
                            人员权限管理 ({memberList.length})
                        </button>
                    )}
                </div>

                {activeTab === 'product' && canManageProducts && (
                    <div>
                        {/* View Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => { setProductView('create'); cancelEdit(); }}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${productView === 'create' ? 'bg-xianyu-yellow text-black' : 'bg-gray-100 text-gray-600'}`}
                            >
                                {editingItemId ? '✏️ 编辑选品' : '➕ 发布新选品'}
                            </button>
                            <button
                                onClick={() => setProductView('list')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${productView === 'list' ? 'bg-xianyu-yellow text-black' : 'bg-gray-100 text-gray-600'}`}
                            >
                                📋 我的选品
                            </button>
                        </div>

                        {productView === 'create' ? (
                            <form onSubmit={handleProductSubmit} className="space-y-4">
                                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    {editingItemId ? '编辑你发布的选品' : '发布今日的"闲鱼爆款"商品。仅「会员」可见。'}
                                </p>

                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">商品标题</label>
                                        <input
                                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow"
                                            placeholder="例如: 95新 iPad Air 4"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">采购参考价 (可选)</label>
                                        <input
                                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* New Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">闲鱼对标店名</label>
                                        <input
                                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow"
                                            placeholder="例如: 爱吃肉蒸鸡蛋的顾念"
                                            value={benchmarkShopName}
                                            onChange={e => setBenchmarkShopName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">推荐理由</label>
                                        <input
                                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow"
                                            placeholder="例如: 冷门，高客单"
                                            value={recommendationReason}
                                            onChange={e => setRecommendationReason(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">标签 (空格或逗号分隔)</label>
                                    <input
                                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow"
                                        placeholder="#五金工具 #商用产品 #高客单选品"
                                        value={tags}
                                        onChange={e => setTags(e.target.value)}
                                    />
                                </div>

                                {/* Links */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">对标店铺链接 (可选)</label>
                                        <input
                                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow"
                                            placeholder="https://..."
                                            value={benchmarkShopUrl}
                                            onChange={e => setBenchmarkShopUrl(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">货源店铺链接 (可选)</label>
                                        <input
                                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow"
                                            placeholder="https://..."
                                            value={sourceShopUrl}
                                            onChange={e => setSourceShopUrl(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">基础文案 (可选)</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow h-24"
                                        value={originalCopy}
                                        onChange={e => setOriginalCopy(e.target.value)}
                                    />
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">图片上传 (图1产品，图2对标，图3货源)</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Product Image */}
                                        <div className="space-y-1">
                                            <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center group">
                                                {productImage ? (
                                                    <>
                                                        <img src={productImage} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setProductImage(''); }}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                ) : <span className="text-gray-400 text-xs">商品图</span>}
                                                <input type="file" accept="image/*" onChange={handleImageUpload(setProductImage)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                        {/* Benchmark Image */}
                                        <div className="space-y-1">
                                            <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center group">
                                                {benchmarkImage ? (
                                                    <>
                                                        <img src={benchmarkImage} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setBenchmarkImage(''); }}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                ) : <span className="text-gray-400 text-xs">对标图</span>}
                                                <input type="file" accept="image/*" onChange={handleImageUpload(setBenchmarkImage)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                        {/* Source Image */}
                                        <div className="space-y-1">
                                            <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center group">
                                                {sourceImage ? (
                                                    <>
                                                        <img src={sourceImage} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setSourceImage(''); }}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                ) : <span className="text-gray-400 text-xs">货源店铺图</span>}
                                                <input type="file" accept="image/*" onChange={handleImageUpload(setSourceImage)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl mt-4">发布到选品库</button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    我发布的选品 ({items.filter(item => item.uploaderName === user?.nickname).length} 条)
                                </p>
                                {(() => {
                                    const myItems = items.filter(item => item.uploaderName === user?.nickname);
                                    if (myItems.length === 0) {
                                        return (
                                            <div className="text-center py-10 text-gray-400">
                                                暂无发布的选品
                                            </div>
                                        );
                                    }
                                    return myItems.map(item => (
                                        <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg">{item.title}</h3>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditProduct(item)}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                                    >
                                                        ✏️ 编辑
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(item.id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                                    >
                                                        🗑️ 删除
                                                    </button>
                                                </div>
                                            </div>
                                            {item.price && <p className="text-red-500 font-bold">¥{item.price}</p>}
                                            {item.recommendationReason && (
                                                <p className="text-sm text-gray-600 mt-2">{item.recommendationReason}</p>
                                            )}
                                            {item.images && item.images.length > 0 && (
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    {item.images.map((img, idx) => (
                                                        <img key={idx} src={img} className="w-full aspect-square object-cover rounded" alt="" />
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                发布于: {new Date(item.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'promo' && canManagePromos && (
                    <div>
                        {/* View Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => { setPromoView('create'); cancelEdit(); }}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${promoView === 'create' ? 'bg-xianyu-yellow text-black' : 'bg-gray-100 text-gray-600'}`}
                            >
                                {editingPromoId ? '✏️ 编辑素材' : '➕ 发布新素材'}
                            </button>
                            <button
                                onClick={() => setPromoView('list')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${promoView === 'list' ? 'bg-xianyu-yellow text-black' : 'bg-gray-100 text-gray-600'}`}
                            >
                                📋 我的素材
                            </button>
                        </div>

                        {promoView === 'create' ? (
                            <form onSubmit={handlePromoSubmit} className="bg-white p-5 rounded-xl shadow-sm mb-6 space-y-4">
                                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    {editingPromoId ? '编辑你发布的推广素材' : '发布招募素材（如：3大核心权益介绍）。所有用户可见，用于发圈招募。'}
                                </p>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">推广文案</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-xianyu-yellow h-48"
                                        placeholder="请输入详细的招募文案，如：核心权益介绍..."
                                        value={promoContent}
                                        onChange={e => setPromoContent(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">推广图片</label>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {promoImages.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setPromoImages(promoImages.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer">
                                            <span className="text-2xl">+</span>
                                            <input type="file" accept="image/*" onChange={handlePromoImageUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-xianyu-yellow text-black font-bold py-4 rounded-xl mt-4">
                                    {editingPromoId ? '更新素材' : '发布推广素材'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    我发布的推广素材 ({promoItems.length} 条)
                                </p>
                                {promoItems.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        暂无发布的推广素材
                                    </div>
                                ) : (
                                    promoItems.map(item => (
                                        <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-700">推广素材</h3>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditPromo(item)}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                                    >
                                                        ✏️ 编辑
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePromo(item.id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                                    >
                                                        🗑️ 删除
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                                                {item.content}
                                            </p>
                                            {item.images && item.images.length > 0 && (
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    {item.images.map((img, idx) => (
                                                        <img key={idx} src={img} className="w-full aspect-square object-cover rounded" alt="" />
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                发布于: {new Date(item.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && canManageMembers && (
                    <div className="bg-white p-5 rounded-xl shadow-sm mb-6 space-y-4">
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            管理所有注册用户。勾选对应的身份标签赋予权限。
                        </p>

                        {memberList.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">暂无用户注册</div>
                        ) : (
                            <div className="space-y-3">
                                {memberList.map((u) => (
                                    <div key={u.nickname} className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                                    {u.qrCode ? <img src={u.qrCode} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-gray-800">{u.nickname}</h3>
                                                    <p className="text-[10px] text-gray-500">
                                                        {new Date(u.joinDate || Date.now()).toLocaleDateString()} 加入
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { if (confirm('确认删除此用户?')) deleteUser(u.nickname) }}
                                                className="text-xs text-red-400 hover:text-red-600"
                                            >
                                                删除用户
                                            </button>
                                        </div>

                                        {/* Role Toggles */}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => toggleUserRole(u.nickname, 'member')}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${u.roles?.includes('member') || u.roles?.includes('admin') ? 'bg-xianyu-yellow border-xianyu-yellow text-black' : 'bg-white border-gray-200 text-gray-400'}`}
                                                disabled={u.roles?.includes('admin')}
                                            >
                                                {u.roles?.includes('member') || u.roles?.includes('admin') ? '✓ 会员 (看选品)' : '+ 会员'}
                                            </button>

                                            <button
                                                onClick={() => toggleUserRole(u.nickname, 'promo_ambassador')}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${u.roles?.includes('promo_ambassador') || u.roles?.includes('admin') ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-400'}`}
                                                disabled={u.roles?.includes('admin')}
                                            >
                                                {u.roles?.includes('promo_ambassador') || u.roles?.includes('admin') ? '✓ 推广大使 (发文案)' : '+ 推广大使'}
                                            </button>

                                            <button
                                                onClick={() => toggleUserRole(u.nickname, 'product_selector')}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${u.roles?.includes('product_selector') || u.roles?.includes('admin') ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-400'}`}
                                                disabled={u.roles?.includes('admin')}
                                            >
                                                {u.roles?.includes('product_selector') || u.roles?.includes('admin') ? '✓ 选品官 (发选品)' : '+ 选品官'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSelection;

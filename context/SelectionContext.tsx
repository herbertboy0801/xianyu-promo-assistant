import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SelectionItem } from '../types';
import { supabase } from '../services/supabase';
import { useUser } from './UserContext';

interface SelectionContextType {
  items: SelectionItem[];
  promoItems: Array<{ id: string; content: string; images: string[]; timestamp: number }>;
  addItem: (item: Omit<SelectionItem, 'id' | 'timestamp' | 'type'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<SelectionItem, 'id' | 'timestamp' | 'type'>>) => Promise<void>;
  addPromoItem: (item: { content: string; images: string[] }) => Promise<void>;
  updatePromoItem: (id: string, updates: { content?: string; images?: string[] }) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deletePromoItem: (id: string) => Promise<void>;
  isLoading: boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<SelectionItem[]>([]);
  const [promoItems, setPromoItems] = useState<Array<{ id: string; content: string; images: string[]; timestamp: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    fetchItems();
    fetchPromoItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedItems: SelectionItem[] = data.map(item => ({
          id: item.id,
          type: 'product',
          title: item.title,
          originalCopy: item.original_copy,
          xhsCopy: item.xhs_copy,
          pyqCopy: item.pyq_copy,
          imageUrl: item.image_url,
          images: item.images,
          price: item.price,
          benchmarkShopName: item.benchmark_shop_name,
          recommendationReason: item.recommendation_reason,
          tags: item.tags,
          benchmarkShopUrl: item.benchmark_shop_url,
          sourceShopUrl: item.source_shop_url,
          uploaderName: item.uploader_name,
          timestamp: item.timestamp
        }));
        setItems(mappedItems);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (item: Omit<SelectionItem, 'id' | 'timestamp' | 'type'>) => {
    const newItem = {
      id: Date.now().toString(),
      title: item.title,
      original_copy: item.originalCopy,
      xhs_copy: item.xhsCopy,
      pyq_copy: item.pyqCopy,
      image_url: item.imageUrl,
      images: item.images,
      price: item.price,
      benchmark_shop_name: item.benchmarkShopName,
      recommendation_reason: item.recommendationReason,
      tags: item.tags,
      benchmark_shop_url: item.benchmarkShopUrl,
      source_shop_url: item.sourceShopUrl,
      uploader_name: user?.nickname || '管理员',
      timestamp: Date.now()
    };

    try {
      const { error } = await supabase
        .from('products')
        .insert(newItem);

      if (error) throw error;

      const frontendItem: SelectionItem = {
        ...item,
        id: newItem.id,
        type: 'product',
        timestamp: newItem.timestamp,
        uploaderName: newItem.uploader_name
      };
      setItems(prev => [frontendItem, ...prev]);
    } catch (e) {
      console.error("Error adding product:", e);
      alert("发布失败");
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<SelectionItem, 'id' | 'timestamp' | 'type'>>) => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.originalCopy !== undefined) dbUpdates.original_copy = updates.originalCopy;
      if (updates.xhsCopy !== undefined) dbUpdates.xhs_copy = updates.xhsCopy;
      if (updates.pyqCopy !== undefined) dbUpdates.pyq_copy = updates.pyqCopy;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.images !== undefined) dbUpdates.images = updates.images;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.benchmarkShopName !== undefined) dbUpdates.benchmark_shop_name = updates.benchmarkShopName;
      if (updates.recommendationReason !== undefined) dbUpdates.recommendation_reason = updates.recommendationReason;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.benchmarkShopUrl !== undefined) dbUpdates.benchmark_shop_url = updates.benchmarkShopUrl;
      if (updates.sourceShopUrl !== undefined) dbUpdates.source_shop_url = updates.sourceShopUrl;

      const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (e) {
      console.error("Error updating product:", e);
      alert("更新失败");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error("Error deleting product:", e);
      alert("删除失败");
    }
  };

  const fetchPromoItems = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_items')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (data) {
        setPromoItems(data);
      }
    } catch (e) {
      console.error("Error fetching promo items:", e);
    }
  };

  const addPromoItem = async (item: { content: string; images: string[] }) => {
    const newItem = {
      id: Date.now().toString(),
      content: item.content,
      images: item.images,
      timestamp: Date.now()
    };

    try {
      const { error } = await supabase
        .from('promo_items')
        .insert(newItem);

      if (error) throw error;

      setPromoItems(prev => [newItem, ...prev]);
    } catch (e) {
      console.error("Error adding promo item:", e);
      alert("发布失败");
    }
  };

  const updatePromoItem = async (id: string, updates: { content?: string; images?: string[] }) => {
    try {
      const { error } = await supabase
        .from('promo_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setPromoItems(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (e) {
      console.error("Error updating promo item:", e);
      alert("更新失败");
    }
  };

  const deletePromoItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPromoItems(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error("Error deleting promo item:", e);
      alert("删除失败");
    }
  };

  return (
    <SelectionContext.Provider value={{
      items,
      promoItems,
      addItem,
      updateItem,
      addPromoItem,
      updatePromoItem,
      deleteItem,
      deletePromoItem,
      isLoading
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
import React, { useState } from 'react';
import { Plus, X, Download, Heart } from 'lucide-react';

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string;
  uploadedAt: Date;
  liked: boolean;
}

const Gallery: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Mock gallery data
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([
    {
      id: '1',
      url: 'https://images.pexels.com/photos/1007427/pexels-photo-1007427.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
      caption: 'Our perfect beach day! 🏖️',
      uploadedBy: 'Jordan',
      uploadedAt: new Date('2025-01-15'),
      liked: true
    },
    {
      id: '2',
      url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
      caption: 'Sunset dinner date 🌅',
      uploadedBy: 'Alex',
      uploadedAt: new Date('2025-01-14'),
      liked: false
    },
    {
      id: '3',
      url: 'https://images.pexels.com/photos/1024995/pexels-photo-1024995.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
      caption: 'Coffee shop adventures ☕',
      uploadedBy: 'Jordan',
      uploadedAt: new Date('2025-01-13'),
      liked: true
    },
    {
      id: '4',
      url: 'https://images.pexels.com/photos/1025000/pexels-photo-1025000.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
      caption: 'Hiking together 🥾',
      uploadedBy: 'Alex',
      uploadedAt: new Date('2025-01-12'),
      liked: false
    },
    {
      id: '5',
      url: 'https://images.pexels.com/photos/1025011/pexels-photo-1025011.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
      caption: 'Movie night at home 🎬',
      uploadedBy: 'Jordan',
      uploadedAt: new Date('2025-01-11'),
      liked: true
    },
    {
      id: '6',
      url: 'https://images.pexels.com/photos/1025022/pexels-photo-1025022.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
      caption: 'Cooking together 👨‍🍳',
      uploadedBy: 'Alex',
      uploadedAt: new Date('2025-01-10'),
      liked: false
    }
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        const newItem: GalleryItem = {
          id: Date.now().toString(),
          url: URL.createObjectURL(file),
          caption: 'New memory! 📸',
          uploadedBy: 'You',
          uploadedAt: new Date(),
          liked: false
        };
        setGalleryItems(prev => [newItem, ...prev]);
        setIsUploading(false);
      }, 1000);
    }
  };

  const toggleLike = (id: string) => {
    setGalleryItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, liked: !item.liked } : item
      )
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Our Gallery</h1>
          <label htmlFor="upload-image" className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 cursor-pointer">
            <Plus size={20} />
          </label>
          <input
            id="upload-image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        {galleryItems.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {galleryItems.length} precious memories
          </p>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="p-4">
        {isUploading && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-pink-600 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Uploading...</span>
            </div>
          </div>
        )}

        {galleryItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No photos yet</h3>
            <p className="text-gray-600 mb-4">Start building your gallery together!</p>
            <label htmlFor="upload-image" className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 cursor-pointer">
              Upload First Photo
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedImage(item)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.caption}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-800 line-clamp-2">{item.caption}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{item.uploadedBy}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(item.id);
                      }}
                      className={`p-1 rounded-full ${
                        item.liked ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'
                      }`}
                    >
                      <Heart size={16} fill={item.liked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-800">{selectedImage.uploadedBy}</span>
                <span className="text-sm text-gray-500">{formatDate(selectedImage.uploadedAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleLike(selectedImage.id)}
                  className={`p-2 rounded-full ${
                    selectedImage.liked ? 'text-pink-600' : 'text-gray-400 hover:text-pink-600'
                  }`}
                >
                  <Heart size={20} fill={selectedImage.liked ? 'currentColor' : 'none'} />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800">
                  <Download size={20} />
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.caption}
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
              <p className="text-gray-800 mt-4">{selectedImage.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
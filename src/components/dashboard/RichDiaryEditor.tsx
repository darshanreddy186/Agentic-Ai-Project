import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image as ImageIcon, Sparkles, X, Loader2 } from 'lucide-react';
import { uploadImage } from '../../lib/supabase';
import './ImageGallery.css';
import './RichDiaryEditor.css';

// --- TYPES & INTERFACES ---
interface RichDiaryEditorProps {
  content: string;
  isEditable: boolean;
  onChange: (htmlContent: string) => void;
  onSaveMemory: (memory: { imageUrl: string; context: string; mood: string }) => Promise<void>;
  onDeleteImage: (imageUrl: string) => Promise<void>;
  showNotification: (notification: { message: string; description?: string; type: 'success' | 'error' }) => void;
}

type ImageAttributes = { src: string; alt?: string };

// --- MEMORY MODAL (Handles a queue of images) ---
const useMemoryModal = (onSave: RichDiaryEditorProps['onSaveMemory'], showNotification: RichDiaryEditorProps['showNotification']) => {
  const [imageQueue, setImageQueue] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const open = (urls: string[]) => setImageQueue(urls);

  useEffect(() => {
    if (imageQueue.length > 0 && !currentImage) setCurrentImage(imageQueue[0]);
  }, [imageQueue, currentImage]);

  const processNextImage = () => {
    const nextQueue = imageQueue.slice(1);
    setImageQueue(nextQueue);
    setCurrentImage(nextQueue[0] || null);
    setContext('');
  };

  const handleSave = async () => {
    if (!currentImage || !context.trim()) {
      showNotification({ message: "Please add some context to your memory.", type: "error" });
      return;
    }
    setIsLoading(true);
    await onSave({ imageUrl: currentImage, context, mood: 'Neutral' });
    setIsLoading(false);
    showNotification({ message: "Memory Saved!", type: 'success' });
    processNextImage();
  };

  const ModalComponent = currentImage ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onMouseDown={processNextImage}>
      <div className="relative w-full max-w-lg p-6 bg-white border rounded-lg shadow-lg" onMouseDown={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Create a Memory ({imageQueue.length} left)</h2>
        <div className="py-4 space-y-4">
          <img src={currentImage} alt="Memory preview" className="object-contain w-full rounded-lg max-h-64" />
          <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Your thoughts about this image..." className="w-full p-2 border rounded-md" rows={3} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={processNextImage} className="px-4 py-2 text-sm rounded-md hover:bg-zinc-100">Skip</button>
          <button onClick={handleSave} disabled={isLoading} className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm text-white bg-zinc-900 rounded-md hover:bg-zinc-800 disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Save Memory
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { open, ModalComponent };
};

// --- CUSTOM TIPTAP NODE & REACT COMPONENT FOR THE GALLERY ---
const ImageGalleryComponent = (props: any) => {
  const { node, updateAttributes } = props;
  const { onDeleteImage } = props.editor.options.editorProps;
  const images: ImageAttributes[] = node.attrs.images || [];
  
  const handleDelete = (srcToDelete: string) => {
    onDeleteImage(srcToDelete);
    updateAttributes({ images: images.filter(image => image.src !== srcToDelete) });
  };
  
  return (
    <NodeViewWrapper className="image-gallery-node not-prose">
      {images.length > 0 && (
        <div className={`gallery-grid count-${Math.min(images.length, 5)}`}>
          {images.map((image, index) => (
            <div key={index} className="gallery-item">
              <img src={image.src} alt={image.alt || ''} />
              {props.editor.isEditable && (
                <button className="delete-image-button" onClick={() => handleDelete(image.src)}>
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
};

const ImageGalleryNode = Node.create({
  name: 'imageGallery',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes: () => ({
    images: {
      default: [],
    },
  }),
  parseHTML: () => [{ tag: 'div[data-type="image-gallery"]' }],
  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-gallery' })],
  addNodeView: () => ReactNodeViewRenderer(ImageGalleryComponent),
});

// --- MAIN EDITOR COMPONENT ---
export const RichDiaryEditor = (props: RichDiaryEditorProps) => {
  const { content, isEditable, onChange, onSaveMemory, onDeleteImage, showNotification } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { open: openMemoryModal, ModalComponent } = useMemoryModal(onSaveMemory, showNotification);

  const editor = useEditor({
    extensions: [StarterKit, ImageGalleryNode],
    content,
    editorProps: {
      attributes: { class: 'diary-editor-prose focus:outline-none' },
      onDeleteImage,
    },
    editable: isEditable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor) {
      if (editor.getHTML() !== content) editor.commands.setContent(content, false);
      if (editor.isEditable !== isEditable) editor.setEditable(isEditable);
    }
  }, [content, isEditable, editor]);

  const addImages = useCallback(async (files: FileList) => {
    if (!editor || files.length === 0) return;
    setIsUploading(true);
    showNotification({ message: `Uploading ${files.length} image(s)...`, type: 'success' });
    try {
      const publicUrls = await Promise.all(Array.from(files).map(file => uploadImage(file, 'diary_images')));
      editor.chain().insertContent({ 
        type: 'imageGallery', 
        attrs: { images: publicUrls.map(src => ({ src })) } 
      }).focus('end').run();
      openMemoryModal(publicUrls);
    } catch (error) {
      showNotification({ message: 'Upload failed', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  }, [editor, openMemoryModal, showNotification]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addImages(e.target.files); };

  return (
    <div className="diary-container border border-zinc-200 rounded-lg">
      {isEditable && (
        <div className="diary-toolbar p-2 border-b border-zinc-200">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" multiple />
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-transparent h-9 px-3 hover:bg-zinc-100 disabled:opacity-50">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />} Add Image(s)
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="diary-paper p-4" /> 
      {ModalComponent}
    </div>
  );
};
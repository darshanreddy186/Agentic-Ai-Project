import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Image as ImageIcon, Sparkles, X, Loader2 } from 'lucide-react';
import { uploadImage } from '../../lib/supabase'; // Using our Supabase helper
import './RichDiaryEditor.css'; // The original CSS file is needed for this version

// --- PROPS INTERFACE ---
interface RichDiaryEditorProps {
  content: string;
  isEditable: boolean;
  onChange: (htmlContent: string) => void;
  onSaveMemory: (memory: { imageUrl: string; context: string; mood: string }) => Promise<void>;
  onDeleteImage: (imageUrl: string) => Promise<void>;
  showNotification: (notification: { message: string; description?: string; type: 'success' | 'error' }) => void;
}

// --- MEMORY MODAL HOOK (Original UI, Light Theme) ---
const useMemoryModal = (
  onSave: RichDiaryEditorProps['onSaveMemory'],
  showNotification: RichDiaryEditorProps['showNotification']
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [context, setContext] = useState('');

  const openModal = (url: string) => { setIsOpen(true); setImageUrl(url); };
  const resetAndClose = () => { setIsOpen(false); setImageUrl(''); setContext(''); };

  const handleSave = async () => {
    if (!context.trim()) {
      showNotification({ message: "Please add some context to your memory.", type: "error" });
      return;
    }
    setIsLoading(true);
    await onSave({ imageUrl, context, mood: 'Neutral' });
    setIsLoading(false);
    showNotification({ message: "Memory Saved!", description: "This image has been added to your memories.", type: 'success' });
    resetAndClose();
  };
  
  const ModalComponent = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={resetAndClose}>
      <div className="relative w-full max-w-lg p-6 bg-white border border-zinc-200 rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Create a Memory</h2>
          <p className="text-sm text-zinc-500">Add context to this image. What were you thinking or feeling?</p>
        </div>
        <div className="space-y-4 py-4">
          <img src={imageUrl} alt="Memory preview" className="rounded-lg max-h-64 w-full object-contain" />
          <div>
            <label htmlFor="memory-context" className="block text-sm font-medium text-zinc-700 mb-1">Your thoughts about this image:</label>
            <textarea 
              id="memory-context" 
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., 'Found this cute cat next door, it made my day!'"
              className="w-full p-2 border border-zinc-300 rounded-md bg-transparent focus:ring-2 focus:ring-zinc-500 outline-none"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={resetAndClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 hover:bg-zinc-100">Skip</button>
          <button onClick={handleSave} disabled={isLoading} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 disabled:opacity-50">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Save Memory
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { openModal, ModalComponent };
};


// --- CUSTOM IMAGE NODE COMPONENT (Original UI) ---
const EditableImageComponent = (props: any) => {
  const { node, deleteNode } = props;
  // Get the onDeleteImage function passed down from the editor's props
  const { onDeleteImage } = props.editor.options.editorProps;

  const handleDelete = () => {
    // Call the Supabase delete function with the image URL
    onDeleteImage(node.attrs.src);
    // Remove the node from the editor
    deleteNode();
  };

  return (
    <NodeViewWrapper className="image-node-wrapper">
      <div className="image-wrapper">
        <img {...props.node.attrs} alt="" />
        <button className="delete-image-button" onClick={handleDelete} contentEditable={false}>
          <X size={16} />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

const CustomImageExtension = Image.extend({ addNodeView() { return ReactNodeViewRenderer(EditableImageComponent); } });

// --- MAIN EDITOR COMPONENT ---
export const RichDiaryEditor = ({ content, isEditable, onChange, onSaveMemory, onDeleteImage, showNotification }: RichDiaryEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { openModal, ModalComponent } = useMemoryModal(onSaveMemory, showNotification);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false }), CustomImageExtension],
    content,
    editorProps: {
      attributes: { class: 'diary-editor-prose' },
      // Pass the onDeleteImage function down to the custom image component
      onDeleteImage: onDeleteImage,
    },
    editable: isEditable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) editor.commands.setContent(content, false);
  }, [content, editor]);

  useEffect(() => {
    if (editor && editor.isEditable !== isEditable) editor.setEditable(isEditable);
  }, [isEditable, editor]);

  const addImage = useCallback(async (file: File) => {
    if (!editor) return;
    setIsUploading(true);
    showNotification({ message: 'Uploading image...', type: 'success' });
    try {
      // Use the helper to upload the image to the 'diary_images' bucket
      const publicUrl = await uploadImage(file, 'diary_images');
      // Insert the permanent Supabase URL into the editor
      editor.chain().focus().setImage({ src: publicUrl }).run();
      openModal(publicUrl);
    } catch (error) {
      showNotification({ message: 'Upload failed', description: 'Could not upload image.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  }, [editor, openModal, showNotification]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addImage(file);
      event.target.value = '';
    }
  };

  return (
    <div className="diary-container border border-zinc-200 rounded-lg">
      {isEditable && (
        <div className="diary-toolbar p-2 border-b border-zinc-200">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-transparent h-9 px-3 hover:bg-zinc-100 disabled:opacity-50">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
            Add Image
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="diary-paper p-4" />
      {ModalComponent}
    </div>
  );
};
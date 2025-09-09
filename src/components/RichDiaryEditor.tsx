import React, { useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import './RichDiaryEditor.css';

// --- PROPS INTERFACE ---
interface RichDiaryEditorProps {
  content: string;
  isEditable: boolean;
  onChange: (htmlContent: string) => void;
  onSaveMemory: (memory: { imageUrl: string; context: string; mood: string }) => void;
  onDeleteImage: (imageUrl: string) => void;
}

// --- useMemoryModal Hook ---
const useMemoryModal = (onSave: RichDiaryEditorProps['onSaveMemory']) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [context, setContext] = useState('');
  const { toast } = useToast();
  const openModal = (url: string) => { setImageUrl(url); setIsOpen(true); };
  const resetAndClose = () => { setIsOpen(false); setImageUrl(''); setContext(''); };
  const handleSave = () => {
    if (!context.trim()) {
      toast({ title: "Please add context.", variant: "destructive" });
      return;
    }
    onSave({ imageUrl, context, mood: 'Neutral' });
    toast({ title: "Memory Saved!" });
    resetAndClose();
  };
  const ModalComponent = (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Memory</DialogTitle>
          <DialogDescription>Add context to this image.</DialogDescription>
        {/* FIX: The closing tag is now correctly </DialogHeader> */}
        </DialogHeader>
        <div className="space-y-4 py-4">
          <img src={imageUrl} alt="Memory preview" className="rounded-lg max-h-64 w-full object-contain" />
          <div>
            <Label htmlFor="memory-context">Your thoughts about this image:</Label>
            <Textarea id="memory-context" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g., 'Found this cute cat next door...'" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={resetAndClose}>Skip</Button>
          <Button onClick={handleSave}><Sparkles className="mr-2 h-4 w-4" /> Save Memory</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return { openModal, ModalComponent };
};

// --- CUSTOM REACT COMPONENT FOR THE IMAGE ---
const EditableImageComponent = (props: any) => {
  const { node, deleteNode } = props;
  const { onDeleteImage, isEditable } = props.editor.options.editorProps;

  const handleDelete = () => {
    const imageUrl = node.attrs.src;
    onDeleteImage(imageUrl);
    deleteNode();
  };

  return (
    <NodeViewWrapper className="image-node-wrapper">
      <div className="image-wrapper">
        <img {...props.node.attrs} alt="" />
        {isEditable && (
          <button className="delete-image-button" onClick={handleDelete} contentEditable={false}>
            <X size={16} />
          </button>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// --- CUSTOM TIPTAP EXTENSION ---
const CustomImageExtension = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EditableImageComponent);
  },
});

// --- MAIN EDITOR COMPONENT ---
export const RichDiaryEditor = ({ content, isEditable, onChange, onSaveMemory, onDeleteImage }: RichDiaryEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openModal, ModalComponent } = useMemoryModal(onSaveMemory);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, blockquote: false, codeBlock: false }),
      CustomImageExtension,
    ],
    content: content,
    editorProps: {
      attributes: { class: 'diary-editor-prose' },
      onDeleteImage: onDeleteImage,
      isEditable: isEditable,
    },
    editable: isEditable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (editor && editor.isEditable !== isEditable) {
      editor.setEditable(isEditable);
      editor.setOptions({
        editorProps: {
            attributes: { class: 'diary-editor-prose' },
            onDeleteImage: onDeleteImage,
            isEditable: isEditable,
        }
      })
    }
  }, [isEditable, editor, onDeleteImage]);

  const addImage = useCallback((file: File) => {
    if (file && editor) {
      const url = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: url }).run();
      openModal(url);
    }
  }, [editor, openModal]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addImage(file);
      event.target.value = '';
    }
  };

  return (
    <div className="diary-container">
      {isEditable && (
        <div className="diary-toolbar">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="mr-2 h-4 w-4" /> Add Image
          </Button>
        </div>
      )}
      <EditorContent editor={editor} className="diary-paper" />
      {ModalComponent}
    </div>
  );
};
/*
IMPORTANT:
Follow docs/DESIGN_SYSTEM.md for ALL UI changes.
Do NOT introduce new styles or patterns.
Reuse existing components and design language.
*/

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
	Bold,
	Italic,
	Strikethrough,
	List,
	ListOrdered,
	Heading1,
	Heading2,
} from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
	if (!editor) {
		return null;
	}

	return (
		<div className="border-b border-border p-2 flex gap-1 flex-wrap bg-muted/50 rounded-t-md">
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleBold().run()}
				className={`p-1.5 rounded hover:bg-muted transition-colors ${
					editor.isActive('bold')
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground'
				}`}
				title="Bold"
			>
				<Bold size={16} />
			</button>
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleItalic().run()}
				className={`p-1.5 rounded hover:bg-muted transition-colors ${
					editor.isActive('italic')
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground'
				}`}
				title="Italic"
			>
				<Italic size={16} />
			</button>
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleStrike().run()}
				className={`p-1.5 rounded hover:bg-muted transition-colors ${
					editor.isActive('strike')
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground'
				}`}
				title="Strikethrough"
			>
				<Strikethrough size={16} />
			</button>

			<div className="w-px h-6 bg-border mx-1 self-center" />

			<button
				type="button"
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				className={`p-1.5 rounded hover:bg-muted transition-colors ${
					editor.isActive('heading', { level: 1 })
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground'
				}`}
				title="Heading 1"
			>
				<Heading1 size={16} />
			</button>
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				className={`p-1.5 rounded hover:bg-muted transition-colors ${
					editor.isActive('heading', { level: 2 })
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground'
				}`}
				title="Heading 2"
			>
				<Heading2 size={16} />
			</button>

			<div className="w-px h-6 bg-border mx-1 self-center" />

			<button
				type="button"
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				className={`p-1.5 rounded hover:bg-muted transition-colors ${
					editor.isActive('bulletList')
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground'
				}`}
				title="Bullet List"
			>
				<List size={16} />
			</button>
			<button
				type="button"
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				className={`p-1.5 rounded hover:bg-muted transition-colors ${
					editor.isActive('orderedList')
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground'
				}`}
				title="Ordered List"
			>
				<ListOrdered size={16} />
			</button>
		</div>
	);
};

export const RichTextEditor = ({
	value,
	onChange,
	placeholder,
}: RichTextEditorProps) => {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Placeholder.configure({
				placeholder: placeholder || 'Write something...',
			}),
		],
		content: value,
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class:
					'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[120px] p-3 text-foreground',
			},
		},
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
	});

	// Handle external value changes (e.g. when editing a different item)
	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value);
		}
	}, [value, editor]);

	return (
		<div className="border border-border rounded-md overflow-hidden bg-card text-foreground">
			<MenuBar editor={editor} />
			<div className="editor-content-wrapper">
				<EditorContent editor={editor} />
			</div>
			{/* Add some basic styles for the tiptap placeholder and content */}
			<style jsx global>{`
				.editor-content-wrapper
					.ProseMirror
					p.is-editor-empty:first-child::before {
					content: attr(data-placeholder);
					float: left;
					color: #adb5bd;
					pointer-events: none;
					height: 0;
				}
				.editor-content-wrapper .ProseMirror ul {
					list-style-type: disc;
					padding-left: 1.5rem;
					margin-top: 0.5rem;
					margin-bottom: 0.5rem;
				}
				.editor-content-wrapper .ProseMirror ol {
					list-style-type: decimal;
					padding-left: 1.5rem;
					margin-top: 0.5rem;
					margin-bottom: 0.5rem;
				}
				.editor-content-wrapper .ProseMirror h1 {
					font-size: 1.5rem;
					font-weight: bold;
					margin-top: 1rem;
					margin-bottom: 0.5rem;
				}
				.editor-content-wrapper .ProseMirror h2 {
					font-size: 1.25rem;
					font-weight: bold;
					margin-top: 1rem;
					margin-bottom: 0.5rem;
				}
			`}</style>
		</div>
	);
};

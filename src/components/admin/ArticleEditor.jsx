"use client";

import React, { useRef, useState } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ImageIcon,
  Link as LinkIcon,
  RotateCcw,
  RotateCw,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Image as OriginalImageIcon,
  Trash2,
  GripVertical,
  Sliders,
} from "lucide-react";
import { uploadImageFile } from "@/lib/uploadUtil";
import ResizableImageNodeView from "@/components/admin/ResizableImageNodeView";

// Custom Tiptap Image extension with size, align, orientation, width, and ResizableNodeView
const CustomImage = ImageExtension.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "420px",
        parseHTML: (element) => element.getAttribute("width") || element.style.width || "420px",
        renderHTML: (attributes) => ({
          width: attributes.width || "420px",
          style: `width: ${attributes.width || "420px"}; max-width: 100%;`,
          class: `article-img size-${attributes.size || "medium"} align-${attributes.align || "center"} shape-${attributes.orientation || "natural"}`,
        }),
      },
      size: {
        default: "medium",
        parseHTML: (element) => element.getAttribute("data-size") || "medium",
        renderHTML: (attributes) => ({
          "data-size": attributes.size,
          class: `article-img size-${attributes.size || "medium"} align-${attributes.align || "center"} shape-${attributes.orientation || "natural"}`,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": attributes.align,
          class: `article-img size-${attributes.size || "medium"} align-${attributes.align || "center"} shape-${attributes.orientation || "natural"}`,
        }),
      },
      orientation: {
        default: "natural",
        parseHTML: (element) => element.getAttribute("data-orientation") || "natural",
        renderHTML: (attributes) => ({
          "data-orientation": attributes.orientation || "natural",
          class: `article-img size-${attributes.size || "medium"} align-${attributes.align || "center"} shape-${attributes.orientation || "natural"}`,
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});

export default function ArticleEditor({ value, onChange }) {
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [attrTick, setAttrTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[var(--iris)] font-bold underline hover:opacity-80 transition-opacity",
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setAttrTick((t) => t + 1);
    },
    onSelectionUpdate: () => {
      setAttrTick((t) => t + 1);
    },
    onTransaction: () => {
      setAttrTick((t) => t + 1);
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[350px] p-5 sm:p-6 focus:outline-none bg-white text-slate-800 text-base leading-relaxed font-sans",
      },
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[360px] border border-slate-200 rounded-2xl p-6 bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--iris)]" />
      </div>
    );
  }

  const handleImageInsertClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageFile(file);
      if (imageUrl && editor) {
        // Insert image with clean default width='420px', size='medium', align='center', orientation='natural'
        editor
          .chain()
          .focus()
          .setImage({ src: imageUrl, width: "420px", size: "medium", align: "center", orientation: "natural" })
          .run();
        setAttrTick((t) => t + 1);
      }
    } catch (err) {
      console.error("Error inserting image into article body:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter link URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const isSelectedNodeImage = editor.state.selection?.node?.type?.name === "image";
  const isImageActive = editor.isActive("image") || isSelectedNodeImage;
  const currentImageAttrs = isSelectedNodeImage
    ? editor.state.selection.node.attrs
    : editor.getAttributes("image") || {};

  const activeOrientation = currentImageAttrs.orientation || "natural";
  const activeSize = currentImageAttrs.size || "medium";
  const activeAlign = currentImageAttrs.align || "center";

  const setImageSize = (size) => {
    let widthVal = "420px";
    if (size === "small") widthVal = "280px";
    if (size === "medium") widthVal = "420px";
    if (size === "large") widthVal = "600px";
    if (size === "full") widthVal = "100%";

    if (isSelectedNodeImage) {
      const pos = editor.state.selection.from;
      editor.chain().focus().setNodeSelection(pos).updateAttributes("image", { size, width: widthVal }).run();
    } else {
      editor.chain().focus().updateAttributes("image", { size, width: widthVal }).run();
    }
    setAttrTick((t) => t + 1);
  };

  const setImageAlign = (align) => {
    if (isSelectedNodeImage) {
      const pos = editor.state.selection.from;
      editor.chain().focus().setNodeSelection(pos).updateAttributes("image", { align }).run();
    } else {
      editor.chain().focus().updateAttributes("image", { align }).run();
    }
    setAttrTick((t) => t + 1);
  };

  const setImageOrientation = (orientation) => {
    if (isSelectedNodeImage) {
      const pos = editor.state.selection.from;
      editor.chain().focus().setNodeSelection(pos).updateAttributes("image", { orientation }).run();
    } else {
      editor.chain().focus().updateAttributes("image", { orientation }).run();
    }
    setAttrTick((t) => t + 1);
  };

  const deleteSelectedImage = () => {
    if (editor) {
      editor.chain().focus().deleteSelection().run();
      setAttrTick((t) => t + 1);
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white space-y-0 relative">
      {/* Editor CSS styles for lists, image sizing, selection ring, orientation and alignment */}
      <style jsx global>{`
        .tiptap-content ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
        }
        .tiptap-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
        }
        .tiptap-content li {
          margin-top: 0.35rem !important;
          margin-bottom: 0.35rem !important;
          line-height: 1.6 !important;
        }
        .tiptap-content h2 {
          font-size: 1.5rem !important;
          font-weight: 800 !important;
          color: #1e1433 !important;
          margin-top: 1.75rem !important;
          margin-bottom: 0.75rem !important;
        }
        .tiptap-content h3 {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #2b1f1a !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
        }

        /* Base Article Image Style & Side-by-Side Horizontal Formatting */
        .tiptap-content img.article-img,
        .article-img {
          display: inline-block !important;
          border-radius: 1rem;
          margin: 0.5rem 0.5rem 0.5rem 0;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          vertical-align: middle;
        }

        /* Alignment Rules */
        .tiptap-content .align-center,
        .align-center {
          display: block !important;
          margin-left: auto !important;
          margin-right: auto !important;
          clear: both !important;
        }
        .tiptap-content .align-left,
        .align-left {
          float: left !important;
          margin-right: 1.5rem !important;
          margin-bottom: 1rem !important;
        }
        .tiptap-content .align-right,
        .align-right {
          float: right !important;
          margin-left: 1.5rem !important;
          margin-bottom: 1rem !important;
        }

        /* Orientation / Aspect Ratio Rules (Horizontal vs Vertical) */
        .tiptap-content img.shape-horizontal,
        .shape-horizontal {
          aspect-ratio: 16 / 9 !important;
          object-fit: cover !important;
          max-height: 400px !important;
        }
        .tiptap-content img.shape-vertical,
        .shape-vertical {
          aspect-ratio: 3 / 4 !important;
          object-fit: cover !important;
          max-height: 480px !important;
        }
        .tiptap-content img.shape-square,
        .shape-square {
          aspect-ratio: 1 / 1 !important;
          object-fit: cover !important;
          max-height: 380px !important;
        }
        .tiptap-content img.shape-natural,
        .shape-natural {
          aspect-ratio: auto !important;
          height: auto !important;
          object-fit: contain !important;
        }
      `}</style>

      {/* Hidden File Input for Mid-Article Inline Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Editor Main Text Formatting Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-3 flex flex-wrap items-center gap-1.5 sm:gap-2 select-none">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            editor.isActive("bold")
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            editor.isActive("italic")
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            editor.isActive("underline")
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            editor.isActive("heading", { level: 2 })
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Heading 2 (H2)"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            editor.isActive("heading", { level: 3 })
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Heading 3 (H3)"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            editor.isActive("bulletList")
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Bullet Points"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            editor.isActive("orderedList")
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Insert Inline Image at Cursor Position */}
        <button
          type="button"
          disabled={uploadingImage}
          onClick={handleImageInsertClick}
          className="px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          title="Insert Image mid-article at cursor position"
        >
          {uploadingImage ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 text-teal-600" />
              <span>Insert Mid-Article Image</span>
            </>
          )}
        </button>

        {/* Add Link */}
        <button
          type="button"
          onClick={addLink}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            editor.isActive("link")
              ? "bg-[var(--ink)] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Add Web Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          title="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          title="Redo"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* CONTINUOUS & PERMANENT Image Formatting Control Bar */}
      <div className="bg-slate-900 text-white p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold border-b border-slate-700 shadow-md">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-400" />
          <span className="text-slate-200 font-extrabold">Image Layout & Settings:</span>
          {isImageActive ? (
            <span className="bg-teal-500/20 text-teal-300 text-[10px] px-2 py-0.5 rounded-md font-mono border border-teal-500/40">
              Active Image Selected
            </span>
          ) : (
            <span className="text-slate-400 text-[11px] font-normal italic">
              (Click an image to format it)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Format / Aspect Ratio Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[10px] uppercase text-slate-400 px-2 font-mono">Format:</span>
            <button
              type="button"
              onClick={() => setImageOrientation("horizontal")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                activeOrientation === "horizontal"
                  ? "bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Horizontal Wide Banner (16:9)"
            >
              <RectangleHorizontal className="w-3.5 h-3.5" />
              <span>Horizontal</span>
            </button>

            <button
              type="button"
              onClick={() => setImageOrientation("vertical")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                activeOrientation === "vertical"
                  ? "bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Vertical Portrait (3:4)"
            >
              <RectangleVertical className="w-3.5 h-3.5" />
              <span>Vertical</span>
            </button>

            <button
              type="button"
              onClick={() => setImageOrientation("square")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                activeOrientation === "square"
                  ? "bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Square (1:1)"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Square</span>
            </button>

            <button
              type="button"
              onClick={() => setImageOrientation("natural")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                activeOrientation === "natural"
                  ? "bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Original Natural Ratio"
            >
              <OriginalImageIcon className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>
          </div>

          {/* Size Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[10px] uppercase text-slate-400 px-2 font-mono">Size:</span>
            {[
              { label: "Small (33%)", value: "small" },
              { label: "Medium (50%)", value: "medium" },
              { label: "Large (75%)", value: "large" },
              { label: "Full (100%)", value: "full" },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setImageSize(s.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  activeSize === s.value
                    ? "bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Align Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[10px] uppercase text-slate-400 px-2 font-mono">Align:</span>
            <button
              type="button"
              onClick={() => setImageAlign("left")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                activeAlign === "left"
                  ? "bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Align Left (Text wraps around)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setImageAlign("center")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                activeAlign === "center"
                  ? "bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setImageAlign("right")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                activeAlign === "right"
                  ? "bg-rose-600 text-white font-black shadow-md ring-2 ring-rose-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Align Right (Text wraps around)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Delete Image Button */}
          {isImageActive && (
            <button
              type="button"
              onClick={deleteSelectedImage}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-rose-500 ml-1"
              title="Delete Selected Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Image</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}

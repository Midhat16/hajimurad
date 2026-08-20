"use client";

import React, { useRef, useState, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { X, GripVertical } from "lucide-react";

export default function ResizableImageNodeView(props) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const imageRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startWidth, setStartWidth] = useState(0);
  const [startX, setStartX] = useState(0);

  const src = node.attrs.src;
  const width = node.attrs.width || "420px";
  const size = node.attrs.size || "medium";
  const align = node.attrs.align || "center";
  const orientation = node.attrs.orientation || "natural";

  // Handle Drag-to-Resize Start
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (imageRef.current) {
      setStartWidth(imageRef.current.offsetWidth);
      setStartX(e.clientX);
      setIsResizing(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const currentX = e.clientX;
      const diffX = currentX - startX;
      const newWidth = Math.max(120, Math.min(800, startWidth + diffX));
      updateAttributes({ width: `${newWidth}px` });
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, startX, startWidth, updateAttributes]);

  // Wrapper alignment classes
  let alignmentClass = "mx-auto block text-center";
  if (align === "left") alignmentClass = "float-left mr-4 mb-2";
  if (align === "right") alignmentClass = "float-right ml-4 mb-2";

  return (
    <NodeViewWrapper
      className={`relative inline-block my-3 select-none transition-all ${alignmentClass}`}
      style={{
        width: width,
        maxWidth: "100%",
      }}
    >
      <div className="relative group inline-block w-full h-full">
        {/* Top-Right Corner 'X' Delete Button */}
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
            className="absolute -top-3 -right-3 w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white z-30 cursor-pointer transition-transform hover:scale-110"
            title="Delete Image"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        )}

        {/* Image Display */}
        <img
          ref={imageRef}
          src={src}
          alt="Article Image"
          style={{ width: "100%", height: "auto" }}
          onClick={(e) => {
            if (props.selectNode) {
              props.selectNode();
            }
          }}
          className={`rounded-2xl border border-slate-200 shadow-sm block transition-all object-cover cursor-pointer ${
            selected ? "ring-4 ring-teal-400 ring-offset-2 shadow-xl" : ""
          } shape-${orientation}`}
        />

        {/* Bottom-Right Corner Drag-to-Resize Handle */}
        {selected && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full border-2 border-white shadow-xl z-30 cursor-nwse-resize flex items-center justify-center transition-transform hover:scale-125"
            title="Drag corner to resize image"
          >
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

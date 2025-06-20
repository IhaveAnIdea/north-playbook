'use client';

import React, { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your response...",
  maxLength,
  disabled = false,
  className = "",
  id
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [currentLength, setCurrentLength] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorChange = (content: string) => {
    // Create a temporary div to extract text content for length validation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textLength = tempDiv.textContent?.trim().length || 0;
    
    // Check max length constraint
    if (maxLength && textLength > maxLength) {
      return; // Don't update if over limit
    }
    
    setCurrentLength(textLength);
    onChange(content);
  };

  // Calculate current text length for display
  useEffect(() => {
    if (mounted && value) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = value;
      const textLength = tempDiv.textContent?.trim().length || 0;
      setCurrentLength(textLength);
    }
  }, [value, mounted]);

  if (!mounted) {
    return <div className="h-32 bg-gray-100 rounded border animate-pulse" />;
  }

  return (
    <div className={`rich-text-editor-container ${className}`}>
      <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <Editor
          id={id}
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"}
          value={value}
          onEditorChange={handleEditorChange}
          disabled={disabled}
          init={{
            height: 300,
            menubar: false,
            branding: false,
            resize: true,
            placeholder: placeholder,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: `
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                font-size: 14px; 
                line-height: 1.6;
                color: #374151;
              }
              p { margin-bottom: 1em; }
              h1, h2, h3, h4, h5, h6 { 
                margin-top: 1.5em; 
                margin-bottom: 0.5em; 
                font-weight: 600; 
              }
              ul, ol { margin-bottom: 1em; }
              blockquote { 
                border-left: 4px solid #e5e7eb; 
                padding-left: 1em; 
                margin: 1em 0; 
                font-style: italic; 
                color: #6b7280; 
              }
            `,
            setup: (editor) => {
              editor.on('init', () => {
                // Apply custom styles to match the app's design
                const editorBody = editor.getBody();
                if (editorBody) {
                  editorBody.style.backgroundColor = 'transparent';
                }
              });
            },
            skin: 'oxide',
            content_css: 'default',
            directionality: 'ltr',
            language: 'en',
            statusbar: false,
            elementpath: false,
            convert_urls: false,
            relative_urls: false,
            remove_script_host: false,
            paste_data_images: true,
            paste_as_text: false,
            paste_webkit_styles: 'none',
            paste_retain_style_properties: 'color font-size font-family font-weight font-style text-decoration text-align',
          }}
        />
      </div>
      
      {/* Character counter */}
      {maxLength && (
        <div className="flex justify-end mt-1">
          <span className={`text-sm ${
            currentLength > maxLength * 0.9 
              ? 'text-red-600' 
              : currentLength > maxLength * 0.7 
                ? 'text-yellow-600' 
                : 'text-gray-500'
          }`}>
            {currentLength}/{maxLength} characters
          </span>
        </div>
      )}
      
      <style jsx global>{`
        .rich-text-editor-container .tox .tox-editor-header {
          border-bottom: 1px solid #e5e7eb;
          border-top: none;
          border-left: none;
          border-right: none;
          border-radius: 0.375rem 0.375rem 0 0;
        }
        
        .rich-text-editor-container .tox .tox-edit-area {
          border: none;
        }
        
        .rich-text-editor-container .tox-tinymce {
          border: none !important;
          border-radius: 0.375rem;
        }
        
        .rich-text-editor-container .tox .tox-edit-area__iframe {
          border-radius: 0 0 0.375rem 0.375rem;
        }
        
        .rich-text-editor-container .tox .tox-toolbar__primary {
          background: #f9fafb;
        }
        
        .rich-text-editor-container .tox .tox-toolbar__group {
          border: none;
        }
        
        .rich-text-editor-container .tox .tox-tbtn {
          border-radius: 0.25rem;
          margin: 1px;
        }
        
        .rich-text-editor-container .tox .tox-tbtn:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }
        
        .rich-text-editor-container .tox .tox-tbtn--enabled {
          background: #dbeafe;
          border-color: #93c5fd;
          color: #1e40af;
        }
      `}</style>
    </div>
  );
} 
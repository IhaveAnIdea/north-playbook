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
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'table link image | removeformat | help',
            table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
            table_appearance_options: true,
            table_grid: true,
            table_resize_bars: true,
            table_style_by_css: false,
            table_default_attributes: {
              'class': 'table-auto border-collapse border border-gray-300',
            },
            table_default_styles: {
              'border-collapse': 'collapse',
              'width': '100%',
            },
            table_class_list: [
              {title: 'Default', value: 'table-auto border-collapse border border-gray-300'},
              {title: 'Bordered', value: 'table-auto border-collapse border-2 border-gray-400'},
              {title: 'Striped', value: 'table-auto border-collapse border border-gray-300 table-striped'},
              {title: 'Compact', value: 'table-auto border-collapse border border-gray-300 table-compact'},
            ],
            // Image configuration
            image_advtab: true,
            image_uploadtab: true,
            image_caption: true,
            image_description: false,
            image_dimensions: true,
            image_title: true,
            image_class_list: [
              {title: 'None', value: ''},
              {title: 'Responsive', value: 'img-responsive'},
              {title: 'Float Left', value: 'img-float-left'},
              {title: 'Float Right', value: 'img-float-right'},
              {title: 'Center', value: 'img-center'},
              {title: 'Small', value: 'img-small'},
              {title: 'Medium', value: 'img-medium'},
              {title: 'Large', value: 'img-large'},
            ],
            automatic_uploads: true,
            file_picker_types: 'image',
            file_picker_callback: (callback, value, meta) => {
              if (meta.filetype === 'image') {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                
                input.onchange = function() {
                  const file = (this as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = function() {
                      const base64 = reader.result as string;
                      callback(base64, {
                        alt: file.name,
                        title: file.name,
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                };
                
                input.click();
              }
            },
            images_upload_handler: (blobInfo) => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function() {
                  const base64 = reader.result as string;
                  resolve(base64);
                };
                reader.onerror = function() {
                  reject('Error reading file');
                };
                reader.readAsDataURL(blobInfo.blob());
              });
            },
            content_style: `
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                font-size: 14px; 
                line-height: 1.7;
                color: #374151;
                padding: 12px;
              }
              p { 
                margin-bottom: 1.25em; 
                margin-top: 0;
                line-height: 1.7;
              }
              p:last-child { 
                margin-bottom: 0; 
              }
              h1, h2, h3, h4, h5, h6 { 
                margin-top: 1.75em; 
                margin-bottom: 0.75em; 
                font-weight: 600; 
                line-height: 1.4;
              }
              h1:first-child, h2:first-child, h3:first-child, 
              h4:first-child, h5:first-child, h6:first-child { 
                margin-top: 0; 
              }
              ul, ol { 
                margin-bottom: 1.25em; 
                margin-top: 0;
                padding-left: 1.5em;
              }
              li { 
                margin-bottom: 0.5em; 
                line-height: 1.6;
              }
              li:last-child { 
                margin-bottom: 0; 
              }
              blockquote { 
                border-left: 4px solid #e5e7eb; 
                padding-left: 1.25em; 
                margin: 1.5em 0; 
                font-style: italic; 
                color: #6b7280; 
                line-height: 1.7;
              }
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 1em 0; 
                font-size: 0.875rem;
              }
              table.table-auto { 
                table-layout: auto; 
              }
              table.table-striped tbody tr:nth-child(even) { 
                background-color: #f9fafb; 
              }
              table.table-compact td, table.table-compact th { 
                padding: 0.25rem 0.5rem; 
              }
              th { 
                background-color: #f3f4f6; 
                font-weight: 600; 
                text-align: left; 
                padding: 0.5rem; 
                border: 1px solid #d1d5db; 
              }
              td { 
                padding: 0.5rem; 
                border: 1px solid #d1d5db; 
                vertical-align: top; 
              }
              td:hover, th:hover { 
                background-color: #f0f9ff; 
              }
              table caption { 
                caption-side: top; 
                font-weight: 600; 
                color: #374151; 
                margin-bottom: 0.5rem; 
              }
              /* Image styles with text wrapping */
              img {
                max-width: 100%;
                height: auto;
                border-radius: 0.375rem;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
              }
              .img-responsive {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1rem auto;
              }
              .img-float-left {
                float: left;
                margin: 0 1rem 1rem 0;
                max-width: 50%;
              }
              .img-float-right {
                float: right;
                margin: 0 0 1rem 1rem;
                max-width: 50%;
              }
              .img-center {
                display: block;
                margin: 1rem auto;
                text-align: center;
              }
              .img-small {
                max-width: 200px;
                width: auto;
              }
              .img-medium {
                max-width: 400px;
                width: auto;
              }
              .img-large {
                max-width: 600px;
                width: auto;
              }
              /* Clear floats after images */
              .mce-content-body::after {
                content: "";
                display: table;
                clear: both;
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

        /* Improved spacing for rendered rich text content */
        .rich-text-content p {
          margin-bottom: 1.25em;
          margin-top: 0;
          line-height: 1.7;
        }
        
        .rich-text-content p:last-child {
          margin-bottom: 0;
        }
        
        .rich-text-content h1, 
        .rich-text-content h2, 
        .rich-text-content h3, 
        .rich-text-content h4, 
        .rich-text-content h5, 
        .rich-text-content h6 {
          margin-top: 1.75em;
          margin-bottom: 0.75em;
          line-height: 1.4;
        }
        
        .rich-text-content h1:first-child,
        .rich-text-content h2:first-child,
        .rich-text-content h3:first-child,
        .rich-text-content h4:first-child,
        .rich-text-content h5:first-child,
        .rich-text-content h6:first-child {
          margin-top: 0;
        }
        
        .rich-text-content ul,
        .rich-text-content ol {
          margin-bottom: 1.25em;
          margin-top: 0;
          padding-left: 1.5em;
        }
        
        .rich-text-content li {
          margin-bottom: 0.5em;
          line-height: 1.6;
        }
        
        .rich-text-content li:last-child {
          margin-bottom: 0;
        }
        
        .rich-text-content blockquote {
          margin: 1.5em 0;
          padding-left: 1.25em;
          line-height: 1.7;
        }

        /* Table styles for rendered content */
        .rich-text-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          font-size: 0.875rem;
          overflow-x: auto;
          display: block;
          white-space: nowrap;
        }

        @media (min-width: 640px) {
          .rich-text-content table {
            display: table;
            white-space: normal;
          }
        }

        .rich-text-content table.table-auto {
          table-layout: auto;
        }

        .rich-text-content table.table-striped tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .rich-text-content table.table-compact td,
        .rich-text-content table.table-compact th {
          padding: 0.25rem 0.5rem;
        }

        .rich-text-content th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: left;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .rich-text-content td {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          vertical-align: top;
          min-width: 0;
          word-wrap: break-word;
        }

        .rich-text-content td:hover,
        .rich-text-content th:hover {
          background-color: #f0f9ff;
        }

        .rich-text-content table caption {
          caption-side: top;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          text-align: left;
        }

        /* Responsive table wrapper */
        .rich-text-content .table-wrapper {
          overflow-x: auto;
          margin: 1rem 0;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .rich-text-content .table-wrapper table {
          margin: 0;
          border: none;
        }

        /* Table toolbar styles */
        .rich-text-editor-container .tox .tox-toolbar--scrolling {
          flex-wrap: wrap;
        }

        .rich-text-editor-container .tox .tox-collection--table td {
          border: 1px solid #e5e7eb;
        }

        .rich-text-editor-container .tox .tox-collection--table td:hover {
          background-color: #dbeafe;
          border-color: #93c5fd;
        }
      `}</style>
    </div>
  );
} 
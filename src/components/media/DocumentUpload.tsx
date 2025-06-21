'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
} from '@mui/icons-material';
import { storageService } from '@/lib/storage-service';
import DocumentThumbnailWrapper from './DocumentThumbnailWrapper';
import { DocumentData } from './DocumentThumbnail';

interface DocumentUploadProps {
  documents?: DocumentData[];
  onDocumentsChange: (documents: DocumentData[]) => void;
  exerciseId?: string;
  exerciseTitle?: string;
  category?: string;
  maxDocuments?: number;
  maxSizePerDocument?: number; // in MB
}

export default function DocumentUpload({
  documents = [],
  onDocumentsChange,
  exerciseId,
  exerciseTitle,
  category,
  maxDocuments = 5,
  maxSizePerDocument = 10
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return `File type not supported. Please upload PDF, Word, or text documents.`;
    }

    if (file.size > maxSizePerDocument * 1024 * 1024) {
      return `File size must be less than ${maxSizePerDocument}MB`;
    }

    if (documents.length >= maxDocuments) {
      return `Maximum ${maxDocuments} documents allowed`;
    }

    return null;
  };

  const handleFileUpload = async (files: FileList) => {
    setError(null);
    setUploading(true);

    const fileArray = Array.from(files);
    const newDocuments: DocumentData[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      try {
        const uploadOptions = {
          exerciseId,
          exerciseTitle,
          category,
          responseType: 'text' as const,
          tags: ['document']
        };

        const result = await storageService.uploadPlaybookAsset(file, uploadOptions);

        // Save metadata to database
        try {
          await fetch('/api/media/save-asset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: result.key,
              s3Bucket: 'north-playbook',
              fileName: file.name,
              fileType: 'document',
              fileSize: file.size,
              mimeType: file.type,
              category: category || 'document',
              description: `Document: ${file.name}`,
              exerciseId,
              tags: ['document']
            }),
          });
        } catch (metadataError) {
          console.warn('Failed to save asset metadata:', metadataError);
        }

        newDocuments.push({
          id: result.key,
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type,
          s3Key: result.key,
          metadata: result.metadata as unknown as Record<string, unknown>
        });
      } catch (err) {
        errors.push(`Failed to upload ${file.name}: ${err}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newDocuments.length > 0) {
      onDocumentsChange([...documents, ...newDocuments]);
    }

    setUploading(false);
  };

  const handleRemoveDocument = (documentId: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== documentId));
  };

  return (
    <Box>
      {/* Upload Area */}
      <Card sx={{ p: 3, mb: 2, border: '2px dashed', borderColor: 'grey.300' }}>
        <Stack spacing={2} alignItems="center">
          <CloudUpload sx={{ fontSize: 48, color: 'grey.400' }} />
          <Typography variant="h6">Upload Documents</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Upload PDF, Word documents, or text files
          </Typography>

          <Button
            variant="contained"
            component="label"
            disabled={uploading || documents.length >= maxDocuments}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {uploading ? 'Uploading...' : 'Choose Documents'}
            <input
              type="file"
              hidden
              multiple
              accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </Button>

          <Typography variant="caption" color="text.secondary">
            Maximum {maxDocuments} documents, {maxSizePerDocument}MB each
          </Typography>
        </Stack>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
            {error}
          </pre>
        </Alert>
      )}

      {/* Documents Display */}
      {documents.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Uploaded Documents ({documents.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {documents.map((document) => (
              <DocumentThumbnailWrapper
                key={document.id}
                document={document}
                showDownload={true}
                showRemove={true}
                onRemove={handleRemoveDocument}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
} 
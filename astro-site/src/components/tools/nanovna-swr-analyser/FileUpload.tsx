import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileLoad: (content: string, filename: string) => void;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileLoad,
  accept = '.s1p,.s2p',
}) => {
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileLoad(content, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoad]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files[0];
      if (!file) return;

      // Check file extension
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension !== 's1p' && extension !== 's2p') {
        alert('Please upload an S1P or S2P file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileLoad(content, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoad]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleLoadExample = useCallback(async () => {
    try {
      const response = await fetch('/samples/venture-12-10-2025.s1p');
      if (!response.ok) {
        throw new Error('Failed to load example file');
      }
      const content = await response.text();
      onFileLoad(content, 'venture-12-10-2025.s1p');
    } catch (error) {
      console.error('Error loading example file:', error);
      alert('Failed to load example file. Please try uploading your own file.');
    }
  }, [onFileLoad]);

  return (
    <Card
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer"
    >
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4 text-muted-foreground"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <h3 className="text-lg font-semibold mb-2">
          Upload S-Parameter File
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop your .s1p or .s2p file here, or click to browse
        </p>
        <div className="flex gap-2">
          <label>
            <Button asChild>
              <span>
                Select File
                <input
                  type="file"
                  accept={accept}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </span>
            </Button>
          </label>
          <Button onClick={handleLoadExample} variant="outline">
            Load Example
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Supported formats: S1P, S2P (Touchstone)
        </p>
      </CardContent>
    </Card>
  );
};
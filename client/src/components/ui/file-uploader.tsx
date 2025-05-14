import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploaderProps {
  onFileUploaded?: (fileUrl: string) => void;
  entityType?: string;
  entityId?: number;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUploaded,
  entityType = 'event',
  entityId,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = "Upload Image",
  className = "",
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  }, []);

  const validateFile = (selectedFile: File): boolean => {
    // Validate file type
    if (!accept.includes('*')) {
      const fileType = selectedFile.type;
      const acceptTypes = accept.split(',').map(type => type.trim());
      const isValidType = acceptTypes.some(type => {
        if (type.includes('*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(category);
        }
        return type === fileType;
      });

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `Please upload a file of type: ${accept}`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB} MB`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelection = (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;
    
    setFile(selectedFile);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
    
    // Reset states
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleFileSelection(selectedFile);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Add entity information if provided
      if (entityType) {
        formData.append('relatedEntityType', entityType);
      }
      
      if (entityId) {
        formData.append('relatedEntityId', entityId.toString());
      }
      
      // Get the user ID from localStorage (if available)
      const userId = localStorage.getItem('userId');
      
      // Define headers with user ID for authentication
      const headers: Record<string, string> = {};
      if (userId) {
        headers['user-id'] = userId;
      }
      
      // Create a custom XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadSuccess(true);
            setUploading(false);
            
            if (onFileUploaded && response.file && response.file.url) {
              onFileUploaded(response.file.url);
            }
            
            toast({
              title: "Upload Complete",
              description: "File uploaded successfully!",
            });
          } catch (error) {
            console.error('Error parsing response:', error);
            setUploading(false);
            toast({
              title: "Upload Error",
              description: "Could not process server response",
              variant: "destructive"
            });
          }
        } else {
          setUploading(false);
          let errorMessage = "Upload failed";
          
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.message) {
              errorMessage = response.message;
            }
          } catch (e) {
            // If we can't parse the response, just use the default message
          }
          
          toast({
            title: "Upload Failed",
            description: errorMessage,
            variant: "destructive"
          });
        }
      });
      
      xhr.addEventListener('error', () => {
        setUploading(false);
        toast({
          title: "Upload Failed",
          description: "Network error occurred",
          variant: "destructive"
        });
      });
      
      xhr.addEventListener('abort', () => {
        setUploading(false);
        toast({
          title: "Upload Cancelled",
          description: "The upload was cancelled",
        });
      });
      
      // Open and send the request
      xhr.open('POST', '/api/admin/uploads');
      
      // Add headers
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
      
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  const getFileTypeIcon = () => {
    if (!file) return <Upload className="h-12 w-12 mb-2" />;
    
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-12 w-12 mb-2" />;
    }
    
    return <FileText className="h-12 w-12 mb-2" />;
  };

  return (
    <div className={`w-full ${className}`}>
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-secondary/20' : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleInputChange}
          />
          
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-12 w-12 mb-2 text-muted-foreground" />
            <p className="text-base font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Max file size: {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getFileTypeIcon()}
              <div className="ml-3">
                <p className="text-sm font-medium truncate" style={{ maxWidth: '200px' }}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {preview && file.type.startsWith('image/') && (
            <div className="mb-4 rounded-md overflow-hidden bg-secondary/50">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto object-contain max-h-[200px]"
              />
            </div>
          )}
          
          {uploadSuccess ? (
            <div className="flex items-center text-green-500 mb-4">
              <Check className="h-4 w-4 mr-2" />
              <span className="text-sm">Upload complete</span>
            </div>
          ) : uploading ? (
            <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-xs text-right mt-1 text-muted-foreground">
                {uploadProgress}%
              </p>
            </div>
          ) : null}
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              Clear
            </Button>
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              disabled={uploading || uploadSuccess}
            >
              {uploading ? 'Uploading...' : uploadSuccess ? 'Uploaded' : 'Upload'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
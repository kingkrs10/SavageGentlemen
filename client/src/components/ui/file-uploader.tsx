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
      
      // Get the user data from localStorage
      const userDataString = localStorage.getItem('user');
      let userId = null;
      let token = null;
      
      // Define headers with user ID for authentication
      const headers: Record<string, string> = {};
      
      // Parse user data if it exists
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          // Set user ID and token if available
          if (userData && userData.id) {
            userId = userData.id.toString();
            headers['user-id'] = userId;
            console.log('Setting user-id header to:', userId);
          }
          
          // Add authorization token if available
          if (userData && userData.token) {
            token = userData.token;
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Setting Authorization header with token');
          }
          
          // Also add x-user-data header with minimal user info
          if (userData && userData.id && userData.username && userData.role) {
            const minimalUserData = {
              id: userData.id,
              username: userData.username,
              role: userData.role
            };
            headers['x-user-data'] = JSON.stringify(minimalUserData);
            console.log('Setting x-user-data header with minimal user data');
          }
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
        }
      } else {
        console.warn('No user data found in localStorage for file upload authentication');
      }
      
      // Use fetch with a custom function to track progress instead of XMLHttpRequest
      // First, log what headers we're sending
      console.log('File upload headers:', headers);
      
      // Create a progress tracker
      const trackUploadProgress = async (response: Response): Promise<Response> => {
        const reader = response.body?.getReader();
        const contentLength = +response.headers.get('Content-Length');
        let receivedLength = 0;
        
        if (!reader) return response;
        
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          if (contentLength) {
            const progress = Math.round((receivedLength / contentLength) * 100);
            setUploadProgress(progress);
          }
        }
        
        // Reconstruct the response with the original body
        const allChunks = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }
        
        const newBody = new Blob([allChunks]);
        return new Response(newBody, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      };
      
      try {
        // Use the regular fetch API for simplicity
        const response = await fetch('/api/admin/uploads', {
          method: 'POST',
          headers: headers,
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          setUploadSuccess(true);
          setUploading(false);
          
          if (onFileUploaded && data.file && data.file.url) {
            onFileUploaded(data.file.url);
            console.log('File uploaded successfully, URL:', data.file.url);
          }
          
          toast({
            title: "Upload Complete",
            description: "File uploaded successfully!",
          });
        } else {
          // Handle error response
          setUploading(false);
          let errorMessage = "Upload failed";
          
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            // If we can't parse the response, use status text
            errorMessage = `Upload failed (${response.status}: ${response.statusText})`;
          }
          
          console.error('File upload error:', errorMessage);
          toast({
            title: "Upload Failed",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Network error during file upload:', error);
        setUploading(false);
        toast({
          title: "Upload Failed",
          description: "Network error occurred while uploading",
          variant: "destructive"
        });
      }
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

import { toast } from "@/hooks/use-toast";

export interface FileInfo {
  name: string;
  path: string;
  content: string;
  type: string;
}

export interface DirectoryAnalysis {
  path: string;
  fileCount: number;
  codeFiles: FileInfo[];
  supportedFiles: string[];
}

// Check if File System Access API is supported
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

// Supported code file extensions
const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php',
  '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html', '.css', '.scss',
  '.sass', '.less', '.vue', '.svelte', '.md', '.json', '.yaml', '.yml',
  '.xml', '.sql', '.sh', '.bash', '.ps1', '.r', '.m', '.dart'
];

// Check if file is a code file
const isCodeFile = (fileName: string): boolean => {
  return CODE_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
};

// Select directory using File System Access API
export const selectDirectory = async (): Promise<DirectoryAnalysis | null> => {
  try {
    if (!isFileSystemAccessSupported()) {
      throw new Error('File System Access API not supported in this browser');
    }

    // @ts-ignore - File System Access API types might not be available
    const directoryHandle = await window.showDirectoryPicker();
    
    console.log('Directory selected:', directoryHandle.name);
    
    // Read directory contents
    const analysis = await analyzeDirectory(directoryHandle);
    
    toast({
      title: "Directory selected",
      description: `Found ${analysis.fileCount} files (${analysis.codeFiles.length} code files)`,
    });
    
    return analysis;
  } catch (error: any) {
    console.error('Error selecting directory:', error);
    
    if (error.name === 'AbortError') {
      // User cancelled the dialog
      return null;
    }
    
    toast({
      title: "Directory selection failed",
      description: error.message || "Could not access the selected directory",
      variant: "destructive",
    });
    
    return null;
  }
};

// Analyze directory contents recursively
const analyzeDirectory = async (directoryHandle: any): Promise<DirectoryAnalysis> => {
  const codeFiles: FileInfo[] = [];
  let fileCount = 0;
  const supportedFiles: string[] = [];
  
  try {
    await processDirectoryRecursively(directoryHandle, '', codeFiles, supportedFiles, fileCount);
    
    return {
      path: directoryHandle.name,
      fileCount: supportedFiles.length,
      codeFiles,
      supportedFiles
    };
  } catch (error) {
    console.error('Error analyzing directory:', error);
    throw new Error('Failed to analyze directory contents');
  }
};

// Process directory recursively
const processDirectoryRecursively = async (
  directoryHandle: any,
  currentPath: string,
  codeFiles: FileInfo[],
  supportedFiles: string[],
  fileCount: number,
  maxFiles: number = 100 // Limit to prevent overwhelming the LLM
): Promise<void> => {
  if (codeFiles.length >= maxFiles) {
    return;
  }

  try {
    for await (const [name, handle] of directoryHandle.entries()) {
      if (codeFiles.length >= maxFiles) {
        break;
      }

      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      
      if (handle.kind === 'file') {
        if (isCodeFile(name)) {
          supportedFiles.push(fullPath);
          
          try {
            const file = await handle.getFile();
            
            // Skip very large files (> 1MB)
            if (file.size > 1024 * 1024) {
              console.log(`Skipping large file: ${fullPath} (${file.size} bytes)`);
              continue;
            }
            
            const content = await file.text();
            
            codeFiles.push({
              name,
              path: fullPath,
              content,
              type: getFileType(name)
            });
          } catch (fileError) {
            console.warn(`Could not read file ${fullPath}:`, fileError);
          }
        }
      } else if (handle.kind === 'directory') {
        // Skip common directories that don't contain relevant code
        const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__'];
        if (!skipDirs.includes(name)) {
          await processDirectoryRecursively(handle, fullPath, codeFiles, supportedFiles, fileCount, maxFiles);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${currentPath}:`, error);
  }
};

// Get file type from extension
const getFileType = (fileName: string): string => {
  const extension = fileName.toLowerCase().split('.').pop();
  
  const typeMap: { [key: string]: string } = {
    'js': 'JavaScript',
    'jsx': 'React JSX',
    'ts': 'TypeScript',
    'tsx': 'React TypeScript',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'vue': 'Vue',
    'md': 'Markdown',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML'
  };
  
  return typeMap[extension || ''] || 'Code';
};

// Fallback directory picker using webkitdirectory (for browsers that don't support File System Access API)
export const selectDirectoryFallback = (): Promise<DirectoryAnalysis | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    
    input.onchange = async (event: any) => {
      const files = Array.from(event.target.files) as File[];
      
      if (files.length === 0) {
        resolve(null);
        return;
      }
      
      try {
        const codeFiles: FileInfo[] = [];
        const supportedFiles: string[] = [];
        
        for (const file of files) {
          if (isCodeFile(file.name) && file.size <= 1024 * 1024) { // Skip files > 1MB
            supportedFiles.push(file.webkitRelativePath);
            
            if (codeFiles.length < 100) { // Limit to 100 files
              const content = await file.text();
              codeFiles.push({
                name: file.name,
                path: file.webkitRelativePath,
                content,
                type: getFileType(file.name)
              });
            }
          }
        }
        
        const directoryName = files[0].webkitRelativePath.split('/')[0];
        
        const analysis: DirectoryAnalysis = {
          path: directoryName,
          fileCount: supportedFiles.length,
          codeFiles,
          supportedFiles
        };
        
        toast({
          title: "Directory selected",
          description: `Found ${analysis.fileCount} files (${analysis.codeFiles.length} code files)`,
        });
        
        resolve(analysis);
      } catch (error) {
        console.error('Error processing files:', error);
        toast({
          title: "Directory processing failed",
          description: "Could not process the selected directory",
          variant: "destructive",
        });
        resolve(null);
      }
    };
    
    input.oncancel = () => {
      resolve(null);
    };
    
    input.click();
  });
};

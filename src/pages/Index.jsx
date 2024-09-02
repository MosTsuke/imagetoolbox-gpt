import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { X, Copy, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MAX_IMAGES = 5;
const MIN_KEYWORDS = 40;
const MAX_DESCRIPTION_CHARS = 200;

const Index = () => {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > MAX_IMAGES) {
      toast({
        title: "Error",
        description: `You can only upload a maximum of ${MAX_IMAGES} images.`,
        variant: "destructive",
      });
      return;
    }

    // Clear old images before processing new ones
    setImages([]);
    setResults([]);

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(newImages);
  };

  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    setResults(prevResults => prevResults.filter((_, i) => i !== index));
  };

  const generateDescriptionAndKeywords = async () => {
    setIsLoading(true);
    // TODO: Implement GPT API call here
    // For now, we'll use placeholder data
    const placeholderResults = images.map((_, index) => ({
      description: `This is a sample description for image ${index + 1}. It showcases the content and style of the image, following SEO principles without using trademarks. The description is concise yet informative.`,
      keywords: Array.from({ length: MIN_KEYWORDS }, (_, i) => `keyword${i + 1}`),
      tokensUsed: Math.floor(Math.random() * 100) + 50, // Random number between 50 and 150
    }));
    setResults(placeholderResults);
    setIsLoading(false);
  };

  const clearAll = () => {
    setImages([]);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Description and Keyword Generator</h1>
      <div className="mb-4">
        <Button onClick={() => fileInputRef.current.click()} className="mr-4">
          <Upload className="mr-2 h-4 w-4" /> Upload Images
        </Button>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          ref={fileInputRef}
        />
        <Button onClick={generateDescriptionAndKeywords} disabled={images.length === 0 || isLoading} className="mr-4">
          Generate Description and Keywords
        </Button>
        <Button onClick={clearAll} variant="outline">
          Clear All
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        {images.map((image, index) => (
          <Card key={index} className="relative w-32 h-18">
            <img src={image.preview} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1"
              onClick={() => removeImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
      {results.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/6">Image</TableHead>
                <TableHead className="w-2/5">Description</TableHead>
                <TableHead className="w-2/5">Keywords</TableHead>
                <TableHead className="w-1/12">Tokens Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="w-32 h-18 overflow-hidden">
                      <img src={images[index].preview} alt={`Result ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <p className="pr-8">{result.description}</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-0 right-0"
                              onClick={() => copyToClipboard(result.description)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy description</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Characters: {result.description.length}, Words: {result.description.split(' ').length}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <div className="flex flex-wrap gap-1 pr-8">
                        {result.keywords.map((keyword, i) => (
                          <span key={i} className="bg-gray-200 px-2 py-1 rounded-full text-sm">{keyword}</span>
                        ))}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-0 right-0"
                              onClick={() => copyToClipboard(result.keywords.join(', '))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy keywords</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Keywords: {result.keywords.length}</div>
                  </TableCell>
                  <TableCell>{result.tokensUsed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Index;
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { X, Copy, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from 'next/image';

const MAX_IMAGES = 5;
const MIN_KEYWORDS = 40;
const MAX_KEYWORDS = 50;
const MAX_DESCRIPTION_CHARS = 200;

interface ImageData {
  file: File;
  preview: string;
}

interface Result {
  description: string;
  keywords: string[];
  tokensUsed: number;
}

const Home: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
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

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    setResults(prevResults => prevResults.filter((_, i) => i !== index));
  };

  const generateDescriptionAndKeywords = async () => {
    setIsLoading(true);
    const newResults: Result[] = [];

    for (const image of images) {
      try {
        const base64Image = await convertToBase64(image.file);
        const payload = {
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Generate a description and keywords (minimum ${MIN_KEYWORDS}, maximum ${MAX_KEYWORDS}) for an image with no mention of trademarks. The description should be concise (up to ${MAX_DESCRIPTION_CHARS} characters). Keywords should follow SEO best practices and be in 1-word format, as relevant to the image as possible.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        };

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to generate description and keywords');
        }

        const data = await response.json();
        const { description, keywords, tokensUsed } = parseResponse(data.choices[0].message.content);

        newResults.push({ description, keywords, tokensUsed });
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
        });
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const parseResponse = (content: string): { description: string; keywords: string[]; tokensUsed: number } => {
    const descriptionMatch = content.match(/Description: (.*?)(?:\n|$)/);
    const keywordsMatch = content.match(/Keywords: (.*?)(?:\n|$)/);
    const tokensUsedMatch = content.match(/Tokens used: (\d+)/);

    return {
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      keywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [],
      tokensUsed: tokensUsedMatch ? parseInt(tokensUsedMatch[1], 10) : 0
    };
  };

  const clearAll = () => {
    setImages([]);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (text: string) => {
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
        <Button onClick={() => fileInputRef.current?.click()} className="mr-4">
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
            <Image src={image.preview} alt={`Uploaded ${index + 1}`} width={128} height={72} className="object-cover" />
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
                      <Image src={images[index].preview} alt={`Result ${index + 1}`} width={128} height={72} className="object-cover" />
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

export default Home;
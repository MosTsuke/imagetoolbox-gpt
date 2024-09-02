import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { X } from "lucide-react";

const MAX_IMAGES = 5;

const Index = () => {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (images.length + files.length > MAX_IMAGES) {
      toast({
        title: "Error",
        description: `You can only upload a maximum of ${MAX_IMAGES} images.`,
        variant: "destructive",
      });
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prevImages => [...prevImages, ...newImages]);
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
      description: `Placeholder description for image ${index + 1}. This is a sample text to demonstrate the layout and functionality of the application.`,
      keywords: Array.from({ length: 40 }, (_, i) => `keyword${i + 1}`),
    }));
    setResults(placeholderResults);
    setIsLoading(false);
  };

  const clearAll = () => {
    setImages([]);
    setResults([]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Description and Keyword Generator</h1>
      <div className="mb-4">
        <Input type="file" accept="image/*" multiple onChange={handleImageUpload} />
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        {images.map((image, index) => (
          <Card key={index} className="relative w-32 h-32">
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
      <div className="flex gap-4 mb-4">
        <Button onClick={generateDescriptionAndKeywords} disabled={images.length === 0 || isLoading}>
          Generate Description and Keywords
        </Button>
        <Button onClick={clearAll} variant="outline">
          Clear All
        </Button>
      </div>
      {results.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Keywords</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={index}>
                <TableCell>
                  <img src={images[index].preview} alt={`Result ${index + 1}`} className="w-32 h-32 object-cover" />
                </TableCell>
                <TableCell>
                  <div>{result.description}</div>
                  <div className="text-sm text-gray-500">
                    Characters: {result.description.length}, Words: {result.description.split(' ').length}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {result.keywords.map((keyword, i) => (
                      <span key={i} className="bg-gray-200 px-2 py-1 rounded-full text-sm">{keyword}</span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">Keywords: {result.keywords.length}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Index;
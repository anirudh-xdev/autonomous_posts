export interface ImageGenerationOptions {
  title: string;
  topic?: string;
  visualConcept?: string;
  customPrompt?: string;
  aspectRatio?: '16:9' | '1:1' | '1200:630';
  provider?: 'auto' | 'huggingface' | 'pollinations';
}

export interface GeneratedImageResult {
  imageUrl: string;         // Static path like /generated-images/img-123.png
  fullLocalPath: string;    // Absolute disk path
  promptUsed: string;       // The crafted prompt sent to the image model
  provider: string;         // 'huggingface' | 'pollinations'
  model: string;            // 'black-forest-labs/FLUX.1-schnell' | 'flux'
  width: number;
  height: number;
}

// Import required modules
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Gemini API with your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration from environment variables
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp-image-generation";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./generated-images";
const WEB_BASE_URL = process.env.WEB_BASE_URL || "";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create MCP server instance
const server = new McpServer({
  name: "ImageGenerationServer",
  version: "1.0.0",
  description: "Server for generating images using Gemini API with Imagen 3"
});

// Helper function to fetch image from URL
async function fetchImageFromUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Determine MIME type from response headers or URL extension
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return {
      data: base64,
      mimeType: contentType
    };
  } catch (error) {
    throw new Error(`Error fetching image from URL: ${error.message}`);
  }
}

// Add image generation tool with image URL support
server.tool(
  "generateImage",
  {
    prompt: z.string(),
    aspectRatio: z.string().optional(),
    outputFormat: z.string().optional(),
    imageUrl: z.string().optional(),
    model: z.string().optional()
  },
  async (params) => {
    // Default values
    const prompt = params.prompt || "Default image prompt";
    const aspectRatio = params.aspectRatio || "1:1";
    const outputFormat = params.outputFormat || "png";
    const imageUrl = params.imageUrl;
    const modelName = params.model || GEMINI_MODEL;

    try {
      // Initialize the model with configurable model name (per-request or environment default)
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseModalities: ['Text', 'Image'],
        },
      });

      // Prepare content for generation
      let contentParts = [{ text: prompt }];
      
      // If image URL is provided, fetch and include it in the request
      if (imageUrl) {
        try {
          const imageData = await fetchImageFromUrl(imageUrl);
          contentParts.push({
            inlineData: {
              data: imageData.data,
              mimeType: imageData.mimeType
            }
          });
          // Fetched image from URL
        } catch (fetchError) {
          // Failed to fetch image from URL
          return {
            content: [{
              type: "text",
              text: `Error: Could not fetch image from URL: ${fetchError.message}`
            }]
          };
        }
      }

      // Generate the image
      const result = await model.generateContent(contentParts);

      // Extract the generated image data (base64 encoded)
      const responseContent = [];
      const MAX_RESPONSE_SIZE = 1048576; // 1MB limit
      
      for (const part of result.response.candidates[0].content.parts) {
        if (part.text) {
          responseContent.push({
            type: "text",
            text: part.text
          });
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, 'base64');
          
          // Generate unique filename with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `gemini-image-${timestamp}.${outputFormat}`;
          const filepath = path.join(OUTPUT_DIR, filename);
          
          fs.writeFileSync(filepath, buffer);
          // Image saved to file
          
          // Calculate response size with image data
          const imageResponse = {
            type: "image",
            data: imageData,
            mimeType: `image/${outputFormat}`
          };
          
          const currentResponseSize = JSON.stringify({ content: [...responseContent, imageResponse] }).length;
          
          // If adding the image would exceed the limit, return URL instead
          if (currentResponseSize > MAX_RESPONSE_SIZE) {
            if (WEB_BASE_URL) {
              const webUrl = `${WEB_BASE_URL.replace(/\/$/, '')}/${filename}`;
              responseContent.push({
                type: "text",
                text: `Image saved. Use markdown to display: ![Generated Image](${webUrl})\n\nDirect URL: ${webUrl}`
              });
            } else {
              responseContent.push({
                type: "text", 
                text: `Image saved as ${filepath} (too large to display inline)`
              });
            }
          } else {
            // Response size is okay, include the image data
            responseContent.push(imageResponse);
            
            // Still add web URL if configured
            if (WEB_BASE_URL) {
              const webUrl = `${WEB_BASE_URL.replace(/\/$/, '')}/${filename}`;
              responseContent.push({
                type: "text",
                text: `Image also available at: ${webUrl}`
              });
            }
          }
        }
      }
      
      // Return all content parts (text and images)
      if (responseContent.length > 0) {
        return { content: responseContent };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating image: ${error.message}`
        }]
      };
    }
  },
  {
    description: "Generate or modify images using Gemini API. Can create new images from text prompts or modify existing images by providing an image URL. When a web URL is returned in the response, use markdown syntax ![alt text](url) to display the image inline.",
    parameters: {
      prompt: { type: "string", description: "The text description of the image to generate or modifications to apply to the input image" },
      aspectRatio: { type: "string", description: "Aspect ratio of the image (e.g., '1:1', '16:9')", optional: true },
      outputFormat: { type: "string", description: "Output image format ('png' or 'jpeg')", optional: true },
      imageUrl: { type: "string", description: "Optional URL of an existing image to modify or use as reference. When provided, the prompt will be applied as modifications to this image.", optional: true },
      model: { type: "string", description: "Gemini model to use for generation. Defaults to GEMINI_MODEL environment variable. Common options: 'gemini-2.0-flash-exp-image-generation', 'gemini-2.5-flash-image-preview', 'gemini-1.5-pro', 'gemini-1.5-flash'", optional: true }
    }
  }
);

// Start the server
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // MCP Image Generation Server is running
  } catch (error) {
    // Server startup error
  }
}

startServer();
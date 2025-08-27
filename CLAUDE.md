# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides image generation capabilities using Google's Gemini 2.0 Flash experimental image generation API. The server exposes a single `generateImage` tool that can create images from text prompts.

## Architecture

- **server.js**: Main MCP server implementation using `@modelcontextprotocol/sdk`
- **testapi.js**: Standalone test script for direct API testing
- **package.json**: ES modules project with stdio-based MCP server

### Core Components

1. **MCP Server Setup**: Uses `McpServer` class with `StdioServerTransport` for communication
2. **Gemini Integration**: Leverages `@google/generative-ai` SDK with the `gemini-2.0-flash-exp-image-generation` model
3. **Tool Definition**: Single `generateImage` tool with zod schema validation

## Development Commands

```bash
# Start the MCP server
npm start

# Test the API directly (standalone test)
npm run testapi

# Install dependencies
npm install

# Test with MCP inspector
npx @modelcontextprotocol/inspector npm run start
```

## Environment Setup

Environment variables in `.env` file:
```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp-image-generation
OUTPUT_DIR=./generated-images  
WEB_BASE_URL=https://your-domain.com/images
```

- `GEMINI_API_KEY` (required): Google Gemini API key
- `GEMINI_MODEL` (optional): Gemini model to use for image generation (default: gemini-2.0-flash-exp-image-generation)
- `OUTPUT_DIR` (optional): Directory to save generated images (default: ./generated-images)
- `WEB_BASE_URL` (optional): Base URL for serving images publicly. When set, generated images include a web URL

## Key Implementation Details

### generateImage Tool Parameters
- `prompt` (required): Text description of image to generate or modifications to apply to input image
- `aspectRatio` (optional): Image aspect ratio (default: "1:1")
- `outputFormat` (optional): Image format (default: "png")
- `imageUrl` (optional): URL of existing image to modify or use as reference
- `model` (optional): Gemini model to use, defaults to `GEMINI_MODEL` environment variable

### Image Processing
- **New Image Generation**: When only `prompt` is provided, creates a new image from scratch
- **Image Modification**: When `imageUrl` is provided, fetches the image and applies prompt as modifications
- Images are fetched from URLs and converted to base64 for processing
- Supports modification of images already in the conversation context or external URLs

### Response Handling
- Server processes both text and image parts from Gemini response
- Images are returned as base64-encoded inline data with MIME type
- Generated images are saved with unique timestamped filenames in the configured output directory
- When `WEB_BASE_URL` is set, responses include a public URL for the generated image

### Model Selection
The model can be specified in three ways (in order of precedence):
1. **Per-request**: Use the `model` parameter in the `generateImage` tool call
2. **Environment variable**: Set `GEMINI_MODEL` in `.env` file
3. **Default**: Falls back to `gemini-2.0-flash-exp-image-generation`

**Available Models:**
- `gemini-2.0-flash-exp-image-generation` (default, experimental image generation)
- `gemini-2.5-flash-image-preview` (preview image generation model)
- `gemini-1.5-pro` (vision-capable, high quality)
- `gemini-1.5-flash` (vision-capable, faster)

### Model Configuration
```javascript
const modelName = params.model || GEMINI_MODEL; // Per-request or environment default
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    responseModalities: ['Text', 'Image'],
  },
});
```

## Claude Desktop Integration

This server is designed to be used with Claude Desktop via npx:
```json
{
  "mcpServers": {
    "gemini-imagen": {
      "command": "npx",
      "args": ["-y", "github:sanxfxteam/gemini-mcp-server"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```
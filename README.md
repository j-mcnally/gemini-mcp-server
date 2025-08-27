# Gemini Image Generation MCP Server

This is a Model Context Protocol (MCP) server that provides image generation capabilities using Google's Gemini 2 API.

<a href="https://glama.ai/mcp/servers/@sanxfxteam/gemini-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@sanxfxteam/gemini-mcp-server/badge" alt="Gemini Image Generation Server MCP server" />
</a>

## Quick Start

1. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

2. **Configure Claude Desktop**
   - Locate your config file:
     ```
     Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
     Windows: %APPDATA%\Claude\claude_desktop_config.json
     Linux: ~/.config/Claude/claude_desktop_config.json
     ```
   - Add Gemini configuration:
     ```json
     {
       "mcpServers": {
         "gemini-imagen": {
           "command": "npx",
           "args": ["-y", "github:sanxfxteam/gemini-mcp-server"],
           "env": {
             "GEMINI_API_KEY": "your_api_key_here",
             "GEMINI_MODEL": "gemini-2.0-flash-exp-image-generation",
             "OUTPUT_DIR": "./generated-images",
             "WEB_BASE_URL": "https://your-domain.com/images"
           }
         }
       }
     }
     ```

3. **Restart Claude Desktop**

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
Create a `.env` file in the root directory:
```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp-image-generation
OUTPUT_DIR=./generated-images
WEB_BASE_URL=https://your-domain.com/images
```

**Environment Variables:**
- `GEMINI_API_KEY` (required): Your Google Gemini API key
- `GEMINI_MODEL` (optional): Gemini model to use for image generation
  - Default: `gemini-2.0-flash-exp-image-generation`
  - Options: `gemini-2.0-flash-exp-image-generation`, `gemini-2.5-flash-image-preview`, `gemini-1.5-pro`, `gemini-1.5-flash`
- `OUTPUT_DIR` (optional): Directory to save generated images (default: `./generated-images`)
- `WEB_BASE_URL` (optional): Base URL for serving images publicly. When set, responses include web URLs for generated images

## Usage

Run the server:
```bash
npm start
```

To test
```bash
npx @modelcontextprotocol/inspector npm run start
```

### Available Tools

#### generateImage

Generates or modifies images using Gemini API. Can create new images from text prompts or modify existing images.

Parameters:
- `prompt` (string, required): Text description of image to generate or modifications to apply to input image
- `aspectRatio` (string, optional, default: '1:1'): Aspect ratio of the generated images  
- `outputFormat` (string, optional, default: 'png'): Output image format ('png' or 'jpeg')
- `imageUrl` (string, optional): URL of existing image to modify or use as reference
- `model` (string, optional): Gemini model to use, defaults to `GEMINI_MODEL` environment variable

Example MCP requests:
```json
// Generate new image
{
  "tool": "generateImage",
  "params": {
    "prompt": "A serene mountain landscape at sunset",
    "aspectRatio": "16:9",
    "outputFormat": "png"
  }
}

// Modify existing image
{
  "tool": "generateImage", 
  "params": {
    "prompt": "Add snow to the mountains",
    "imageUrl": "https://example.com/mountain.jpg",
    "model": "gemini-2.5-flash-image-preview"
  }
}
```

## Notes

- This server uses the experimental image generation feature of Gemini 2
- Make sure you have appropriate access and API keys from Google
- The server communicates using the Model Context Protocol over stdio
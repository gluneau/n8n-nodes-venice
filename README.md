# @gluneau/n8n-nodes-venice

This is an n8n community node package that provides integration with [Venice.ai](https://venice.ai)'s AI services. It allows n8n workflows to use Venice.ai's models for text generation, image creation, speech synthesis, and vector embeddings.

## Features

This node package provides:

- **Venice AI** (root node): Main entry point for Venice.ai integrations
- **Venice Chat Model** (sub-node): Generate text using Venice.ai's chat models
- **Venice Image Generation** (sub-node): Create and manipulate images with Venice.ai
- **Venice Text to Speech** (sub-node): Convert text to spoken audio with Venice.ai
- **Venice Embeddings** (sub-node): Generate vector embeddings from text with Venice.ai

## Prerequisites

- [n8n](https://n8n.io/) (version 0.177.0 or later)
- [Node.js](https://nodejs.org/en/) (version 18 or later)
- A Venice.ai API key

## Installation

Follow these steps to install this custom node package in your n8n instance:

### Local Installation (Development)

1. Clone this repository:

   ```bash
   git clone https://github.com/gluneau/n8n-nodes-venice.git
   cd n8n-nodes-venice
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the package:

   ```bash
   npm run build
   ```

4. Link the package to your n8n installation:

   ```bash
   npm link
   ```

5. In your n8n installation directory:

   ```bash
   cd ~/.n8n/nodes
   npm link @gluneau/n8n-nodes-venice
   ```

6. Start n8n:

   ```bash
   n8n start
   ```

### Production Installation

1. Install directly from npm:

   ```bash
   npm install -g @gluneau/n8n-nodes-venice
   ```

2. Start n8n:

   ```bash
   n8n start
   ```

## Configuration

### Setting up Venice.ai Credentials

1. Log in to your n8n instance
2. Go to **Settings > Credentials**
3. Click on **New Credential**
4. Search for "Venice.ai API" and select it
5. Enter your Venice.ai API key
6. Save the credential

## Usage

After installation, you'll find the Venice.ai nodes in the n8n nodes panel.

### Basic Workflow with Venice Chat Model

1. Add a trigger node (e.g., HTTP Request or Manual trigger)
2. Add the **Venice AI** node
3. Click on the "Add Chat Model" button in the Venice AI node
4. Configure the Venice Chat Model with your prompt and model settings
5. Connect to output nodes as needed

### Example: Text Generation Workflow

Here's a simple workflow that generates text based on a prompt:

1. **Manual Trigger**
2. **Set** node (to define the prompt):
   - Set a `prompt` variable with your text prompt
3. **Venice AI** node:
   - Add a Chat Model
   - In the Chat Model, add a message with role "User" and content set to `{{$json.prompt}}`
   - Configure model and other parameters as needed
4. **Respond to Webhook** node to return the result

### Example: Image Generation Workflow

Create images from text descriptions:

1. **HTTP Request** trigger
2. **Venice AI** node:
   - Add Image Generation
   - Set prompt to `{{$json.body.prompt}}`
   - Configure size, style, and other parameters
3. **HTTP Response** node to return the generated image

### Example: Text-to-Speech Workflow

Convert text to spoken audio:

1. **HTTP Request** trigger (with text input)
2. **Venice AI** node:
   - Add Text to Speech
   - Set text to `{{$json.body.text}}`
   - Choose voice and format
3. **HTTP Response** node to return the audio file

### Example: Embeddings Workflow

Generate vector embeddings for text:

1. **Function** node (with text input)
2. **Venice AI** node:
   - Add Embeddings
   - Set input to `{{$json.text}}`
   - Configure model and dimensions
3. **Write to File** node to save embeddings for further use

## Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lintfix
```

### Formatting Code

```bash
npm run format
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the [issues page](https://github.com/gluneau/n8n-nodes-venice/issues)
2. Create a new issue if your problem doesn't already exist

For Venice.ai API-specific questions, refer to their [official documentation](https://docs.venice.ai).

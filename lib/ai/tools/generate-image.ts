import { fal } from '@ai-sdk/fal';
import { experimental_generateImage as generateImage, tool } from 'ai';
import { z } from 'zod';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '16:10' | '10:16' | '21:9' | '9:21';

export async function generateImageReplicate(prompt: string, aspectRatio: AspectRatio): Promise<any> {
    // Generate the image using your existing model configuration
    const { image } = await generateImage({
        model: fal.image("fal-ai/flux/schnell"),
        prompt: prompt,
        aspectRatio: aspectRatio,
    });

    // Convert the image's Uint8Array data to a base64 string.
    // Note: bufferToBase64 returns a data URL (e.g., "data:image/png;base64,...").
    const base64WithPrefix = bufferToBase64(image.uint8Array);
    // Remove the "data:image/png;base64," prefix so that Imgur only gets the raw base64 data.
    const base64Image = base64WithPrefix.replace(/^data:image\/\w+;base64,/, "");

    // Prepare form data as URL-encoded string
    const formData = new URLSearchParams();
    formData.append("image", base64Image);
    formData.append("type", "base64");
    formData.append("title", "Simple upload");
    formData.append("description", "prompt: " + prompt);

    // Get your Imgur Client ID from environment variables (or another secure place)
    const clientId = process.env.IMGUR_CLIENT_ID;
    if (!clientId) {
        throw new Error("IMGUR_CLIENT_ID not set in environment variables");
    }

    // Upload the image to Imgur
    const response = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
            "Authorization": `Client-ID ${clientId}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
    });

    const data = await response.json();

    return data.data.link
}


export const generateImageTool = tool({
    description: "Generates an image, with a given prompt, and resulution. this returns a url",
    parameters: z.object({
        prompt: z.string().describe("This is the prompt the image generation ai uses, an diffusion model optimized prompt"),
        aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4", "16:10", "10:16", "21:9", "9:21"]).default("16:9").describe("This is the resolution the image generation ai uses")
    }),
    execute: async ({ prompt, aspectRatio }) => {

        const image = await generateImageReplicate(prompt, aspectRatio as AspectRatio)

        return {
            imageUrl: await image
        }
    },
})

export function bufferToBase64(buffer: Uint8Array): string {
    // Convert Uint8Array to Base64 using Buffer in Node.js
    const base64 = Buffer.from(buffer).toString('base64');

    // Create a data URL (you may need to adjust the MIME type)
    return `data:image/png;base64,${base64}`;
}
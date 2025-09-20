import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

dotenv.config();

// AWS Bedrock configuration
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

/**
 * Send message to AWS Bedrock Claude model
 */
export async function sendMessageToBedrock(message, systemPrompt = null) {
  try {
    const modelId =
      process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";

    // Check if it's Claude 3 model (uses different format)
    const isClaude3 = modelId.includes("claude-3");

    let requestBody;

    if (isClaude3) {
      // Claude 3 format
      const messages = [
        {
          role: "user",
          content: message,
        },
      ];

      requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: parseInt(process.env.BEDROCK_MAX_TOKENS) || 256,
        messages: messages,
        temperature: 0.7,
        top_p: 0.9,
      };

      // Add system prompt if provided
      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }
    } else {
      // Legacy Claude format
      const prompt = systemPrompt
        ? `Human: ${systemPrompt}\n\nUser: ${message}\n\nAssistant:`
        : `Human: ${message}\n\nAssistant:`;

      requestBody = {
        prompt,
        max_tokens_to_sample: parseInt(process.env.BEDROCK_MAX_TOKENS) || 256,
        temperature: 0.7,
        top_p: 0.9,
        stop_sequences: ["\n\nHuman:"],
      };
    }

    console.log(`🤖 Sending message to Bedrock model: ${modelId}`);
    console.log(`📋 Request body:`, JSON.stringify(requestBody, null, 2));

    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log(`📋 Response body:`, JSON.stringify(responseBody, null, 2));

    let responseText;
    if (isClaude3) {
      responseText = responseBody.content?.[0]?.text || "No response generated";
    } else {
      responseText = responseBody.completion || "No response generated";
    }

    console.log(
      `✅ Received response from Bedrock (${responseText.length} chars)`
    );

    return {
      success: true,
      response: responseText,
      usage: {
        inputTokens: responseBody.usage?.input_tokens || 0,
        outputTokens: responseBody.usage?.output_tokens || 0,
        model: modelId,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error communicating with Bedrock:", error);
    console.error("❌ Full error details:", JSON.stringify(error, null, 2));

    // Handle specific AWS errors
    let errorMessage = "Failed to communicate with AI model";
    let statusCode = 500;

    if (error.name === "ValidationException") {
      errorMessage = "Invalid request parameters";
      statusCode = 400;
      console.error("❌ Validation error details:", error.message);
    } else if (error.name === "AccessDeniedException") {
      errorMessage = "Access denied - check AWS credentials";
      statusCode = 403;
    } else if (error.name === "ThrottlingException") {
      errorMessage = "Rate limit exceeded - please try again later";
      statusCode = 429;
    } else if (error.name === "ModelNotReadyException") {
      errorMessage = "AI model is not ready - please try again later";
      statusCode = 503;
    } else if (error.name === "ResourceNotFoundException") {
      errorMessage = "Model not found - check model ID";
      statusCode = 404;
    }

    throw {
      success: false,
      error: errorMessage,
      code: error.name,
      statusCode,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      fullError: process.env.NODE_ENV === "development" ? error : undefined,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Send message to Bedrock with conversation history
 */
export async function sendConversationToBedrock(messages, systemPrompt = null) {
  try {
    const modelId =
      process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";
    const isClaude3 = modelId.includes("claude-3");

    let requestBody;

    if (isClaude3) {
      // Claude 3 format - convert messages to proper format
      const formattedMessages = messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: parseInt(process.env.BEDROCK_MAX_TOKENS) || 256,
        messages: formattedMessages,
        temperature: 0.7,
        top_p: 0.9,
      };

      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }
    } else {
      // Legacy Claude format
      let conversationPrompt = systemPrompt ? `${systemPrompt}\n\n` : "";

      messages.forEach((msg, index) => {
        if (msg.role === "user") {
          conversationPrompt += `Human: ${msg.content}\n\n`;
        } else if (msg.role === "assistant") {
          conversationPrompt += `Assistant: ${msg.content}\n\n`;
        }
      });

      conversationPrompt += "Assistant:";

      requestBody = {
        prompt: conversationPrompt,
        max_tokens_to_sample: parseInt(process.env.BEDROCK_MAX_TOKENS) || 256,
        temperature: 0.7,
        top_p: 0.9,
        stop_sequences: ["\n\nHuman:"],
      };
    }

    console.log(
      `🤖 Sending conversation (${messages.length} messages) to Bedrock`
    );
    console.log(`📋 Request body:`, JSON.stringify(requestBody, null, 2));

    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    console.log(`📋 Response body:`, JSON.stringify(responseBody, null, 2));

    let responseText;
    if (isClaude3) {
      responseText = responseBody.content?.[0]?.text || "No response generated";
    } else {
      responseText = responseBody.completion || "No response generated";
    }

    console.log(`✅ Received conversation response from Bedrock`);

    return {
      success: true,
      response: responseText,
      conversationLength: messages.length,
      usage: {
        inputTokens: responseBody.usage?.input_tokens || 0,
        outputTokens: responseBody.usage?.output_tokens || 0,
        model: modelId,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error in conversation with Bedrock:", error.message);
    console.error(
      "❌ Full conversation error:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
}

/**
 * Test Bedrock connection
 */
export async function testBedrockConnection() {
  try {
    const testResponse = await sendMessageToBedrock(
      'Hello! Please respond with just "Connection successful"'
    );
    return {
      connected: true,
      model: process.env.BEDROCK_MODEL_ID,
      region: process.env.AWS_REGION,
      response: testResponse.response,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.error || error.message,
      model: process.env.BEDROCK_MODEL_ID,
      region: process.env.AWS_REGION,
    };
  }
}

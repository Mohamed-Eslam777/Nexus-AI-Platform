const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Get the API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not set.');
}

// Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(API_KEY);

// Define safety settings to be less restrictive
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// This is the main function that will be called by the controller
const aiQualityCheck = async (submittedContent, projectCriteria) => {
  if (!API_KEY) {
    console.log('AI Service SKIPPED: No API Key. Defaulting to PENDING.');
    return { status: 'PENDING', reason: 'AI Quality Check failed or API key is missing.' };
  }

  try {
    // Combine system instructions and user data into a single prompt
    const fullPrompt = `You are an AI Quality Assurance agent for a data annotation platform called Nexus AI.
Your role is to review a user's submission against a set of project instructions.
You must respond with a JSON object in the format: {"status": "APPROVED" | "REJECTED" | "PENDING", "reason": "A brief, one-sentence explanation for your decision."}
- APPROVED: The submission perfectly follows all instructions.
- REJECTED: The submission clearly violates the instructions or is low quality.
- PENDING: The submission is good but not perfect, or it is too complex for you to judge. It needs human review.
Your response must be *only* the JSON object, with no other text.

Here are the project instructions:
--- PROJECT INSTRUCTIONS ---
${JSON.stringify(projectCriteria, null, 2)}
--- END OF INSTRUCTIONS ---

Here is the user's submission:
--- USER SUBMISSION ---
${typeof submittedContent === 'string' ? submittedContent : JSON.stringify(submittedContent, null, 2)}
--- END OF SUBMISSION ---

Please evaluate the submission and respond with a JSON object containing "status" and "reason".`;

    // Get the model with generation config and safety settings
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 150, // Increased to allow for JSON with reason
      },
      safetySettings: safetySettings,
    });

    // Generate content using the model
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let rawResponse = response.text().trim();

    // 5. Clean and parse the JSON response
    // Find the JSON part in case Gemini adds extra text
    const jsonMatch = rawResponse.match(/\{.*\}/);
    if (!jsonMatch) {
      console.error('AI Error: No valid JSON found in response:', rawResponse);
      return { status: 'PENDING', reason: 'AI response was not valid JSON.' };
    }

    try {
      const jsonResponse = JSON.parse(jsonMatch[0]);
      const status = jsonResponse.status ? jsonResponse.status.toUpperCase() : 'PENDING';
      const reason = jsonResponse.reason || 'No reason provided by AI.';

      // Validate status
      if (['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        // Log the AI decision for debugging
        console.log(`[AI QUALITY CHECK] Content length: ${typeof submittedContent === 'string' ? submittedContent.length : JSON.stringify(submittedContent).length} chars, Project: ${projectCriteria?.title || 'Unknown'}, Triage Status: ${status}, Reason: ${reason}`);
        return { status, reason };
      } else {
        console.error('AI Error: Invalid status returned:', status);
        return { status: 'PENDING', reason: 'AI returned an invalid status.' };
      }
    } catch (parseError) {
      console.error('AI Error: Failed to parse JSON response:', parseError);
      console.error('Raw response:', rawResponse);
      return { status: 'PENDING', reason: 'AI failed to parse response.' };
    }

  } catch (error) {
    console.error('Error during AI Quality Check:', error);
    // If the AI call fails (e.g., API error, safety block), default to PENDING
    return { status: 'PENDING', reason: 'AI Quality Check failed or API key is missing.' };
  }
};

// NEW FUNCTION for generating project details
const aiGenerateInstructions = async (title, taskType) => {
  if (!API_KEY) {
    return { description: '', detailedInstructions: '' }; // Fallback
  }

  try {
    // 1. Define the System Prompt
    const systemPrompt = `You are an expert Project Manager at Nexus AI.
You will be given a project TITLE and TASK TYPE.
You must generate a clear, concise 'description' (1-2 sentences) and detailed, step-by-step 'detailedInstructions' for the freelancers.
The instructions must be formatted as simple HTML (use <ul>, <li>, <p>, <strong> tags).
You must respond with ONLY a valid JSON object in the format: {"description": "...", "detailedInstructions": "..."}`;

    // 2. Define the User Prompt
    const userPrompt = `Project Title: "${title}"
Task Type: "${taskType}"`;

    // 3. Get the model (using the same model as aiQualityCheck)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5, // Slightly more creative
        maxOutputTokens: 2000, // Allow for longer instructions
      },
      safetySettings: safetySettings,
    });

    // 4. Start the chat session
    const chat = model.startChat({
      generationConfig: { temperature: 0.5 },
      safetySettings: safetySettings,
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'OK' }] }
      ]
    });

    // 5. Send the user prompt and get the result
    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    let rawResponse = response.text().trim();

    // 6. Parse the JSON response
    const jsonMatch = rawResponse.match(/\{.*\}/s); // 's' flag for multiline JSON
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON.');
    }
    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Error during AI Instruction Generation:', error);
    return { description: 'Error generating content.', detailedInstructions: 'Error generating content.' };
  }
};

module.exports = { aiQualityCheck, aiGenerateInstructions };

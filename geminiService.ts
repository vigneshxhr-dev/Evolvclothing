
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { fetchSheetData, normalizePhone } from "./utils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const checkInterviewStatusTool: FunctionDeclaration = {
  name: "checkInterviewStatus",
  parameters: {
    type: Type.OBJECT,
    description: "Check the interview status for a candidate using their phone number.",
    properties: {
      phoneNumber: {
        type: Type.STRING,
        description: "The phone number of the candidate to check.",
      },
    },
    required: ["phoneNumber"],
  },
};

export class GeminiService {
  private chat: any;

  constructor() {
    this.chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are a professional and friendly Recruitment Assistant for Evolv Clothing. 
        Your primary goal is to help candidates check their interview status quickly and accurately.
        
        Guidelines:
        1. Identification: If a user wants to check their status, ask for their registered phone number if they haven't provided it.
        2. Lookup: Use the 'checkInterviewStatus' tool to lookup information. Always normalize phone numbers to digits only.
        3. Presentation: When a match is found, present the information in a professional, structured format. 
           Use Markdown:
           - Use **bold** for key terms like Status and Position.
           - Format: "### Candidate Information\n- **Name:** {name}\n- **Position:** {position}\n- **Status:** {status}\n- **Interview Date:** {date}"
        4. HR Contact Information: If the user asks for HR contact details, needs further assistance, or explicitly asks for "HR Contact", provide the following:
           - **Name:** Vigneshwaran
           - **Phone:** 9344117877
           - **Email:** Careers@evolv clothing
        5. Privacy: Only show details for the specific phone number provided. Never list multiple candidates.
        6. Not Found: If no match is found, suggest they double-check the number and provide the HR contact details if they need further help.
        7. Tone: Professional, warm, and efficient. Avoid long preamble.`,
        tools: [{ functionDeclarations: [checkInterviewStatusTool] }],
      },
    });
  }

  async sendMessage(message: string) {
    let response = await this.chat.sendMessage({ message });
    
    // Handle function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        if (call.name === "checkInterviewStatus") {
          const phoneNumber = normalizePhone(call.args.phoneNumber as string);
          const candidates = await fetchSheetData();
          const match = candidates.find(c => normalizePhone(c.phone) === phoneNumber);
          
          const result = match 
            ? { success: true, data: match } 
            : { success: false, message: "No candidate found with that phone number." };
            
          // Provide result back to the model to generate the final response
          response = await this.chat.sendMessage({
            message: `Result of checkInterviewStatus for ${phoneNumber}: ${JSON.stringify(result)}`
          });
        }
      }
    }

    return response.text;
  }
}

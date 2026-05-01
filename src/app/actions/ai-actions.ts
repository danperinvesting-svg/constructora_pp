'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ProposalData {
  title: string;
  clientName: string;
  clientContact: string;
  date: string;
  area: string;
  investmentAmount: string;
  executionTime: string;
  fullProposalText: string;
}

// ─────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `Eres el asistente técnico de P&P CONSTRUYE. 
Tu nombre es "Pepe".

Tu estilo de respuesta debe ser:
- PROFESIONAL Y SOBRIO: Evita el uso excesivo de emojis (máximo 1 por mensaje o ninguno).
- SIN ADORNOS INNECESARIOS: No uses tablas de Markdown (evita las barras "|" y rayitas "---"). 
- LISTAS LIMPIAS: Para materiales o pasos técnicos, usa listas simples con guiones (-) o números. 
- DIRECTO AL GRANO: Si el usuario pide materiales, dálos en una lista de texto plano que sea fácil de copiar y pegar.
- VOCABULARIO TÉCNICO: Usa términos de construcción venezolana.

COMPORTAMIENTO:
- Siempre confirma lo que entendiste antes de calcular.
- Si el usuario dice "ponle X" o "quítale Y", ajusta los cálculos inmediatamente.
- Si el usuario dice "genera la propuesta" o "está listo", responde solo con: [LISTO_PARA_GENERAR]
- Máximo 3 párrafos.`;

const PROPOSAL_SYSTEM_PROMPT = `Eres el redactor de propuestas técnicas de P&P CONSTRUYE.
Basándote en la conversación proporcionada, redacta una propuesta profesional EXACTAMENTE en este formato (SIN incluir guiones "---" al principio ni al final):

Proyecto: [Nombre descriptivo del proyecto]
Fecha: [Fecha de hoy]
Para: [Nombre del cliente / familia]
Área del Proyecto: [Si se menciona]

Objetivo del Proyecto
[Descripción técnica clara del objetivo basada en la conversación]

Fases del Trabajo (Alcance Técnico)
[Lista numerada de fases técnicas. Cada fase con nombre en negrita y descripción]

Tiempo de Ejecución y Entrega
[Tiempo estimado basado en lo discutido]

Presupuesto de Inversión (A Todo Costo)
Esta cotización se presenta bajo la modalidad "A Todo Costo". Incluye todos los materiales, transporte, herramientas y mano de obra calificada necesarios para entregar la obra terminada.

INVERSIÓN TOTAL: $[Monto calculado o "Por Definir"]

Condiciones y Métodos de Pago
Esquema de Pago: Anticipo del 60% para la adquisición de materiales y movilización; 40% restante al finalizar la obra.
Tasa de Cambio: El presupuesto se mantiene en divisas. De realizarse el pago en moneda nacional, se aplicará la tasa Binance vigente para el día del pago.

TAMBIÉN incluye al inicio un bloque JSON (antes del texto de la propuesta):
<JSON_DATA>
{
  "title": "nombre corto del proyecto",
  "clientName": "nombre del cliente",
  "clientContact": "si se mencionó",
  "area": "área si se mencionó",
  "investmentAmount": "monto numérico o Por Definir",
  "executionTime": "tiempo estimado"
}
</JSON_DATA>`;

// ─────────────────────────────────────────────
// SEND CHAT MESSAGE (conversación libre)
// ─────────────────────────────────────────────
export async function sendChatMessage(messages: ChatMessage[]): Promise<{
  success: boolean;
  reply?: string;
  readyToGenerate?: boolean;
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
    return { success: false, error: 'API Key de Gemini no configurada. Agrega GEMINI_API_KEY en el archivo .env.local (obtén una gratis en aistudio.google.com)' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build the chat history for the API (all except the last user message)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: CHAT_SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: '¡Entendido! Soy el asistente técnico de P&P CONSTRUYE. ¿En qué proyecto estamos trabajando?' }] },
        ...history
      ],
    });

    const lastMessage = messages[messages.length - 1].text;
    const result = await chat.sendMessage(lastMessage);
    const replyText = result.response.text();

    const readyToGenerate = replyText.includes('[LISTO_PARA_GENERAR]');
    const cleanReply = replyText.replace('[LISTO_PARA_GENERAR]', '').trim();

    return {
      success: true,
      reply: cleanReply || '¡Perfecto! La información está lista. Presiona "Generar Propuesta" para formalizarla.',
      readyToGenerate,
    };
  } catch (error: any) {
    return { success: false, error: `Error al contactar Gemini: ${error.message}` };
  }
}

// ─────────────────────────────────────────────
// GENERATE FINAL PROPOSAL (basado en conversación)
// ─────────────────────────────────────────────
export async function generateFinalProposal(messages: ChatMessage[]): Promise<{
  success: boolean;
  data?: ProposalData;
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
    return { success: false, error: 'API Key de Gemini no configurada.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const conversationSummary = messages
      .map(m => `${m.role === 'user' ? 'Cliente/Usuario' : 'Asistente'}: ${m.text}`)
      .join('\n\n');

    const today = new Date().toLocaleDateString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const prompt = `${PROPOSAL_SYSTEM_PROMPT}

La fecha de hoy es: ${today}

CONVERSACIÓN COMPLETA:
${conversationSummary}

Genera la propuesta profesional ahora.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON
    const jsonMatch = responseText.match(/<JSON_DATA>([\s\S]*?)<\/JSON_DATA>/);
    let parsedJson: any = {};
    if (jsonMatch) {
      try { parsedJson = JSON.parse(jsonMatch[1].trim()); } catch {}
    }

    const fullProposalText = responseText
      .replace(/<JSON_DATA>[\s\S]*?<\/JSON_DATA>/, '')
      .replace(/^---\s*/, '')
      .replace(/\s*---$/, '')
      .trim();

    return {
      success: true,
      data: {
        title: parsedJson.title || 'Nueva Propuesta',
        clientName: parsedJson.clientName || '',
        clientContact: parsedJson.clientContact || '',
        date: parsedJson.date || today,
        area: parsedJson.area || '',
        investmentAmount: parsedJson.investmentAmount || 'Por Definir',
        executionTime: parsedJson.executionTime || '',
        fullProposalText,
      }
    };
  } catch (error: any) {
    return { success: false, error: `Error al generar propuesta: ${error.message}` };
  }
}

// ─────────────────────────────────────────────
// MODIFY PROPOSAL TEXT
// ─────────────────────────────────────────────
export async function modifyProposalText(currentText: string, instruction: string): Promise<{
  success: boolean;
  modifiedText?: string;
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
    return { success: false, error: 'API Key de Gemini no configurada.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Eres un asistente técnico de construcción. A continuación te presento el texto actual de una propuesta de construcción.
El usuario ha solicitado el siguiente cambio o ajuste: "${instruction}"

Aplica el cambio solicitado sobre el texto actual manteniendo el formato profesional, sin añadir saludos ni despedidas innecesarias. 
Devuelve ÚNICAMENTE el nuevo texto modificado. Elimina cualquier guión "---" al inicio o al final del texto.

--- TEXTO ACTUAL ---
${currentText}
--- FIN DEL TEXTO ACTUAL ---`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    return {
      success: true,
      modifiedText: responseText
    };
  } catch (error: any) {
    return { success: false, error: `Error al modificar propuesta: ${error.message}` };
  }
}

import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  getUserAIContext,
  generateSystemPrompt,
} from "@/lib/ai-context-service";

// Limites de messages par plan
const MESSAGE_LIMITS = {
  FREE: 5,
  PREMIUM: 50,
  SUPER_ADMIN: 999999,
  ILLIMITE: 999999,
  CUSTOM: 100,
};

/**
 * POST /api/ai/chat
 * Route pour le chatbot IA avec streaming
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier que la clé API Anthropic est configurée
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Configuration manquante",
          message:
            "La clé API Anthropic n'est pas configurée. Ajoutez ANTHROPIC_API_KEY dans votre fichier .env.local",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new Response("Non autorisé", { status: 401 });
    }

    // Récupérer le body
    const {
      messages,
      conversationId,
    }: { messages: UIMessage[]; conversationId?: string } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages invalides ou vides" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer l'utilisateur avec son plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { Organization: true },
    });

    if (!user?.Organization) {
      return new Response("Organisation non trouvée", { status: 404 });
    }

    // Vérifier les limites de messages
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const usage = await prisma.chatUsage.findUnique({
      where: {
        userId_year_month: {
          userId: user.id,
          year: currentYear,
          month: currentMonth,
        },
      },
    });

    const planType = (user.planType || "FREE") as keyof typeof MESSAGE_LIMITS;
    const limit = MESSAGE_LIMITS[planType] || MESSAGE_LIMITS.FREE;
    const currentUsage = usage?.messageCount || 0;

    if (currentUsage >= limit) {
      return new Response(
        JSON.stringify({
          error: "Limite de messages atteinte",
          limit,
          current: currentUsage,
          message: `Vous avez atteint la limite de ${limit} messages pour votre plan ${planType}. Passez à un plan supérieur pour continuer.`,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le contexte métier de l'utilisateur
    const context = await getUserAIContext(user.id);
    let systemPrompt = generateSystemPrompt(context);

    // Nettoyer le prompt système des caractères Unicode problématiques
    systemPrompt = systemPrompt.replace(/[\uD800-\uDFFF]/g, "");

    // Gérer la conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      if (!conversation || conversation.userId !== user.id) {
        return new Response("Conversation non trouvée", { status: 404 });
      }
    } else {
      // Créer une nouvelle conversation
      // Extraire le texte du premier message (format UIMessage avec parts)
      let firstMessageText =
        messages[0]?.parts
          ?.filter((part) => part.type === "text")
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("")
          .substring(0, 50) || "Nouvelle conversation";

      // Nettoyer les emojis et caractères Unicode problématiques
      firstMessageText =
        firstMessageText.replace(/[\uD800-\uDFFF]/g, "").trim() ||
        "Nouvelle conversation";

      conversation = await prisma.chatConversation.create({
        data: {
          userId: user.id,
          organizationId: user.Organization.id,
          title: firstMessageText,
        },
      });
    }

    // Nettoyer les messages des caractères Unicode problématiques
    const cleanedMessages = messages.map((msg) => ({
      ...msg,
      parts: msg.parts?.map((part) => {
        if (part.type === "text") {
          return {
            ...part,
            text: part.text.replace(/[\uD800-\uDFFF]/g, ""),
          };
        }
        return part;
      }),
    }));

    // Préparer les messages pour l'IA
    const modelMessages = convertToModelMessages(cleanedMessages);

    // Appeler Claude avec streaming
    const result = await streamText({
      model: anthropic("claude-sonnet-4-5"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.7,
      async onFinish({ text, usage }) {
        // Sauvegarder les messages dans la DB
        const userMessage = messages[messages.length - 1];

        // Extraire le texte du message utilisateur (format UIMessage avec parts)
        let userMessageText =
          userMessage?.parts
            ?.filter((part) => part.type === "text")
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("") || "";

        // Nettoyer les caractères Unicode problématiques
        userMessageText = userMessageText.replace(/[\uD800-\uDFFF]/g, "");
        const cleanedAssistantText = text.replace(/[\uD800-\uDFFF]/g, "");

        await prisma.chatMessage.createMany({
          data: [
            {
              conversationId: conversation.id,
              role: "USER",
              content: userMessageText,
              tokens: usage.inputTokens || 0,
            },
            {
              conversationId: conversation.id,
              role: "ASSISTANT",
              content: cleanedAssistantText,
              tokens: usage.outputTokens || 0,
              cost: calculateCost(
                usage.inputTokens || 0,
                usage.outputTokens || 0
              ),
            },
          ],
        });

        // Mettre à jour l'usage
        await prisma.chatUsage.upsert({
          where: {
            userId_year_month: {
              userId: user.id,
              year: currentYear,
              month: currentMonth,
            },
          },
          create: {
            userId: user.id,
            organizationId: user.Organization?.id || "",
            year: currentYear,
            month: currentMonth,
            messageCount: 1,
            totalTokens: usage.totalTokens || 0,
            totalCost: calculateCost(
              usage.inputTokens || 0,
              usage.outputTokens || 0
            ),
          },
          update: {
            messageCount: { increment: 1 },
            totalTokens: { increment: usage.totalTokens || 0 },
            totalCost: {
              increment: calculateCost(
                usage.inputTokens || 0,
                usage.outputTokens || 0
              ),
            },
          },
        });

        // Mettre à jour la conversation
        await prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Conversation-Id": conversation.id,
        "X-Messages-Remaining": String(limit - currentUsage - 1),
      },
    });
  } catch (error) {
    console.error("Erreur chat IA:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * GET /api/ai/chat - Récupérer l'historique des conversations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new Response("Non autorisé", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Récupérer une conversation spécifique
      const conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });

      if (!conversation || conversation.userId !== session.user.id) {
        return new Response("Conversation non trouvée", { status: 404 });
      }

      return Response.json(conversation);
    } else {
      // Récupérer toutes les conversations de l'utilisateur
      const conversations = await prisma.chatConversation.findMany({
        where: { userId: session.user.id },
        orderBy: { lastMessageAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          createdAt: true,
          lastMessageAt: true,
          _count: {
            select: { messages: true },
          },
        },
      });

      return Response.json({ conversations });
    }
  } catch (error) {
    console.error("Erreur récupération conversations:", error);
    return new Response("Erreur interne", { status: 500 });
  }
}

/**
 * Calculer le coût d'un appel à Claude 3.5 Sonnet
 */
function calculateCost(promptTokens: number, completionTokens: number): number {
  const PROMPT_COST_PER_1K = 0.003; // $0.003 / 1K tokens
  const COMPLETION_COST_PER_1K = 0.015; // $0.015 / 1K tokens

  const promptCost = (promptTokens / 1000) * PROMPT_COST_PER_1K;
  const completionCost = (completionTokens / 1000) * COMPLETION_COST_PER_1K;

  return promptCost + completionCost;
}

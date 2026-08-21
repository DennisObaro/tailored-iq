import type { Brief, Opportunity, Project } from "@/lib/types";
import { simulateNetwork, simulateGeneration, ApiError } from "./client";
import { db } from "./_db";
import { id } from "@/lib/utils/id";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/ai-sim/chat-responder";
import { generateBrief } from "@/lib/ai-sim/brief-generator";
import { categorizeBrief } from "@/lib/ai-sim/categorizer";
import { getExpertAccess } from "@/lib/utils/expert-access";

/**
 * Direct intake: an expert completing a client's brief on their behalf.
 *
 * The client skipped the diagnosis chat and booked this expert directly, so
 * the expert runs the same five questions the chatbot would have asked and
 * captures the answers. What comes out the other end is an ordinary
 * confirmed Brief — the project rejoins the normal pipeline at `analysing`
 * with nothing downstream needing to know it arrived this way.
 */

export interface IntakeSession {
  opportunity: Opportunity;
  project: Project;
  questions: string[];
  /** Index-aligned to `questions`; empty strings for anything unanswered. */
  answers: string[];
  submitted: boolean;
}

function blankAnswers(existing?: string[]): string[] {
  return DIAGNOSTIC_QUESTIONS.map((_, i) => existing?.[i] ?? "");
}

export async function getIntakeSession(
  opportunityId: string,
  expertId: string,
): Promise<IntakeSession | null> {
  return simulateNetwork(
    () => {
      const d = db.get();
      const opportunity = d.opportunities.find((o) => o.id === opportunityId);
      if (!opportunity || opportunity.kind !== "direct_intake") return null;
      /** Somebody else's intake is nobody's business, same as any other read. */
      if (opportunity.expertId !== expertId) return null;

      const project = d.projects.find((p) => p.id === opportunity.projectId);
      if (!project) return null;

      return {
        opportunity,
        project,
        questions: DIAGNOSTIC_QUESTIONS,
        answers: blankAnswers(opportunity.intakeAnswers),
        submitted: Boolean(project.briefId),
      };
    },
    { latency: [120, 260] },
  );
}

/** Partial save — the expert is mid-call and shouldn't lose what they've typed. */
export async function saveIntakeAnswers(
  opportunityId: string,
  expertId: string,
  answers: string[],
): Promise<Opportunity> {
  return simulateNetwork(
    () =>
      db.update((d) => {
        const opportunity = d.opportunities.find((o) => o.id === opportunityId);
        if (!opportunity || opportunity.kind !== "direct_intake") {
          throw new ApiError("Intake not found.", "NOT_FOUND");
        }
        if (opportunity.expertId !== expertId) throw new ApiError("This isn't your intake.", "FORBIDDEN");

        opportunity.intakeAnswers = blankAnswers(answers);
        return opportunity;
      }),
    { latency: [120, 250] },
  );
}

/**
 * Turns the captured answers into the official brief.
 *
 * The answers are replayed into the project's conversation as a real
 * exchange first, then handed to the same `generateBrief` the chat flow
 * uses. Doing it that way rather than writing Brief fields directly means
 * there is exactly one place that decides how answers become a brief, and
 * the client can still open the conversation and see what was captured.
 */
export async function submitIntakeBrief(opportunityId: string, expertId: string): Promise<Brief> {
  return simulateGeneration(() =>
    db.update((d) => {
      const opportunity = d.opportunities.find((o) => o.id === opportunityId);
      if (!opportunity || opportunity.kind !== "direct_intake") {
        throw new ApiError("Intake not found.", "NOT_FOUND");
      }
      if (opportunity.expertId !== expertId) throw new ApiError("This isn't your intake.", "FORBIDDEN");

      const profile = d.expertProfiles.find((p) => p.userId === expertId);
      const access = getExpertAccess(profile);
      if (!access.canViewClientDetail) {
        throw new ApiError(access.reason ?? "You can't complete a client brief yet.", "NOT_APPROVED");
      }

      const project = d.projects.find((p) => p.id === opportunity.projectId);
      if (!project) throw new ApiError("Project not found.", "NOT_FOUND");
      if (project.briefId) throw new ApiError("This brief has already been submitted.", "INVALID_STATE");

      const answers = blankAnswers(opportunity.intakeAnswers);
      if (answers.some((a) => !a.trim())) {
        throw new ApiError("Answer every question before submitting the brief.", "VALIDATION");
      }

      const conversation = d.conversations.find((c) => c.id === project.conversationId);
      if (!conversation) throw new ApiError("Conversation not found.", "NOT_FOUND");

      const now = new Date().toISOString();
      DIAGNOSTIC_QUESTIONS.forEach((question, i) => {
        conversation.messages.push({ id: id("msg"), role: "ai", content: question, createdAt: now });
        conversation.messages.push({ id: id("msg"), role: "user", content: answers[i], createdAt: now });
      });
      conversation.turnCount = DIAGNOSTIC_QUESTIONS.length;
      conversation.status = "complete";
      conversation.endedAt = now;

      const generated = generateBrief(conversation, project.id);
      const { category, secondaryCategories } = categorizeBrief(generated);

      /**
       * Confirmed on creation, unlike the chat flow where the client reviews
       * the draft first. Here the review already happened — it was the
       * conversation, with the expert reading it back to them.
       */
      const brief: Brief = {
        ...generated,
        id: id("brief"),
        category,
        secondaryCategories,
        confirmed: true,
        createdAt: now,
        updatedAt: now,
      };
      d.briefs.push(brief);

      project.briefId = brief.id;
      project.category = category;
      project.status = "analysing";
      project.updatedAt = now;
      project.activity.push({ id: id("act"), label: "Brief completed with an expert", timestamp: now });

      d.notifications.unshift({
        id: id("notif"),
        userId: project.clientId,
        type: "brief_ready",
        title: "Your brief is ready",
        body: `We've captured "${project.title}" from your call. We're working on it now.`,
        linkHref: `/projects/${project.id}`,
        read: false,
        createdAt: now,
      });

      return brief;
    }),
  );
}

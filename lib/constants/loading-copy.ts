export const LOADING_COPY = {
  brief: ["Understanding your challenge..."],
  categorizing: ["Identifying the key decisions..."],
  report: ["Finding relevant experience...", "Preparing your executive summary..."],
  matching: ["Finding relevant experience..."],
  /** The client isn't waiting on generation any more, only on the request reaching an expert. */
  playbook: ["Sending your request to an expert..."],
} as const;

export const CHAT_THINKING_COPY = "Understanding your challenge...";

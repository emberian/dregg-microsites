"use strict";

// An explanatory finite case table, not a reimplementation of fn's state machine.
// All substantive evidence lives in the linked, revision-pinned source notebook.
const cuts = {
  staged: {
    sender: "No acceptance acknowledgment",
    store: "No committed article from this attempt",
    action: "Retry / reconcile the same work",
    explanation: "At this stipulated cut, staging occurred but publication did not. Recovery must not invent a committed article from that staging alone. The disconnected sender cannot observe this internal cut and must not infer refusal from silence."
  },
  uncertain: {
    sender: "Uncertain",
    store: "Either permitted outcome; recovery decides",
    action: "Fence mutations, recover, then reconcile",
    explanation: "The publication operation may have taken effect, but its result is ambiguous. A recovered committed article may exist or be absent. Continuing as though the write definitely failed could violate the existing history."
  },
  durable: {
    sender: "Uncertain",
    store: "Retain the committed article",
    action: "Recover / reconcile; retry the same work",
    explanation: "The server completed the durable commit, but the reply never arrived. The sender's uncertainty does not cancel the server's obligation. Retrying must preserve the existing binding."
  },
  received: {
    sender: "Accepted",
    store: "Retain until an authorized release",
    action: "Preserve the obligation across recovery",
    explanation: "The sender received the acceptance acknowledgment. Under the persistence contract, the article must survive permitted crashes. This says nothing about a human reading it or a remote peer accepting it."
  }
};

document.querySelectorAll("[data-cut]").forEach(button => {
  button.addEventListener("click", () => {
    const chosen = cuts[button.dataset.cut];
    if (!chosen) return;
    document.querySelectorAll("[data-cut]").forEach(other => {
      other.setAttribute("aria-pressed", String(other === button));
    });
    document.getElementById("sender-state").textContent = chosen.sender;
    document.getElementById("store-state").textContent = chosen.store;
    document.getElementById("next-action").textContent = chosen.action;
    document.getElementById("cut-explanation").textContent = chosen.explanation;
  });
});

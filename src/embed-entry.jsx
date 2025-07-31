if (typeof window.process === "undefined") {
  window.process = { env: { NODE_ENV: "production" } };
}

import React from "react";
import { createRoot } from "react-dom/client";
import ChatBot from "./components/chatbot.jsx"; // adjust if casing differs

// --- CONFIG / GA4 ---
const MEASUREMENT_ID = window.ChatbotConfig?.measurementId || "G-38W0E7RZC4";
const clientId =
  window.ChatbotConfig?.client ||
  document.querySelector("[data-client]")?.getAttribute("data-client") ||
  "unknown_client";
const widgetVersion = window.ChatbotConfig?.widget_version || "1.0.0";

// GA4 bootstrap
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;

const loadGtag = () => {
  if (window.__GA_LOADED__) return;
  window.__GA_LOADED__ = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, {
    send_page_view: false,
  });
};
loadGtag();

function trackEvent(name, params = {}) {
  if (window.gtag) {
    window.gtag("event", name, {
      client_embed: clientId,
      widget_version: widgetVersion,
      session_id:
        window.__CHATBOT_SESSION_ID__ ||
        (window.__CHATBOT_SESSION_ID__ =
          "s_" + Math.random().toString(36).slice(2, 9)),
      ...params,
    });
  }
}

// expose for ChatBot.jsx if it uses window.trackChatbot
window.trackChatbot = trackEvent;

// initial load
trackEvent("chatbot_loaded");

// === MOUNT CHATBOT ===
const host = document.createElement("div");
host.id = "embedded-chatbot-host";
document.body.appendChild(host);

// optional: isolation via shadow DOM (still allows inline styles to work)
const shadow = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
const container = document.createElement("div");
container.id = "chatbot-root";
shadow.appendChild(container);

// render
createRoot(container).render(<ChatBot />);

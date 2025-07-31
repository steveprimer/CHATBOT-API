import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import axios from "axios";
import { MdArrowBackIosNew } from "react-icons/md";
import { FaRegMessage, FaUser } from "react-icons/fa6";

// === analytics helper ===
function trackEvent(name, params = {}) {
  if (window.gtag) {
    window.gtag("event", name, {
      client_embed: window.ChatbotConfig?.client || "self_hosted",
      widget_version: window.ChatbotConfig?.widget_version || "dev",
      session_id:
        window.__CHATBOT_SESSION_ID__ ||
        (window.__CHATBOT_SESSION_ID__ =
          "s_" + Math.random().toString(36).slice(2, 9)),
      ...params,
    });
  }
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false); // Chat window toggle
  const [input, setInput] = useState(""); // User input field
  const [chat, setChat] = useState([]); // Chat history (display)
  const [messages, setMessages] = useState([]); // Chat history (for backend)
  const [isTyping, setIsTyping] = useState(false); // Bot typing animation
  const [showPopup, setShowPopup] = useState(false); // AI popup trigger
  const chatEndRef = useRef(null); // Ref to scroll chat to bottom
  const isMobile = window.innerWidth <= 480;
  const chatHeight = isMobile ? "75vh" : "500px";
  const chatWidth = isMobile ? "85vw" : "320px";
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasGreeted, setHasGreeted] = useState(false);

  // track when widget opens and when it closes (send conversation length)
  useEffect(() => {
    if (isOpen) {
      trackEvent("chat_opened");
    } else {
      // on close, record how long the conversation was (message count)
      trackEvent("conversation_length", { total_messages: messages.length });
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim() !== "") {
      handleSend(); // call your send function
    }
  };

  const storeInfo = `
      Return Policy: You can return products within 7 days of delivery.
      Shipping: We offer free shipping on all orders above ₹999.
      Product Info: All our skincare products are vegan and cruelty-free.
      `;

  // Show popup after 8 seconds
  useEffect(() => {
    if (isOpen) {
      setShowPopup(false);
      return; // don’t schedule the teaser when chat is already open
    }

    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowPopup(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    trackEvent("chatbot_loaded");
  }, []);

  useEffect(() => {
    if (isOpen && !hasGreeted && !showWelcome) {
      setIsTyping(true);
      const welcomeText =
        "Hi there! 👋 I'm your AI assistant. Feel free to ask me anything about our products, shipping, or return policies!";

      setTimeout(() => {
        const botMessage = { sender: "Bot", text: welcomeText };
        setChat([botMessage]);
        setMessages([{ role: "assistant", content: welcomeText }]);
        setIsTyping(false);
        setHasGreeted(true);
      }, 1200);
    }
  }, [isOpen, showWelcome, hasGreeted]);

  // Handle sending user message
  const handleSend = async (customInput) => {
    const messageToSend = customInput || input;
    if (!messageToSend.trim()) return;

    trackEvent("message_sent", { message_length: messageToSend.length });

    const userMessage = { sender: "You", text: messageToSend };
    const newMessages = [...messages, { role: "user", content: messageToSend }];

    setChat([...chat, userMessage]);
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        messages: newMessages,
        storeInfo,
      });

      const botText = res.data.reply;

      trackEvent("message_received", { reply_length: botText.length });

      const botMessage = { sender: "Bot", text: botText };
      setChat((prev) => [...prev, botMessage]);
      setMessages((prev) => [...prev, { role: "assistant", content: botText }]);
    } catch (err) {
      console.error(err);
      setChat((prev) => [
        ...prev,
        { sender: "Bot", text: "That was unexpected." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Typing indicator style
  const waveDotStyle = {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#C4008F", // Match brand color
    display: "inline-block",
    animation: "wave 1.2s infinite ease-in-out",
  };

  const handleSuggestedMessage = (msg) => {
    setChat((prev) => [...prev, { sender: "You", text: msg }]);

    trackEvent("suggested_message_clicked", { suggestion: msg });

    handleSend(msg); // Call your existing message send function
  };

  return (
    <>
      {/* Typing Animation Keyframes */}
      <style>
        {`
    @keyframes wave {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-8px);
      }
    }
  `}
      </style>

      {/* Popup Chat Teaser */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            right: "20px",
            backgroundColor: "#fff7ca",
            padding: "12px 16px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            maxWidth: "260px",
            fontSize: "14px",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            lineHeight: 1.2,
            color: "#1f1f1f",
            cursor: "default",
          }}
        >
          <p style={{ margin: 0 }}>
            Chat with our AI assistant for instant help!
          </p>
          <button
            onClick={() => {
              setShowPopup(false);
              setIsOpen(true);
            }}
            style={{
              alignSelf: "flex-start",
              backgroundColor: "transparent",
              border: "none",
              padding: 0,
              color: "#fd1616ff",
              fontSize: "13px",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Open Chat
          </button>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setShowPopup(false);
        }}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#fff7caff",
          color: "#fff",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ position: "relative", width: "28px", height: "28px" }}>
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C4008F",
              fontSize: "28px",
              opacity: isOpen ? 1 : 0,
              transition: "opacity 0.3s ease, transform 0.3s ease",
              transform: isOpen ? "scale(1)" : "scale(0.8)",
            }}
          >
            ✖
          </span>
          <FaRegMessage
            size={28}
            color="#C4008F"
            style={{
              position: "absolute",
              inset: 0,
              stroke: "#C4008F",
              strokeWidth: 25,
              opacity: isOpen ? 0 : 1,
              transform: isOpen ? "scale(0.5)" : "scale(1)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
              // filter: "drop-shadow(0 0 4px #C4008F)"
            }}
          />
        </div>
      </div>

      {/* Background Blur Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)} // optional: clicking outside closes chat
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            backgroundColor: "rgba(0, 0, 0, 0.2)", // optional darken
            zIndex: 9997, // just below chat window (9998)
            transition: "all 0.3s ease",
          }}
        />
      )}

      {/* Chat Window */}
      <div
        style={{
          position: "fixed",
          bottom: "90px",
          right: "2%",
          width: chatWidth,
          height: isOpen ? chatHeight : "0px",
          background: "linear-gradient(145deg, #58002aff, #1a1a1a)",
          color: "#f2f2f2",
          border: "1.5px solid #C4008F",
          borderRadius: "15px",
          padding: isOpen ? "1rem 1rem 0.3rem" : "0 1rem",
          zIndex: 9998,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 12px rgba(196, 0, 143, 0.5)",
          overflow: "hidden",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.3s ease",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {!showWelcome && (
          <div
            onClick={() => setShowWelcome(true)}
            style={{
              position: "absolute",
              top: "27px", // ⬅️ Increased from 12px
              left: "12px",
              cursor: "pointer",
              fontSize: "18px",
              color: "#fff",
            }}
            title="Back"
          >
            <MdArrowBackIosNew />
          </div>
        )}

        {/* Chat Messages */}
        {showWelcome ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              padding: "1rem",
              gap: "0.75rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "30px", color: "#fff" }}>
              How can we help you today?
            </h3>
            <p style={{ fontSize: "14px", color: "#ccc" }}>
              Let us know if you have any questions.
            </p>
            <button
              onClick={() => setShowWelcome(false)}
              style={{
                backgroundColor: "#C4008F",
                color: "#fff",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              Chat with us
            </button>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <style>
              {`
    .chatbot-badge {
      will-change: transform, opacity;
      backface-visibility: hidden;
    }
  `}
            </style>

            <AnimatePresence>
              {isOpen && !showWelcome && (
                <motion.div
                  className={"chatbot-badge"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
                  style={{
                    alignSelf: "center",
                    backgroundColor: "#C4008F",
                    padding: "10px 24px",
                    borderRadius: "999px",
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    marginBottom: "14px",
                    zIndex: 9999,
                  }}
                >
                  AI Support
                </motion.div>
              )}
            </AnimatePresence>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                marginBottom: "0.5rem",
                padding: "0.5rem",
                borderRadius: "6px",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                boxShadow: "0 0   8px rgba(0, 0, 0, 0.1)",
              }}
            >
              {chat.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={
                    msg.sender === "Bot"
                      ? { y: 30, scale: 0.8, opacity: 0 }
                      : false
                  }
                  animate={
                    msg.sender === "Bot"
                      ? { y: 0, scale: 1, opacity: 1 }
                      : false
                  }
                  transition={
                    msg.sender === "Bot"
                      ? {
                          duration: 0.5,
                          ease: [0.25, 0.8, 0.25, 1], // custom ease-in-out, techy feel
                        }
                      : {}
                  }
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.sender === "You" ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    marginBottom: "12px",
                  }}
                >
                  {/* Avatar for Bot */}
                  {msg.sender !== "You" && (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: "#C4008F",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "8px",
                      }}
                    >
                      <FaRegMessage color="#fff" size={16} />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    style={{
                      backgroundColor:
                        msg.sender === "You" ? "#C4008F" : "#2C2C2E",
                      color: "#fff",
                      padding: "10px 14px",
                      borderRadius: "16px",
                      maxWidth: "75%",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Avatar for User */}
                  {msg.sender === "You" && (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: "#C4008F",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: "8px",
                      }}
                    >
                      <FaUser color="#fff" size={16} />
                    </div>
                  )}
                </motion.div>
              ))}

              <div ref={chatEndRef} />
              {/* Typing Animation */}
              {isTyping && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-end",
                    marginBottom: "12px",
                  }}
                >
                  {/* Avatar Icon */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: "#C4008F",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "8px",
                    }}
                  >
                    <FaRegMessage color="#fff" size={16} />
                  </div>

                  {/* Typing Bubble with Wave Animation */}
                  <div
                    style={{
                      backgroundColor: "#2C2C2E",
                      padding: "10px 14px",
                      borderRadius: "16px",
                      display: "flex",
                      gap: "4px",
                    }}
                  >
                    <div style={{ ...waveDotStyle, animationDelay: "0s" }} />
                    <div style={{ ...waveDotStyle, animationDelay: "0.2s" }} />
                    <div style={{ ...waveDotStyle, animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
              {/* Suggested Questions */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                {[
                  "Where is my order?",
                  "What’s your return policy?",
                  "How long is shipping?",
                  "Do you ship internationally?",
                ].map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSend(q)}
                    style={{
                      backgroundColor: "#fff7ca",
                      color: "#000",
                      padding: "6px 10px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                      transition: "background 0.3s",
                    }}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            {/* Message Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                style={{
                  flex: 1, // allows the input to grow
                  padding: "0.5rem 0.75rem",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  backgroundColor: "#2C2C2E",
                  color: "#fff",
                  minWidth: 0, // important for flex shrinking!
                }}
              />
              <button
                onClick={() => handleSend(input)}
                style={{
                  backgroundColor: "#C4008F",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "16px",
                  flexShrink: 0, // prevents it from shrinking or wrapping
                }}
              >
                ➤
              </button>
            </div>
          </>
        )}
        <p
          style={{
            fontSize: "10px",
            color: "#ffffffff",
            textAlign: "center",
            marginTop: "0.2rem",
          }}
        >
          Powered by{" "}
          <a
            href="https://scalebridge.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "#6884ffff" }}
          >
            ScaleBridge
          </a>
        </p>
      </div>
    </>
  );
}

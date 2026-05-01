import { useEffect, useState } from "react";
import { socket } from "../socket";

function Chat({ user }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    function handleChatMessage(messageData) {
      setMessages((prev) => [...prev, messageData]);
    }

    function handleChatHistory(history) {
      setMessages(history);
    }

    socket.on("chat-message", handleChatMessage);
    socket.on("chat-history", handleChatHistory);

    return () => {
      socket.off("chat-message", handleChatMessage);
      socket.off("chat-history", handleChatHistory);
    };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    socket.emit("chat-message", {
      roomId: user.roomId,
      username: user.username,
      text: message,
    });

    setMessage("");
  }

  return (
    <div className="chat-card">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Room channel</p>
          <h3>Team chat</h3>
        </div>
      </div>

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <strong>No messages yet</strong>
            <span>Start the conversation for this board.</span>
          </div>
        ) : (
          messages.map((msg, index) => (
            <article
              className={`message ${msg.username === user.username ? "own" : ""}`}
              key={`${msg.username}-${msg.time}-${index}`}
            >
              <div className="message-meta">
                <strong>{msg.username}</strong>
                <span>{msg.time}</span>
              </div>
              <p>{msg.text}</p>
            </article>
          ))
        )}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={`Message as ${user.username}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;

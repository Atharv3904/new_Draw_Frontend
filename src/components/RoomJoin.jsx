import { useState } from "react";
import { socket } from "../socket";

function RoomJoin({ onJoin }) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !roomId.trim()) {
      alert("Please enter username and room ID");
      return;
    }

    socket.emit("join-room", {
      username,
      roomId,
    });

    onJoin({
      username,
      roomId,
    });
  }

  return (
    <main className="auth-layout">
      <section className="auth-hero">
        <p className="eyebrow">Real-time drawing</p>
        <h1>Turn rough ideas into shared visual plans.</h1>
        <p>
          Join a live board, sketch with your team, erase mistakes, clear the
          canvas, and keep chat beside your work.
        </p>
      </section>

      <section className="auth-card">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Workspace access</p>
            <h2>Join whiteboard</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Your name
            <input
              type="text"
              placeholder="Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Room ID
            <input
              type="text"
              placeholder="Example: 1234"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </label>

          <button className="primary-button" type="submit">
            Join room
          </button>
        </form>
      </section>
    </main>
  );
}

export default RoomJoin;

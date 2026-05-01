import { useEffect, useState } from "react";
import RoomJoin from "./components/RoomJoin";
import Toolbar from "./components/Toolbar";
import Whiteboard from "./components/Whiteboard";
import Chat from "./components/Chat";
import { socket } from "./socket";

function App() {
  const [user, setUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [tool, setTool] = useState("pen");
  const [shapeType, setShapeType] = useState("rectangle");
  const [color, setColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);
  const [textStyle, setTextStyle] = useState({
    fontFamily: "Inter",
    fontSize: 24,
    bold: false,
    italic: false,
    underline: false,
    align: "left",
    color: "#111827",
  });
  const [clearCounter, setClearCounter] = useState(0);

  function handleClear() {
    setClearCounter((prev) => prev + 1);

    if (user) {
      socket.emit("clear-canvas", user.roomId);
    }
  }

  useEffect(() => {
    socket.on("room-users", (data) => {
      setParticipants(data.users);
    });

    return () => {
      socket.off("room-users");
    };
  }, []);

  return (
    <div className="app-shell">
      {!user ? (
        <RoomJoin onJoin={setUser} />
      ) : (
        <div className="dashboard">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">DW</div>
              <div>
                <p className="eyebrow">Collaborative workspace</p>
                <h1>DrawSync</h1>
              </div>
            </div>

            <nav className="nav-links" aria-label="Main navigation">
              <a href="#board">Board</a>
              <a href="#team">Team</a>
              <a href="#chat">Chat</a>
            </nav>

            <div className="user-pill">
              <span className="status-dot" />
              {user.username}
            </div>
          </header>

          <section className="session-header">
            <div>
              <p className="eyebrow">Live room</p>
              <h2>Room {user.roomId}</h2>
              <p className="muted">Sketch, erase, clear, and chat with everyone in this room.</p>
            </div>
            <div className="metric-card">
              <span>{participants.length}</span>
              <p>online</p>
            </div>
          </section>

          <Toolbar
            tool={tool}
            setTool={setTool}
            shapeType={shapeType}
            setShapeType={setShapeType}
            color={color}
            setColor={setColor}
            fillColor={fillColor}
            setFillColor={setFillColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            textStyle={textStyle}
            setTextStyle={setTextStyle}
            onClear={handleClear}
          />

          <main className="workspace">
            <section className="board-panel" id="board">
              <Whiteboard
                user={user}
                tool={tool}
                shapeType={shapeType}
                color={color}
                fillColor={fillColor}
                brushSize={brushSize}
                textStyle={textStyle}
                clearCounter={clearCounter}
              />
            </section>

            <aside className="side-panel">
              <section className="participants-card" id="team">
                <div className="panel-title">
                  <div>
                    <p className="eyebrow">Team</p>
                    <h3>Participants</h3>
                  </div>
                  <span className="count-badge">{participants.length}</span>
                </div>

                {participants.length === 0 ? (
                  <div className="empty-state">
                    <strong>No teammates yet</strong>
                    <span>Share the room ID to invite collaborators.</span>
                  </div>
                ) : (
                  <ul className="participants-list">
                    {participants.map((name) => (
                      <li key={name}>
                        <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section id="chat">
                <Chat user={user} />
              </section>
            </aside>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;

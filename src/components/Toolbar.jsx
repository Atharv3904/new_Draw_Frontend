function Toolbar({
  tool,
  setTool,
  shapeType,
  setShapeType,
  color,
  setColor,
  fillColor,
  setFillColor,
  brushSize,
  setBrushSize,
  textStyle,
  setTextStyle,
  onClear,
}) {
  const tools = [
    { id: "select", icon: "↖", label: "Select" },
    { id: "pen", icon: "✎", label: "Pen" },
    { id: "eraser", icon: "⌫", label: "Eraser" },
    { id: "shape", icon: "▢", label: "Shape" },
    { id: "text", icon: "T", label: "Text" },
  ];

  const updateTextStyle = (key, value) => {
    setTextStyle((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="toolbar" aria-label="Drawing tools">
      <div className="tool-group">
        {tools.map((item) => (
          <button
            className={`tool-button ${tool === item.id ? "active" : ""}`}
            type="button"
            key={item.id}
            title={item.label}
            onClick={() => setTool(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <button className="danger-button" type="button" onClick={onClear}>
          Clear
        </button>
      </div>

      <div className="control-strip">
        {tool === "shape" && (
          <label className="select-control">
            <span>Shape</span>
            <select value={shapeType} onChange={(e) => setShapeType(e.target.value)}>
              <option value="rectangle">Rectangle</option>
              <option value="square">Square</option>
              <option value="circle">Circle</option>
              <option value="ellipse">Ellipse</option>
              <option value="triangle">Triangle</option>
              <option value="line">Line</option>
              <option value="arrow">Arrow</option>
            </select>
          </label>
        )}

        <label className="color-control">
          <span>Stroke</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>

        {tool === "shape" && (
          <label className="color-control">
            <span>Fill</span>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
            />
          </label>
        )}

        <label className="range-control">
          <span>Stroke {brushSize}px</span>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </label>

        {tool === "text" && (
          <>
            <label className="select-control">
              <span>Font</span>
              <select
                value={textStyle.fontFamily}
                onChange={(e) => updateTextStyle("fontFamily", e.target.value)}
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
              </select>
            </label>

            <label className="number-control">
              <span>Size</span>
              <input
                type="number"
                min="10"
                max="96"
                value={textStyle.fontSize}
                onChange={(e) => updateTextStyle("fontSize", Number(e.target.value))}
              />
            </label>

            <div className="toggle-group">
              <button
                className={textStyle.bold ? "toggle-button active" : "toggle-button"}
                type="button"
                title="Bold"
                onClick={() => updateTextStyle("bold", !textStyle.bold)}
              >
                B
              </button>
              <button
                className={textStyle.italic ? "toggle-button active" : "toggle-button"}
                type="button"
                title="Italic"
                onClick={() => updateTextStyle("italic", !textStyle.italic)}
              >
                I
              </button>
              <button
                className={textStyle.underline ? "toggle-button active" : "toggle-button"}
                type="button"
                title="Underline"
                onClick={() => updateTextStyle("underline", !textStyle.underline)}
              >
                U
              </button>
            </div>

            <label className="select-control compact">
              <span>Align</span>
              <select value={textStyle.align} onChange={(e) => updateTextStyle("align", e.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>

            <label className="color-control">
              <span>Text</span>
              <input
                type="color"
                value={textStyle.color}
                onChange={(e) => updateTextStyle("color", e.target.value)}
              />
            </label>
          </>
        )}
      </div>

    </section>
  );
}

export default Toolbar;

import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 720;
const HANDLE_SIZE = 10;

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeElement(element) {
  if (element.width >= 0 && element.height >= 0) {
    return element;
  }

  return {
    ...element,
    x: element.width < 0 ? element.x + element.width : element.x,
    y: element.height < 0 ? element.y + element.height : element.y,
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };
}

function getElementBounds(element) {
  if (element.type === "path") {
    const xs = element.points.map((point) => point.x);
    const ys = element.points.map((point) => point.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  return {
    x: Math.min(element.x, element.x + element.width),
    y: Math.min(element.y, element.y + element.height),
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };
}

function isInside(element, x, y) {
  const bounds = getElementBounds(element);
  return (
    x >= bounds.x - 8 &&
    x <= bounds.x + bounds.width + 8 &&
    y >= bounds.y - 8 &&
    y <= bounds.y + bounds.height + 8
  );
}

function isOnResizeHandle(element, x, y) {
  const bounds = getElementBounds(element);
  return (
    x >= bounds.x + bounds.width - HANDLE_SIZE &&
    x <= bounds.x + bounds.width + HANDLE_SIZE &&
    y >= bounds.y + bounds.height - HANDLE_SIZE &&
    y <= bounds.y + bounds.height + HANDLE_SIZE
  );
}

function drawArrowHead(ctx, x1, y1, x2, y2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const length = 16;

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - length * Math.cos(angle - Math.PI / 6), y2 - length * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - length * Math.cos(angle + Math.PI / 6), y2 - length * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawElement(ctx, element, isSelected = false) {
  const normalized = normalizeElement(element);
  const bounds = getElementBounds(normalized);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = normalized.stroke || normalized.color || "#111827";
  ctx.fillStyle = normalized.fill || "transparent";
  ctx.lineWidth = normalized.strokeWidth || 2;

  if (normalized.type === "path") {
    ctx.globalCompositeOperation = normalized.mode === "erase" ? "destination-out" : "source-over";
    ctx.strokeStyle = normalized.color;
    ctx.lineWidth = normalized.strokeWidth;
    ctx.beginPath();
    normalized.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  if (["rectangle", "square"].includes(normalized.type)) {
    ctx.beginPath();
    ctx.rect(normalized.x, normalized.y, normalized.width, normalized.height);
    if (normalized.fill && normalized.fill !== "transparent") ctx.fill();
    ctx.stroke();
  }

  if (["circle", "ellipse"].includes(normalized.type)) {
    ctx.beginPath();
    ctx.ellipse(
      normalized.x + normalized.width / 2,
      normalized.y + normalized.height / 2,
      Math.abs(normalized.width / 2),
      Math.abs(normalized.height / 2),
      0,
      0,
      Math.PI * 2,
    );
    if (normalized.fill && normalized.fill !== "transparent") ctx.fill();
    ctx.stroke();
  }

  if (normalized.type === "triangle") {
    ctx.beginPath();
    ctx.moveTo(normalized.x + normalized.width / 2, normalized.y);
    ctx.lineTo(normalized.x + normalized.width, normalized.y + normalized.height);
    ctx.lineTo(normalized.x, normalized.y + normalized.height);
    ctx.closePath();
    if (normalized.fill && normalized.fill !== "transparent") ctx.fill();
    ctx.stroke();
  }

  if (["line", "arrow"].includes(normalized.type)) {
    ctx.beginPath();
    ctx.moveTo(normalized.x, normalized.y);
    ctx.lineTo(normalized.x + normalized.width, normalized.y + normalized.height);
    ctx.stroke();
    if (normalized.type === "arrow") {
      drawArrowHead(ctx, normalized.x, normalized.y, normalized.x + normalized.width, normalized.y + normalized.height);
    }
  }

  if (normalized.type === "text") {
    const weight = normalized.bold ? "700" : "400";
    const italic = normalized.italic ? "italic" : "normal";
    ctx.fillStyle = normalized.color || "#111827";
    ctx.font = `${italic} ${weight} ${normalized.fontSize}px ${normalized.fontFamily}`;
    ctx.textAlign = normalized.align;
    ctx.textBaseline = "top";

    const anchorX =
      normalized.align === "center"
        ? normalized.x + normalized.width / 2
        : normalized.align === "right"
          ? normalized.x + normalized.width
          : normalized.x;

    const lines = String(normalized.text || "").split("\n");
    lines.forEach((line, index) => {
      const y = normalized.y + index * normalized.fontSize * 1.3;
      ctx.fillText(line, anchorX, y);
      if (normalized.underline) {
        const metrics = ctx.measureText(line);
        let startX = anchorX;
        if (normalized.align === "center") startX -= metrics.width / 2;
        if (normalized.align === "right") startX -= metrics.width;
        ctx.beginPath();
        ctx.moveTo(startX, y + normalized.fontSize + 3);
        ctx.lineTo(startX + metrics.width, y + normalized.fontSize + 3);
        ctx.strokeStyle = normalized.color || "#111827";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  if (isSelected && normalized.type !== "path") {
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bounds.x - 6, bounds.y - 6, bounds.width + 12, bounds.height + 12);
    ctx.setLineDash([]);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(bounds.x + bounds.width - HANDLE_SIZE / 2, bounds.y + bounds.height - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }

  ctx.restore();
}

function Whiteboard({ user, tool, shapeType, color, fillColor, brushSize, textStyle, clearCounter }) {
  const canvasRef = useRef(null);
  const textEditorRef = useRef(null);
  const elementsRef = useRef([]);
  const selectedIdRef = useRef(null);
  const actionRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingText, setEditingText] = useState(null);

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function commitElements(nextElements, shouldSync = true) {
    elementsRef.current = nextElements;
    setElements(nextElements);

    if (shouldSync) {
      socket.emit("board-elements", {
        roomId: user.roomId,
        elements: nextElements,
      });
    }
  }

  function updateSelectedElement(updates) {
    if (!selectedIdRef.current) return;

    const nextElements = elementsRef.current.map((element) =>
      element.id === selectedIdRef.current ? { ...element, ...updates } : element,
    );
    commitElements(nextElements);
  }

  useEffect(() => {
    elementsRef.current = elements;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.forEach((element) => drawElement(ctx, element, element.id === selectedId));
  }, [elements, selectedId, editingText?.id]);

  useEffect(() => {
    if (!textEditorRef.current) return;

    const focusTimer = window.setTimeout(() => {
      textEditorRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [editingText?.id]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    commitElements([], true);
    setSelectedId(null);
    setEditingText(null);
  }, [clearCounter]);

  useEffect(() => {
    function handleRemoteClear() {
      commitElements([], false);
      setSelectedId(null);
      setEditingText(null);
    }

    function handleRemoteElements(remoteElements) {
      commitElements(remoteElements, false);
      setSelectedId(null);
      setEditingText(null);
    }

    socket.on("clear-canvas", handleRemoteClear);
    socket.on("board-elements", handleRemoteElements);

    return () => {
      socket.off("clear-canvas", handleRemoteClear);
      socket.off("board-elements", handleRemoteElements);
    };
  }, []);

  useEffect(() => {
    if (!selectedIdRef.current) return;
    const selected = elementsRef.current.find((element) => element.id === selectedIdRef.current);
    if (!selected) return;

    if (selected.type === "text") {
      updateSelectedElement(textStyle);
      return;
    }

    if (selected.type !== "path") {
      updateSelectedElement({
        stroke: color,
        fill: fillColor,
        strokeWidth: brushSize,
      });
    }
  }, [color, fillColor, brushSize, textStyle]);

  function selectElementAt(point) {
    for (let index = elementsRef.current.length - 1; index >= 0; index -= 1) {
      const element = elementsRef.current[index];
      if (element.type !== "path" && isInside(element, point.x, point.y)) {
        return element;
      }
    }

    return null;
  }

  function handlePointerDown(event) {
    const point = getCanvasPoint(event);

    if (tool === "pen" || tool === "eraser") {
      const path = {
        id: createId(),
        type: "path",
        mode: tool === "eraser" ? "erase" : "draw",
        color,
        strokeWidth: tool === "eraser" ? Math.max(brushSize * 2, 18) : brushSize,
        points: [point],
      };
      actionRef.current = { type: "path", id: path.id };
      commitElements([...elementsRef.current, path]);
      return;
    }

    if (tool === "shape") {
      const sizeLocked = shapeType === "square" || shapeType === "circle";
      const element = {
        id: createId(),
        type: shapeType,
        x: point.x,
        y: point.y,
        width: 1,
        height: 1,
        stroke: color,
        fill: fillColor,
        strokeWidth: brushSize,
      };
      actionRef.current = { type: "create", id: element.id, start: point, sizeLocked };
      setSelectedId(element.id);
      commitElements([...elementsRef.current, element]);
      return;
    }

    if (tool === "text") {
      const element = {
        id: createId(),
        type: "text",
        x: point.x,
        y: point.y,
        width: 260,
        height: Math.max(textStyle.fontSize * 1.5, 48),
        text: "",
        ...textStyle,
      };
      setSelectedId(element.id);
      commitElements([...elementsRef.current, element]);
      setEditingText({ ...element, text: "" });
      return;
    }

    const hitElement = selectElementAt(point);
    if (!hitElement) {
      setSelectedId(null);
      return;
    }

    setSelectedId(hitElement.id);
    if (isOnResizeHandle(hitElement, point.x, point.y)) {
      actionRef.current = { type: "resize", id: hitElement.id, start: point, original: hitElement };
    } else {
      actionRef.current = { type: "drag", id: hitElement.id, start: point, original: hitElement };
    }
  }

  function handlePointerMove(event) {
    if (!actionRef.current) return;
    const point = getCanvasPoint(event);
    const action = actionRef.current;

    if (action.type === "path") {
      const nextElements = elementsRef.current.map((element) =>
        element.id === action.id ? { ...element, points: [...element.points, point] } : element,
      );
      commitElements(nextElements);
      return;
    }

    if (action.type === "create") {
      let width = point.x - action.start.x;
      let height = point.y - action.start.y;
      if (action.sizeLocked) {
        const size = Math.max(Math.abs(width), Math.abs(height));
        width = width < 0 ? -size : size;
        height = height < 0 ? -size : size;
      }

      const nextElements = elementsRef.current.map((element) =>
        element.id === action.id ? { ...element, width, height } : element,
      );
      commitElements(nextElements);
      return;
    }

    if (action.type === "drag") {
      const dx = point.x - action.start.x;
      const dy = point.y - action.start.y;
      const nextElements = elementsRef.current.map((element) =>
        element.id === action.id ? { ...element, x: action.original.x + dx, y: action.original.y + dy } : element,
      );
      commitElements(nextElements);
      return;
    }

    if (action.type === "resize") {
      const nextElements = elementsRef.current.map((element) =>
        element.id === action.id
          ? {
              ...element,
              width: Math.max(24, action.original.width + point.x - action.start.x),
              height: Math.max(24, action.original.height + point.y - action.start.y),
            }
          : element,
      );
      commitElements(nextElements);
    }
  }

  function handlePointerUp() {
    if (actionRef.current?.type === "create") {
      const nextElements = elementsRef.current.map((element) =>
        element.id === actionRef.current.id ? normalizeElement(element) : element,
      );
      commitElements(nextElements);
    }
    actionRef.current = null;
  }

  function handleDoubleClick(event) {
    const point = getCanvasPoint(event);
    const hitElement = selectElementAt(point);
    if (hitElement?.type === "text") {
      setSelectedId(hitElement.id);
      setEditingText(hitElement);
    }
  }

  function saveTextEdit() {
    if (!editingText) return;

    const text = editingText.text.trim();
    const nextElements = text
      ? elementsRef.current.map((element) =>
          element.id === editingText.id ? { ...element, ...editingText, text } : element,
        )
      : elementsRef.current.filter((element) => element.id !== editingText.id);
    commitElements(nextElements);
    setEditingText(null);
  }

  function handleTextChange(event) {
    const nextText = event.target.value;
    setEditingText((prev) => ({ ...prev, text: nextText }));

    const nextElements = elementsRef.current.map((element) =>
      element.id === editingText.id ? { ...element, text: nextText } : element,
    );
    commitElements(nextElements);
  }

  const editingStyle = editingText
    ? {
        left: `${(editingText.x / CANVAS_WIDTH) * 100}%`,
        top: `${(editingText.y / CANVAS_HEIGHT) * 100}%`,
        width: `${(editingText.width / CANVAS_WIDTH) * 100}%`,
        height: `${(editingText.height / CANVAS_HEIGHT) * 100}%`,
        fontFamily: editingText.fontFamily,
        fontSize: `${editingText.fontSize}px`,
        fontWeight: editingText.bold ? 700 : 400,
        fontStyle: editingText.italic ? "italic" : "normal",
        textDecoration: editingText.underline ? "underline" : "none",
        textAlign: editingText.align,
        color: editingText.color,
      }
    : null;

  return (
    <div className="whiteboard-card">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Canvas</p>
          <h3>Shared board</h3>
        </div>
        <div className="board-status">
          <span>{tool}</span>
          <span>{elements.length} elements</span>
        </div>
      </div>

      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        />

        {editingText && (
          <textarea
            ref={textEditorRef}
            className="text-editor"
            value={editingText.text}
            placeholder="Type text"
            style={editingStyle}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onChange={handleTextChange}
            onBlur={saveTextEdit}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                saveTextEdit();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Whiteboard;

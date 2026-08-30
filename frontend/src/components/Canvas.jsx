import { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";
import generateId from "../utils/generateId";

function Canvas({
    elements,
    onDrawElement,
    onUpdateElement,
    onDeleteElement,
    onCursorMove,
    selectedTool,
    selectedColor,
    strokeWidth,
    readOnly,
    stageRef,
}) {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentElementId, setCurrentElementId] = useState(null);

    const [stageSize, setStageSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight - 168,
    });

    useEffect(() => {
        const handleResize = () => {
            setStageSize({
                width: window.innerWidth,
                height: window.innerHeight - 168,
            });
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const handleMouseDown = (e) => {
        if (readOnly) {
            return;
        }

        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();

        if (!pointerPosition) {
            return;
        }

        // --------------------------------------------------
        // ERASER
        // --------------------------------------------------
        if (selectedTool === "eraser") {
            const clickedElement = findElementAtPoint(
                elements,
                pointerPosition.x,
                pointerPosition.y
            );

            if (clickedElement) {
                console.log("ERASING:", clickedElement.id);
                onDeleteElement(clickedElement.id);
            }

            return;
        }

        // --------------------------------------------------
        // TEXT
        // --------------------------------------------------
        if (selectedTool === "text") {
            const text = window.prompt("Enter text:");

            if (!text) {
                return;
            }

            onDrawElement({
                id: generateId(),
                type: "text",
                x: pointerPosition.x,
                y: pointerPosition.y,
                text,
                color: selectedColor,
                fontSize: 20,
            });

            return;
        }

        // --------------------------------------------------
        // START DRAWING
        // --------------------------------------------------
        setIsDrawing(true);

        const newId = generateId();
        let newElement;

        if (selectedTool === "freehand") {
            newElement = {
                id: newId,
                type: "freehand",
                points: [
                    pointerPosition.x,
                    pointerPosition.y,
                ],
                color: selectedColor,
                strokeWidth,
            };
        } else if (selectedTool === "line") {
            newElement = {
                id: newId,
                type: "line",
                points: [
                    pointerPosition.x,
                    pointerPosition.y,
                    pointerPosition.x,
                    pointerPosition.y,
                ],
                color: selectedColor,
                strokeWidth,
            };
        } else if (selectedTool === "rectangle") {
            newElement = {
                id: newId,
                type: "rectangle",
                x: pointerPosition.x,
                y: pointerPosition.y,
                width: 0,
                height: 0,
                color: selectedColor,
                strokeWidth,
            };
        } else if (selectedTool === "circle") {
            newElement = {
                id: newId,
                type: "circle",
                x: pointerPosition.x,
                y: pointerPosition.y,
                radius: 0,
                color: selectedColor,
                strokeWidth,
            };
        } else {
            setIsDrawing(false);
            return;
        }

        setCurrentElementId(newId);
        onDrawElement(newElement);
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();

        if (!pointerPosition) {
            return;
        }

        onCursorMove(pointerPosition.x, pointerPosition.y);

        if (!isDrawing || !currentElementId) {
            return;
        }

        const currentElement = elements.find(
            (element) =>
                element && element.id === currentElementId
        );

        if (!currentElement) {
            return;
        }

        let updatedElement;

        if (currentElement.type === "freehand") {
            updatedElement = {
                ...currentElement,
                points: [
                    ...currentElement.points,
                    pointerPosition.x,
                    pointerPosition.y,
                ],
            };
        } else if (currentElement.type === "line") {
            updatedElement = {
                ...currentElement,
                points: [
                    currentElement.points[0],
                    currentElement.points[1],
                    pointerPosition.x,
                    pointerPosition.y,
                ],
            };
        } else if (currentElement.type === "rectangle") {
            updatedElement = {
                ...currentElement,
                width:
                    pointerPosition.x -
                    currentElement.x,
                height:
                    pointerPosition.y -
                    currentElement.y,
            };
        } else if (currentElement.type === "circle") {
            const dx =
                pointerPosition.x -
                currentElement.x;

            const dy =
                pointerPosition.y -
                currentElement.y;

            updatedElement = {
                ...currentElement,
                radius: Math.sqrt(
                    dx * dx + dy * dy
                ),
            };
        } else {
            return;
        }

        onUpdateElement(updatedElement);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        setCurrentElementId(null);
    };

    return (
        <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <Layer>
                {elements
                    .filter(Boolean)
                    .map((element) => (
                        <RenderElement
                            key={element.id}
                            element={element}
                        />
                    ))}
            </Layer>
        </Stage>
    );
}

// --------------------------------------------------
// FIND ELEMENT UNDER MOUSE
// --------------------------------------------------

function findElementAtPoint(elements, mouseX, mouseY) {
    // Reverse order so the topmost/recently-created object
    // gets erased first when objects overlap.
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];

        if (!element) {
            continue;
        }

        if (element.type === "rectangle") {
            const left = Math.min(
                element.x,
                element.x + element.width
            );

            const right = Math.max(
                element.x,
                element.x + element.width
            );

            const top = Math.min(
                element.y,
                element.y + element.height
            );

            const bottom = Math.max(
                element.y,
                element.y + element.height
            );

            if (
                mouseX >= left &&
                mouseX <= right &&
                mouseY >= top &&
                mouseY <= bottom
            ) {
                return element;
            }
        }

        if (element.type === "circle") {
            const dx = mouseX - element.x;
            const dy = mouseY - element.y;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            if (distance <= element.radius) {
                return element;
            }
        }

        if (element.type === "text") {
            const width =
                element.text.length *
                (element.fontSize * 0.6);

            const height = element.fontSize;

            if (
                mouseX >= element.x &&
                mouseX <= element.x + width &&
                mouseY >= element.y &&
                mouseY <= element.y + height
            ) {
                return element;
            }
        }

        if (
            element.type === "line" ||
            element.type === "freehand"
        ) {
            const points = element.points;

            for (let j = 0; j < points.length - 2; j += 2) {
                const x1 = points[j];
                const y1 = points[j + 1];
                const x2 = points[j + 2];
                const y2 = points[j + 3];

                const distance = distanceToSegment(
                    mouseX,
                    mouseY,
                    x1,
                    y1,
                    x2,
                    y2
                );

                if (distance <= 15) {
                    return element;
                }
            }
        }
    }

    return null;
}

// Distance from a point to a line segment.
function distanceToSegment(
    px,
    py,
    x1,
    y1,
    x2,
    y2
) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
        return Math.sqrt(
            (px - x1) * (px - x1) +
            (py - y1) * (py - y1)
        );
    }

    const t =
        ((px - x1) * dx +
            (py - y1) * dy) /
        (dx * dx + dy * dy);

    const clampedT = Math.max(
        0,
        Math.min(1, t)
    );

    const closestX =
        x1 + clampedT * dx;

    const closestY =
        y1 + clampedT * dy;

    return Math.sqrt(
        (px - closestX) * (px - closestX) +
        (py - closestY) * (py - closestY)
    );
}

// --------------------------------------------------
// RENDER ELEMENT
// --------------------------------------------------

function RenderElement({ element }) {
    if (!element) {
        return null;
    }

    if (
        element.type === "freehand" ||
        element.type === "line"
    ) {
        return (
            <Line
                id={element.id}
                points={element.points}
                stroke={element.color}
                strokeWidth={element.strokeWidth}
                lineCap="round"
                lineJoin="round"
                tension={
                    element.type === "freehand"
                        ? 0.5
                        : 0
                }
            />
        );
    }

    if (element.type === "rectangle") {
        return (
            <Rect
                id={element.id}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                stroke={element.color}
                strokeWidth={element.strokeWidth}
            />
        );
    }

    if (element.type === "circle") {
        return (
            <Circle
                id={element.id}
                x={element.x}
                y={element.y}
                radius={element.radius}
                stroke={element.color}
                strokeWidth={element.strokeWidth}
            />
        );
    }

    if (element.type === "text") {
        return (
            <Text
                id={element.id}
                x={element.x}
                y={element.y}
                text={element.text}
                fontSize={element.fontSize}
                fill={element.color}
            />
        );
    }

    return null;
}

export default Canvas;
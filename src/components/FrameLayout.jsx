

export default function FrameLayout({ images, mapping, filters }) {
  if (!mapping) return null;
  const { frame, frameWidth, frameHeight, windows } = mapping;

  return (
    <div
      style={{
        position: "relative",
        width: frameWidth,
        height: frameHeight,
        background: "#fff"
      }}
    >
      {windows.map((win, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: win.left,
            top: win.top,
            width: win.width,
            height: win.height,
            overflow: "hidden",
            borderRadius: win.borderRadius || 0,
            zIndex: 5,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {images[idx] && (
            <img
              src={images[idx]}
              alt={`Photo ${idx + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
                filter: filters && filters[idx] ? filters[idx] : "none",
              }}
            />
          )}
        </div>
      ))}
      <img
        src={frame}
        alt="Frame Overlay"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
          display: "block"
        }}
        draggable={false}
      />
    </div>
  );
}

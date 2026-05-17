

export default function FrameLayout({ images, mapping, filters }) {
  if (!mapping) return null;
  const { frame, frameWidth, frameHeight, windows } = mapping;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: `${frameWidth}px`,
        aspectRatio: `${frameWidth} / ${frameHeight}`,
        background: "#fff",
        margin: "0 auto",
      }}
    >
      {windows.map((win, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: `${(win.left / frameWidth) * 100}%`,
            top: `${(win.top / frameHeight) * 100}%`,
            width: `${(win.width / frameWidth) * 100}%`,
            height: `${(win.height / frameHeight) * 100}%`,
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
          position: "relative",
          width: "100%",
          height: "auto",
          pointerEvents: "none",
          zIndex: 10,
          display: "block"
        }}
        draggable={false}
      />
    </div>
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1ed760",
          color: "#0a0a0f",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        SL
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";
import { VoxelMark } from "@/components/og/voxel-mark";
import { brand } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so the background is a full square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: brand.bg,
        }}
      >
        {/* The header mark's voxel cube. It fills its own box edge to edge, so it is drawn smaller than the icon. */}
        <VoxelMark size={116} />
      </div>
    ),
    size,
  );
}

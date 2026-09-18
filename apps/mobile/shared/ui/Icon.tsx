import BellSvg from "@/assets/bell.svg";
import BellUnreadSvg from "@/assets/bell-notification-social-media.svg";
import BookSvg from "@/assets/book-alt.svg";
import CameraSvg from "@/assets/camera.svg";
import CloseSvg from "@/assets/close.svg";
import CyborgSvg from "@/assets/cyborg.svg";
import DocumentSvg from "@/assets/document.svg";
import HomeSvg from "@/assets/home.svg";
import ImageSvg from "@/assets/image.svg";
import SettingsSvg from "@/assets/settings.svg";
import UploadSvg from "@/assets/upload.svg";

/**
 * The icon set, behind one name-keyed component.
 *
 * Screens name an icon rather than importing an `.svg` path, so a renamed or
 * replaced file is one edit here instead of a hunt through `app/`. It also
 * keeps the icon vocabulary visible in one place — which is the only way to
 * notice that two screens have started using different glyphs for the same
 * idea.
 *
 * These are FILLED glyphs with no `fill` on their paths, so `fill` set on the
 * root cascades into every path (fill is an inherited SVG property). That is
 * what lets one file serve both the selected and unselected tab state.
 */
const GLYPHS = {
  home: HomeSvg,
  upload: UploadSvg,
  /** The dictionary tab, and a word looked up anywhere else. */
  dictionary: BookSvg,
  settings: SettingsSvg,
  bell: BellSvg,
  /** Bell carrying a dot. Only for a real unread count — never decoration. */
  bellUnread: BellUnreadSvg,
  /** Marks material a model wrote, as opposed to material from a book. */
  ai: CyborgSvg,
  /** Upload source: take a photo. */
  camera: CameraSvg,
  /** Upload source: pick a photo, and the type badge on an already-added photo row. */
  image: ImageSvg,
  /** Upload source: pick a file, and the type badge on an already-added PDF/DOCX row. */
  document: DocumentSvg,
  /** Bare-icon dismiss/remove action — always paired with a visible `accessibilityLabel` on its Pressable, never used alone. */
  close: CloseSvg,
} as const;

export type IconName = keyof typeof GLYPHS;

export interface IconProps {
  name: IconName;
  /** Square edge in px. 22 suits the tab bar, 16–18 sits inline with text. */
  size?: number;
  /** Any colour string; the glyph is monochrome by design. */
  color: string;
  /**
   * Icons here are decoration beside a visible label, so they are hidden from
   * assistive tech by default. Pass a label only when the icon is the ONLY
   * thing carrying the meaning — a bare icon button.
   */
  label?: string;
}

export function Icon({ name, size = 22, color, label }: IconProps) {
  const Glyph = GLYPHS[name];
  return (
    <Glyph
      width={size}
      height={size}
      fill={color}
      accessibilityRole={label ? "image" : undefined}
      accessibilityLabel={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

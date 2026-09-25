import BellSvg from "@/assets/bell.svg";
import BellUnreadSvg from "@/assets/bell-notification-social-media.svg";
import BookSvg from "@/assets/book-alt.svg";
import CameraSvg from "@/assets/camera.svg";
import CloseSvg from "@/assets/close.svg";
import CyborgSvg from "@/assets/cyborg.svg";
import DocumentSvg from "@/assets/document.svg";
import HomeSvg from "@/assets/home.svg";
import SearchSvg from "@/assets/search.svg";
import VolumeSvg from "@/assets/volume.svg";
import ImageSvg from "@/assets/image.svg";
import SettingsSvg from "@/assets/settings.svg";
import UploadSvg from "@/assets/upload.svg";
// #40 (settings, DS-T/S8): edit, externalLink, signOut, trash, monitor, sun,
// moon, check — same filled, fill-less-path style as the icons above.
import EditSvg from "@/assets/edit.svg";
import ExternalLinkSvg from "@/assets/external-link.svg";
import SignOutSvg from "@/assets/sign-out.svg";
import TrashSvg from "@/assets/trash.svg";
import MonitorSvg from "@/assets/monitor.svg";
import SunSvg from "@/assets/sun.svg";
import MoonSvg from "@/assets/moon.svg";
import CheckSvg from "@/assets/check.svg";
// `SettingsRow`'s (S2) `trailing="chevron"` option — not in #40's own glyph
// list, but the prop can't be implemented without it.
import ChevronRightSvg from "@/assets/chevron-right.svg";
// #65 (today-session DS11, exercise DS-E7, folder-study DS-S2, folder-map DS-M7).
import ReviewSvg from "@/assets/review.svg";
import SparkleSvg from "@/assets/sparkle.svg";
import PairSvg from "@/assets/pair.svg";
import ChevronDownSvg from "@/assets/chevron-down.svg";
import ArrowRightSvg from "@/assets/arrow-right.svg";
import ArrowLeftSvg from "@/assets/arrow-left.svg";
import StarSvg from "@/assets/star.svg";
import MoreSvg from "@/assets/more.svg";
import PracticeSvg from "@/assets/practice.svg";

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
  /** Поле поиска по словарю. */
  search: SearchSvg,
  /** «Послушать» — озвучка слова (#86). */
  volume: VolumeSvg,
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
  /** Settings (#40): "Изменить имя". */
  edit: EditSvg,
  /** Settings (#40): source rows that open an external site. */
  externalLink: ExternalLinkSvg,
  /** Settings (#40): "Выйти". */
  signOut: SignOutSvg,
  /** Settings (#40): "Удалить аккаунт". */
  trash: TrashSvg,
  /** Settings (#40): theme choice "Системная". */
  monitor: MonitorSvg,
  /** Settings (#40): theme choice "Светлая". */
  sun: SunSvg,
  /** Settings (#40): theme choice "Тёмная". */
  moon: MoonSvg,
  /** Settings (#40, DS11): `SaveStatus` "Сохранено". */
  check: CheckSvg,
  /** Settings (#40): `SettingsRow trailing="chevron"`. */
  chevronRight: ChevronRightSvg,
  /** #65 DS11: "Повторить" stat line, the soft-review self-rate button. */
  review: ReviewSvg,
  /** #65 DS11: "Новые слова" stat line, the day-summary celebration. */
  sparkle: SparkleSvg,
  /** #65 DS11: "Разобрать пару" stat line, the confusion-pair card. */
  pair: PairSvg,
  /** #65 DS11: `BudgetChip`'s "▾". */
  chevronDown: ChevronDownSvg,
  /** #65 DS11: `HanziText`-adjacent forward affordances (e.g. a "Дальше" arrow). */
  arrowRight: ArrowRightSvg,
  /** #65 DS-M7: folder-map "К словарю"/back affordance. */
  arrowLeft: ArrowLeftSvg,
  /** #65 DS-M7: "Устойчиво" stage mark. */
  star: StarSvg,
  /** #65 DS-M7: `ActionRow`'s "⋯" overflow ("Действия с папкой"). */
  more: MoreSvg,
  /** #65 DS-S2: the practice-round glyph on `StudyButton`. */
  practice: PracticeSvg,
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

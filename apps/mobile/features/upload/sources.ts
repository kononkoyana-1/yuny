import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { MATERIAL_MIME_TYPES } from "@yuny/shared";

/** What the two pickers agree on, before any of §3's validation runs. */
export interface RawAsset {
  uri: string;
  mimeType?: string | null;
  name?: string | null;
  size?: number;
}

export type PickOutcome =
  | { status: "ok"; assets: RawAsset[] }
  | { status: "cancelled" }
  /** Camera or media-library permission was refused — §3 point 6. */
  | { status: "denied" };

/** One photo (design spec §3: "Камера → одно фото"). */
export async function pickFromCamera(): Promise<PickOutcome> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { status: "denied" };

  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"] });
  if (result.canceled) return { status: "cancelled" };

  return { status: "ok", assets: result.assets.map(toRawAsset) };
}

export async function pickFromGallery(selectionLimit: number): Promise<PickOutcome> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: "denied" };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit,
  });
  if (result.canceled) return { status: "cancelled" };

  return { status: "ok", assets: result.assets.map(toRawAsset) };
}

/**
 * The system file picker needs no permission request of its own on any of
 * the three targets — it is the OS's own UI, not app-controlled storage
 * access — so there is no `denied` outcome here.
 */
export async function pickFromFiles(): Promise<PickOutcome> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: true,
    type: [...MATERIAL_MIME_TYPES.pdf, ...MATERIAL_MIME_TYPES.docx, "image/*"],
  });
  if (result.canceled) return { status: "cancelled" };

  return {
    status: "ok",
    assets: result.assets.map((asset) => ({
      uri: asset.uri,
      mimeType: asset.mimeType,
      name: asset.name,
      size: asset.size,
    })),
  };
}

function toRawAsset(asset: ImagePicker.ImagePickerAsset): RawAsset {
  return { uri: asset.uri, mimeType: asset.mimeType, name: asset.fileName, size: asset.fileSize };
}

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

export async function uploadPageImage(
  uid: string,
  kind: "avatar" | "cover",
  file: File
) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `pages/${uid}/${kind}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadCategoryImage(categoryId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `gift_categories/${categoryId}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

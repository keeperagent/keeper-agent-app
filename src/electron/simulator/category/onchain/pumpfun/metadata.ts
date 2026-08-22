import { CreateTokenMetadata } from "./types";
import { logEveryWhere } from "@/electron/service/util";

export const uploadTokenMetadata = async (
  metadata: CreateTokenMetadata,
): Promise<[{ metadataUri: string } | null, Error | null]> => {
  const formData = new FormData();
  if (metadata?.file instanceof Blob) {
    formData.append("file", metadata?.file, "image.png"); // Add filename
  }

  formData.append("name", metadata?.name);
  formData.append("symbol", metadata?.symbol);
  formData.append("description", metadata?.description);
  formData.append("twitter", metadata?.twitter || "");
  formData.append("telegram", metadata?.telegram || "");
  formData.append("website", metadata?.website || "");
  formData.append("showName", "true");

  try {
    const request = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
      credentials: "same-origin",
    });

    if (request.status === 500) {
      const errorText = await request.text();
      throw new Error(
        `Server error (500): ${errorText || "No error details available"}`,
      );
    }

    if (!request.ok) {
      throw new Error(`HTTP error! status: ${request.status}`);
    }

    const responseText = await request.text();
    if (!responseText) {
      throw new Error("Empty response received from server");
    }

    try {
      return [JSON.parse(responseText), null];
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  } catch (error: any) {
    logEveryWhere({
      message: `uploadTokenMetadata() error: ${error?.message}`,
    });
    return [null, new Error(error?.message)];
  }
};

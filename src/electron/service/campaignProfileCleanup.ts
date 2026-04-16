import _ from "lodash";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { deleteFolder } from "@/electron/service/file";
import { sleep } from "@/electron/service/util";
import { ICampaignProfile } from "@/electron/type";

const CHUNK_SIZE = 100;

export const deleteProfileFoldersByIds = async (
  listId: number[],
  totalCount: number,
  onProgress: (percent: number) => void,
): Promise<void> => {
  await sleep(2000);

  if (totalCount === 0) {
    onProgress(100);
    return;
  }

  const chunks = _.chunk(listId, CHUNK_SIZE);
  let totalDeleted = 0;

  for (const idChunk of chunks) {
    const [listProfileRes] = await campaignProfileDB.getListCampaignProfile({
      page: 1,
      pageSize: idChunk.length,
      listId: idChunk,
    });
    const profiles = (listProfileRes?.data || []) as ICampaignProfile[];

    for (const profile of profiles) {
      if (profile.profileFolderPath) {
        await deleteFolder(profile.profileFolderPath);
      }
    }

    totalDeleted += idChunk.length;
    const percent = Math.round((totalDeleted / totalCount) * 100);
    if (percent > 1) {
      onProgress(percent);
    }
  }
};

export const deleteProfileRecordsByIds = async (
  listId: number[],
  totalCount: number,
  onProgress: (percent: number) => void,
): Promise<void> => {
  await sleep(2000);

  if (totalCount === 0) {
    onProgress(100);
    return;
  }

  const chunks = _.chunk(listId, CHUNK_SIZE);
  let totalDeleted = 0;

  for (const idChunk of chunks) {
    await campaignProfileDB.deleteCampaignProfile(idChunk);
    totalDeleted += idChunk.length;
    const percent = Math.round((totalDeleted / totalCount) * 100);
    if (percent > 1) {
      onProgress(percent);
    }
  }
};

import { nanoid } from 'nanoid';

import { getSiteSettings } from '../site-settings/get-site-settings';
import {
  SITE_SETTINGS_TELEMETRY_ID,
  ZSiteSettingsTelemetrySchema,
} from '../site-settings/schemas/telemetry';
import { upsertSiteSetting } from '../site-settings/upsert-site-setting';
import { sendInstance } from './send-instance';

type RegisterInstanceOptions = {
  version: string;
};

export const registerInstance = async ({ version }: RegisterInstanceOptions) => {
  const instanceResponse = await getSiteSettings().then((settings) =>
    settings.find((setting) => setting.id === SITE_SETTINGS_TELEMETRY_ID),
  );

  const instance = ZSiteSettingsTelemetrySchema.parse(instanceResponse);

  if (!instance) {
    const upsert = await upsertSiteSetting({
      data: {
        instanceId: nanoid(),
      },
      enabled: true,
      id: SITE_SETTINGS_TELEMETRY_ID,
      userId: null,
    });

    const instance = ZSiteSettingsTelemetrySchema.parse(upsert);

    return await sendInstance({
      uniqueId: instance.data?.instanceId,
      timestamp: new Date(),
      version,
    });
  }

  return await sendInstance({
    uniqueId: instance.data.instanceId,
    timestamp: new Date(),
    version,
  });
};

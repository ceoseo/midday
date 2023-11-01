import { Novu } from "@novu/node";

const novu = new Novu(process.env.NOVU_API_KEY!);
const API_ENDPOINT = "https://api.novu.co/v1";

export enum TriggerEvents {
  TransactionNew = "transaction_new",
}

type TriggerUser = {
  subscriberId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  teamId: string;
};

type TriggerPayload = {
  event: TriggerEvents;
  html?: string;
  payload: any;
  users: TriggerUser[];
  tenant?: string; // NOTE: Currently no way to listen for messages with tenant, we use team_id + user_id for unique
};

export async function trigger(data: TriggerPayload) {
  return novu.trigger(data.event, {
    to: data.users.map((user) => ({
      ...user,
      //   Prefix subscriber id with team id
      subscriberId: `${user.teamId}_${user.subscriberId}`,
    })),
    payload: data.payload,
    tenant: data.tenant,
  });
}

type GetSubscriberPreferencesParams = {
  teamId: string;
  subscriberId: string;
};

export async function getSubscriberPreferences({
  subscriberId,
  teamId,
}: GetSubscriberPreferencesParams) {
  const response = await fetch(
    `${API_ENDPOINT}/subscribers/${teamId}_${subscriberId}/preferences`,
    {
      method: "GET",
      headers: {
        Authorization: `ApiKey ${process.env.NOVU_API_KEY!}`,
      },
    },
  );

  return response.json();
}

type UpdateSubscriberPreferenceParams = {
  subscriberId: string;
  teamId: string;
  templateId: string;
  type: string;
  enabled: boolean;
};

export async function updateSubscriberPreference({
  subscriberId,
  teamId,
  templateId,
  type,
  enabled,
}: UpdateSubscriberPreferenceParams) {
  const response = await fetch(
    `${API_ENDPOINT}/subscribers/${teamId}_${subscriberId}/preferences/${templateId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `ApiKey ${process.env.NOVU_API_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: {
          type,
          enabled,
        },
      }),
    },
  );

  return response.json();
}
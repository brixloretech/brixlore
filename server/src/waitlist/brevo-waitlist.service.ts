import { Injectable, ServiceUnavailableException } from '@nestjs/common';

const Brevo = require('sib-api-v3-sdk');

type WaitlistContact = {
  name: string;
  email: string;
  phone: string;
  emailConsent: boolean;
  smsConsent: boolean;
};

@Injectable()
export class BrevoWaitlistService {
  private readonly api: any;

  constructor() {
    const client = Brevo.ApiClient.instance;
    client.authentications['api-key'].apiKey = process.env.BREVO_API;
    this.api = new Brevo.ContactsApi();
  }

  async sync(contact: WaitlistContact): Promise<void> {
    const listIds = this.getListIds(contact);
    const [firstName, ...lastNameParts] = contact.name.trim().split(/\s+/);

    try {
      await this.api.createContact({
        email: contact.email,
        attributes: {
          FIRSTNAME: firstName,
          ...(lastNameParts.length ? { LASTNAME: lastNameParts.join(' ') } : {}),
          SMS: contact.phone,
        },
        updateEnabled: true,
      });
      await Promise.all(
        listIds.map((listId) =>
          this.api.addContactToList(listId, { emails: [contact.email] }),
        ),
      );
    } catch (error) {
      console.error('[Waitlist] Brevo contact sync failed:', error);
      throw new ServiceUnavailableException(
        'Unable to join the waitlist right now. Please try again.',
      );
    }
  }

  private getListIds(contact: WaitlistContact): number[] {
    const required = [
      process.env.BREVO_WAITLIST_LIST_ID,
      ...(contact.emailConsent ? [process.env.BREVO_WAITLIST_EMAIL_LIST_ID] : []),
      ...(contact.smsConsent ? [process.env.BREVO_WAITLIST_SMS_LIST_ID] : []),
    ];

    const listIds = required.map((value) => Number(value));
    if (listIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new ServiceUnavailableException(
        'Waitlist signup is temporarily unavailable. Please try again later.',
      );
    }

    return [...new Set(listIds)];
  }
}

import { post } from "@/lib/api-client";
import type {
  CreateWaitlistEntryRequestDto,
} from "@/types/api";

export const waitlistService = {
  submit(body: CreateWaitlistEntryRequestDto): Promise<{ message: string }> {
    return post<{ message: string }>("waitlist", body);
  },
};

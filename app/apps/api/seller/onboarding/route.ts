import { type NextRequest } from "next/server";
import { onboardingHandler } from "@/app/apps/api/seller/profile/route";

export const POST = (req: NextRequest) => onboardingHandler(req);

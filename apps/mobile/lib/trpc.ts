import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@fit-sihirbaz/api";

export const trpc = createTRPCReact<AppRouter>();

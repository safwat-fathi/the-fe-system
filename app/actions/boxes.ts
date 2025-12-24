"use server";

import { boxesService } from "@/services/api";

export async function getBoxesAction() {
  return boxesService.getBoxes();
}

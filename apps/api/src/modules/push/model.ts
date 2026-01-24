import { z } from "zod";

export namespace PushModel {
  // Query para obter ataques da Legend League por clan
  export const getAttacksQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
  });

  export type GetAttacksQuery = z.infer<typeof getAttacksQuery>;

  // Resposta com ataques da Legend League (qualquer estrutura)
  export const getAttacksResponse = z.any();

  export type GetAttacksResponse = z.infer<typeof getAttacksResponse>;

  // Respostas de erro padronizadas
  export const errorResponse = z.object({
    message: z.string(),
  });

  export type ErrorResponse = z.infer<typeof errorResponse>;
}

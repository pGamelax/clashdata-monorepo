import { env } from "@/env";
import { verifyClanOwnership } from "@/utils/verify-clan-ownership";

export class PushService {
  async getLegendAttacksByClan(params: { clanTag: string; userId: string }) {
    const { clanTag, userId } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    const responseClashOfClans = await fetch(
      `https://api.clashofclans.com/v1/clans/${encodeURIComponent(clanTag)}`,
      { headers: { Authorization: `Bearer ${env.TOKEN_COC}` } },
    ).then(async (res) => await res.json());

    const playersTags: string[] = responseClashOfClans.memberList.map(
      (player: any) => player.tag,
    );

    const response = await fetch(
      `https://api.clashperk.com/v1/legends/attacks/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${env.TOKEN_COC}` },
        body: {
          playerTags: playersTags,
        },
      },
    );
    // const apiData = await response.json();
    // const playerMap = new Map<string, any>();

    // apiData.items.forEach((war: any) => {
    //   const isNormalOrder = war.clan.tag === clanTag;
    //   const ourClan = isNormalOrder ? war.clan : war.opponent;
    //   const enemyClan = isNormalOrder ? war.opponent : war.clan;

    //   if (!war.tag) {
    //     ourClan.members.forEach((member: any) => {
    //       if (!playerMap.has(member.tag)) {
    //         playerMap.set(member.tag, {
    //           tag: member.tag,
    //           name: member.name,
    //           townhallLevel: member.townhallLevel,
    //           allAttacks: [],
    //           allDefenses: [],
    //         });
    //       }

    //       const p = playerMap.get(member.tag);

    //       if (member.attacks) {
    //         member.attacks.forEach((att: any) => {
    //           p.allAttacks.push({
    //             date: war.endTime,
    //             stars: att.stars,
    //             destruction: att.destructionPercentage,
    //             opponent: enemyClan.name,
    //           });
    //         });
    //       }

    //       if (member.bestOpponentAttack) {
    //         p.allDefenses.push({
    //           date: war.endTime,
    //           stars: member.bestOpponentAttack.stars,
    //           destruction: member.bestOpponentAttack.destructionPercentage,
    //         });
    //       }
    //     });
    //   }
    // });
    // return { players: Array.from(playerMap.values()) };

    return response;
  }
}

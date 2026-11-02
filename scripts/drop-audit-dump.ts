// drop-audit：导出 装备→掉落层/怪/概率（读运行时最终 ENEMIES，含 drop-plan/r14b/eg-sets 覆盖）
import '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { ITEMS } from '../src/data/items';
import { FLOORS } from '../src/data/world';
import { FLOOR_TARGET_LV } from '../src/data/balance';
import { EQUIP_META } from '../src/data/equip-official';
const rows: string[] = [];
const where: Record<string, string[]> = {};
FLOORS.forEach((f: any, i: number) => {
  const ids = [...new Set(f.spawns.map((s: any) => s.id))] as string[];
  for (const id of ids) { const u: any = ENEMIES[id]; if (!u) continue;
    for (const d of u.drops ?? []) { const it: any = ITEMS[d.item]; if (!it?.slot) continue;
      rows.push([i + 1, f.name, FLOOR_TARGET_LV[i], id, u.name, u.tier ?? '', d.item, it.name, it.slot, it.req ?? 0, `1/${Math.round(1 / d.chance)}`, EQUIP_META[d.item]?.official ?? ''].join('\t')); }
    for (const s of u.setDrop ?? []) { const it: any = ITEMS[s]; rows.push([i + 1, f.name, FLOOR_TARGET_LV[i], id, u.name, u.tier ?? '', s, it?.name, it?.slot, it?.req ?? 0, `setDrop p=${u.setChance ?? 1}/件池${u.setDrop.length}`, EQUIP_META[s]?.official ?? ''].join('\t')); }
  } });
console.log('floor\tfname\tflv\tunit\tuname\ttier\titem\tiname\tslot\treq\tchance\tofficial');
console.log(rows.join('\n'));
// 无来源的装备
const src = new Set(rows.map(r => r.split('\t')[6]));
console.error('NO_SOURCE:', Object.values(ITEMS).filter((i: any) => i.slot && !src.has(i.id)).map((i: any) => `${i.id}(${i.name},req${i.req})`).join(' '));
console.error('FLOORS:', FLOORS.map((f: any, i: number) => `${i + 1}${f.name}L${FLOOR_TARGET_LV[i]}`).join(' | '));

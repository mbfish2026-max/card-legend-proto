/** fix/portal-same：「下一层」「上一层」两个传送门共用的素材与外观参数（BattleScene.syncPortalArt 唯一创建函数） */
export type PortalDir = 'next' | 'back';
export type PortalKind = 'sheet' | 'still' | 'gfx';
/** 同源素材：public/assets/portal_exit_sheet.png（4 帧）→ portal_exit.png（静态）→ 程序占位 */
export const PORTAL_TEX = { sheet: 'portal_exit_sheet', still: 'portal_exit' } as const;
export const PORTAL_W = 150, PORTAL_H = 225;
export const portalArtKind = (sheet: boolean, still: boolean): PortalKind => sheet ? 'sheet' : still ? 'still' : 'gfx';
/** 方向区分：下一层水平镜像 + 偏紫着色；上一层原图。gfx 为缺图占位的填充/外圈/内圈色 */
export const PORTAL_LOOK: Record<PortalDir, { flip: boolean; tint: number; gfx: [number, number, number] }> = {
  back: { flip: false, tint: 0xffffff, gfx: [0x3a6cff, 0x9fc0ff, 0xd0e0ff] },
  next: { flip: true, tint: 0xe8b8ff, gfx: [0x8a2cff, 0xd090ff, 0xf0d0ff] },
};
/** 方向文字 */
export const PORTAL_TEXT: Record<PortalDir, string> = { next: '下一层', back: '上一层' };

import type { Special } from '@jaychtw/match3-core';
export const shapes=['pepper_bun','grilled_squid','candied_fruit','grilled_corn','bubble_tea','chicken_cutlet'] as const;
export type Shape=typeof shapes[number];
const symbols:Record<Special,string>={horizontal:'↔',vertical:'↕',bomb:'✹',color:'◇'};
export function piece(shape:Shape,special:Special|null=null):string {
 return `<span class="piece ${special??''}" aria-hidden="true"><span class="snack snack-${shape}" data-snack="${shape}"></span>${special?`<span class="special-badge ${special}">${symbols[special]}</span>`:''}</span>`;
}

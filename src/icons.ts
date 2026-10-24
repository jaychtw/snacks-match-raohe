const paths:Record<string,string>={
 lantern:'M8 5h8M12 2v3M8 19h8M12 19v3M7 6c-4 4-4 8 0 12h10c4-4 4-8 0-12ZM9 7c-2 3-2 7 0 10M15 7c2 3 2 7 0 10',
 sound:'m3 10 4 0 5-4v12l-5-4H3Zm12-2c3 2 3 6 0 8m3-11c5 4 5 10 0 14',
 settings:'m9 3 1-1h4l1 3 3 1 3 3-2 3 1 3-3 3-3-1-2 2-4-1-1-3-3-1V10l3-2Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
 pause:'M8 5v14M16 5v14',
 hint:'M8 15c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7ZM9 19h6M10 22h4M12 2v1',
 shuffle:'M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 6-6m3-5c1-1 2-1 3-1h3m-4-4 4 4-4 4',
 arrow:'M5 12h14m-6-6 6 6-6 6',
 book:'M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3ZM12 6v15',
 restart:'M4 10a8 8 0 1 1 0 5M4 3v7h7',
 home:'m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7',
 check:'m5 12 4 4L19 6',
};
export const icon=(name:string)=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(paths[name]??paths.lantern).split(' M').map(p=>`<path d="${p}"/>`).join('')}</svg>`;

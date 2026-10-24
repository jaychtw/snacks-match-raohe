export interface SoundPreferences {muted:boolean;volume:number;music:boolean;effects:boolean}
export type Cue='select'|'swap'|'invalid'|'match'|'create'|'activate'|'cascade'|'won'|'lost';
const notes:Record<Cue,number[]>={select:[440],swap:[392,523],invalid:[220,196],match:[523,659],create:[659,784,1047],activate:[392,784,1175],cascade:[659,880,1047],won:[523,659,784,1047],lost:[392,330,262]};
/** Original synthesized audio; no external assets, samples, services or licenses. */
export class Sound {
 context:AudioContext|null=null; master:GainNode|null=null;timer:ReturnType<typeof setTimeout>|null=null;step=0;voices=0;
 preferences:SoundPreferences={muted:false,volume:.45,music:false,effects:true};
 get available(){return typeof globalThis.AudioContext==='function';}
 async unlock(){
  if(!this.available)return;
  try {if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.connect(this.context.destination);this.apply();}if(this.context.state==='suspended')await this.context.resume();this.music();}catch{/* browser audio permission stays optional */}
 }
 apply(){if(this.master&&this.context)this.master.gain.setValueAtTime(this.preferences.muted?0:this.preferences.volume,this.context.currentTime);this.music();}
 private tone(frequency:number,delay:number,duration:number,gain=.08,type:OscillatorType='sine'){
  const context=this.context;if(!context||context.state!=='running'||!this.master||this.voices>=32)return;
  this.voices++;const oscillator=context.createOscillator(),envelope=context.createGain(),at=context.currentTime+delay;
  oscillator.type=type;oscillator.frequency.value=frequency;envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(gain,at+.012);envelope.gain.exponentialRampToValueAtTime(.001,at+duration);oscillator.connect(envelope);envelope.connect(this.master);oscillator.start(at);oscillator.stop(at+duration+.02);oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();this.voices--;};
 }
 cue(cue:Cue){if(this.preferences.muted||!this.preferences.effects)return;notes[cue].forEach((n,i)=>this.tone(n,i*.065,.16,cue==='activate'?.07:.045,cue==='invalid'?'triangle':'sine'));}
 music(){
  const active=this.preferences.music&&!this.preferences.muted&&this.context?.state==='running'&&!(typeof document!=='undefined'&&document.hidden);
  if(!active){if(this.timer)clearTimeout(this.timer);this.timer=null;return;}
  if(this.timer)return;
  const melody=[262,330,392,330,294,349,440,349];
  const tick=()=>{this.tone(melody[this.step++%melody.length],0,.65,.018);this.timer=setTimeout(tick,700);};
  tick();
 }
}
